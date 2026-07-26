import { GAME_STATUSES } from '../../services/chess/store/GameStore.js';
import { SOCKET_EVENTS } from '../constants/socket-events.constants.js';
import { createSocketSuccess, emitSocketFailure, emitSocketSuccess } from '../socket-events.js';

// Gameplay handlers synchronize authoritative ChessService results. They never
// inspect legal moves or calculate board state; clients request actions, and
// ChessService decides whether the game changes.
export function registerGameplayHandlers({ io, socket, roomManager, chessService, logger }) {
  socket.on(SOCKET_EVENTS.CREATE_GAME, async (payload = {}, acknowledge) => {
    try {
      const game = await chessService.createGame({ displayName: payload.displayName });
      const room = roomManager.createRoom({
        roomId: game.gameId,
        socketId: socket.id,
        player: game.whitePlayer,
      });

      socket.join(game.gameId);
      logger.info({ socketId: socket.id, gameId: game.gameId }, 'Socket game created');

      return emitSocketSuccess(socket, SOCKET_EVENTS.GAME_CREATED, { game, room }, acknowledge);
    } catch (error) {
      return emitGameplayError({ socket, error, acknowledge, logger });
    }
  });

  socket.on(SOCKET_EVENTS.JOIN_GAME, async (payload = {}, acknowledge) => {
    try {
      const gameId = normalizeGameId(payload);

      roomManager.assertCanJoinRoom(gameId, {
        socketId: socket.id,
        playerId: payload.playerId,
      });

      const game = await chessService.joinGame(gameId, {
        playerId: payload.playerId,
        displayName: payload.displayName,
      });
      const room = roomManager.joinRoom({
        roomId: gameId,
        socketId: socket.id,
        player: game.players.black,
      });

      socket.join(gameId);
      logger.info({ socketId: socket.id, gameId }, 'Socket game joined');

      emitSocketSuccess(socket, SOCKET_EVENTS.GAME_JOINED, { game, room }, acknowledge);
      io.to(gameId).emit(
        SOCKET_EVENTS.GAME_STARTED,
        createSocketSuccess({
          game,
          room,
        }),
      );

      return undefined;
    } catch (error) {
      return emitGameplayError({ socket, error, acknowledge, logger });
    }
  });

  socket.on(SOCKET_EVENTS.MAKE_MOVE, async (payload = {}, acknowledge) => {
    try {
      const gameId = normalizeGameId(payload);
      const game = await chessService.requestMove(gameId, {
        playerId: payload.playerId,
        move: payload.move,
      });

      logger.info(
        {
          socketId: socket.id,
          gameId,
          playerId: payload.playerId,
          san: game.move.san,
          status: game.status,
        },
        'Socket move accepted',
      );

      emitSocketSuccess(
        socket,
        SOCKET_EVENTS.MOVE_ACCEPTED,
        { game, move: game.move },
        acknowledge,
      );
      broadcastBoardState(io, gameId, game);
      broadcastGameStatus(io, gameId, game);

      return undefined;
    } catch (error) {
      logger.warn(
        {
          socketId: socket.id,
          gameId: payload.gameId,
          code: error.code,
          message: error.message,
        },
        'Socket move rejected',
      );

      return emitSocketFailure(
        socket,
        error.code ?? 'MOVE_REJECTED',
        error.message ?? 'Move was rejected.',
        acknowledge,
        SOCKET_EVENTS.MOVE_REJECTED,
      );
    }
  });

  socket.on(SOCKET_EVENTS.REQUEST_GAME_STATE, async (payload = {}, acknowledge) => {
    try {
      const gameId = normalizeGameId(payload);
      const game = await chessService.getGame(gameId);

      if (payload.playerId) {
        roomManager.restoreRoom({
          roomId: gameId,
          players: [game.players.white, game.players.black],
        });
        const room = roomManager.reconnectMember({
          roomId: gameId,
          socketId: socket.id,
          playerId: payload.playerId,
        });
        const reconnectedGame = await chessService.markPlayerConnected(gameId, {
          playerId: payload.playerId,
        });

        socket.join(gameId);
        logger.info(
          { socketId: socket.id, gameId, playerId: payload.playerId },
          'Socket game reconnected',
        );

        return emitSocketSuccess(
          socket,
          SOCKET_EVENTS.GAME_STATE,
          { game: reconnectedGame, room },
          acknowledge,
        );
      }

      logger.info({ socketId: socket.id, gameId }, 'Socket game state requested');
      return emitSocketSuccess(socket, SOCKET_EVENTS.GAME_STATE, { game }, acknowledge);
    } catch (error) {
      return emitGameplayError({ socket, error, acknowledge, logger });
    }
  });

  socket.on(SOCKET_EVENTS.OFFER_DRAW, async (payload = {}, acknowledge) => {
    try {
      const gameId = normalizeGameId(payload);
      const game = await chessService.offerDraw(gameId, { playerId: payload.playerId });

      logger.info(
        { socketId: socket.id, gameId, playerId: payload.playerId },
        'Socket draw offered',
      );
      io.to(gameId).emit(SOCKET_EVENTS.DRAW_OFFER, createSocketSuccess({ game }));

      if (typeof acknowledge === 'function') {
        acknowledge(createSocketSuccess({ game }));
      }

      return undefined;
    } catch (error) {
      return emitGameplayError({ socket, error, acknowledge, logger });
    }
  });

  socket.on(SOCKET_EVENTS.ACCEPT_DRAW, async (payload = {}, acknowledge) => {
    try {
      const gameId = normalizeGameId(payload);
      const game = await chessService.acceptDraw(gameId, { playerId: payload.playerId });

      logger.info(
        { socketId: socket.id, gameId, playerId: payload.playerId },
        'Socket draw accepted',
      );
      io.to(gameId).emit(SOCKET_EVENTS.DRAW, createSocketSuccess({ game }));
      io.to(gameId).emit(SOCKET_EVENTS.GAME_OVER, createSocketSuccess(createGameOverPayload(game)));

      if (typeof acknowledge === 'function') {
        acknowledge(createSocketSuccess({ game }));
      }

      return undefined;
    } catch (error) {
      return emitGameplayError({ socket, error, acknowledge, logger });
    }
  });

  socket.on(SOCKET_EVENTS.DECLINE_DRAW, async (payload = {}, acknowledge) => {
    try {
      const gameId = normalizeGameId(payload);
      const game = await chessService.declineDraw(gameId, { playerId: payload.playerId });

      logger.info(
        { socketId: socket.id, gameId, playerId: payload.playerId },
        'Socket draw declined',
      );
      io.to(gameId).emit(SOCKET_EVENTS.DRAW_DECLINED, createSocketSuccess({ game }));

      if (typeof acknowledge === 'function') {
        acknowledge(createSocketSuccess({ game }));
      }

      return undefined;
    } catch (error) {
      return emitGameplayError({ socket, error, acknowledge, logger });
    }
  });

  socket.on(SOCKET_EVENTS.RESIGN_GAME, async (payload = {}, acknowledge) => {
    try {
      const gameId = normalizeGameId(payload);
      const game = await chessService.resignGame(gameId, { playerId: payload.playerId });

      logger.info(
        { socketId: socket.id, gameId, playerId: payload.playerId },
        'Socket player resigned',
      );
      io.to(gameId).emit(SOCKET_EVENTS.PLAYER_RESIGNED, createSocketSuccess({ game }));
      io.to(gameId).emit(SOCKET_EVENTS.GAME_OVER, createSocketSuccess(createGameOverPayload(game)));

      if (typeof acknowledge === 'function') {
        acknowledge(createSocketSuccess({ game }));
      }

      return undefined;
    } catch (error) {
      return emitGameplayError({ socket, error, acknowledge, logger });
    }
  });
}

function broadcastBoardState(io, gameId, game) {
  io.to(gameId).emit(
    SOCKET_EVENTS.BOARD_UPDATED,
    createSocketSuccess({
      game,
      board: game.board,
      fen: game.fen,
      pgn: game.pgn,
      moveHistory: game.moveHistory,
      status: game.status,
      turn: game.turn,
    }),
  );
}

function broadcastGameStatus(io, gameId, game) {
  if (game.status === GAME_STATUSES.CHECK) {
    io.to(gameId).emit(SOCKET_EVENTS.CHECK, createSocketSuccess({ game }));
  }

  if (game.status === GAME_STATUSES.CHECKMATE) {
    io.to(gameId).emit(SOCKET_EVENTS.CHECKMATE, createSocketSuccess({ game }));
    io.to(gameId).emit(SOCKET_EVENTS.GAME_OVER, createSocketSuccess(createGameOverPayload(game)));
  }

  if (game.status === GAME_STATUSES.DRAW) {
    io.to(gameId).emit(SOCKET_EVENTS.DRAW, createSocketSuccess({ game }));
    io.to(gameId).emit(SOCKET_EVENTS.GAME_OVER, createSocketSuccess(createGameOverPayload(game)));
  }
}

function createGameOverPayload(game) {
  return {
    winner: game.winner,
    loser: game.loser,
    draw: game.status === GAME_STATUSES.DRAW,
    finalPgn: game.pgn,
    finalFen: game.fen,
    finalStatus: game.status,
    game,
  };
}

function emitGameplayError({ socket, error, acknowledge, logger }) {
  const code = error.code ?? 'SOCKET_ERROR';
  const message = error.message ?? 'Socket request failed.';

  logger.warn(
    {
      socketId: socket.id,
      code,
      message,
    },
    'Socket gameplay request failed',
  );

  return emitSocketFailure(socket, code, message, acknowledge, SOCKET_EVENTS.ERROR);
}

function normalizeGameId(payload) {
  const gameId = payload.gameId ?? payload.roomId;
  return typeof gameId === 'string' ? gameId.trim() : gameId;
}
