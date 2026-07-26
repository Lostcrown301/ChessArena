import { SOCKET_EVENTS } from '../constants/socket-events.constants.js';
import { emitSocketFailure, emitSocketSuccess } from '../socket-events.js';
import { RoomManagerError } from './room-manager.js';

// Room handlers translate Socket.IO events into room operations. They do not
// validate chess moves or synchronize board state; that belongs to later
// gameplay synchronization work.
export function registerRoomHandlers({ socket, roomManager, chessService, logger }) {
  socket.on(SOCKET_EVENTS.CREATE_ROOM, async (payload = {}, acknowledge) => {
    try {
      const game = await chessService.createGame({ displayName: payload.displayName });
      const room = roomManager.createRoom({
        roomId: game.gameId,
        socketId: socket.id,
        player: game.whitePlayer,
      });

      socket.join(room.roomId);
      logger.info({ socketId: socket.id, roomId: room.roomId }, 'Socket room created');

      return emitSocketSuccess(socket, SOCKET_EVENTS.ROOM_CREATED, { room, game }, acknowledge);
    } catch (error) {
      return handleSocketError({ socket, error, acknowledge, logger });
    }
  });

  socket.on(SOCKET_EVENTS.JOIN_ROOM, async (payload = {}, acknowledge) => {
    try {
      const roomId = normalizeRoomId(payload);

      roomManager.assertCanJoinRoom(roomId, {
        socketId: socket.id,
        playerId: payload.playerId,
      });

      const game = await chessService.joinGame(roomId, {
        playerId: payload.playerId,
        displayName: payload.displayName,
      });
      const room = roomManager.joinRoom({
        roomId,
        socketId: socket.id,
        player: game.players.black,
      });

      socket.join(roomId);
      socket.to(roomId).emit(SOCKET_EVENTS.PLAYER_JOINED, {
        success: true,
        data: {
          room,
          player: game.players.black,
        },
      });
      logger.info({ socketId: socket.id, roomId }, 'Socket room joined');

      return emitSocketSuccess(socket, SOCKET_EVENTS.ROOM_JOINED, { room, game }, acknowledge);
    } catch (error) {
      return handleSocketError({ socket, error, acknowledge, logger });
    }
  });

  socket.on(SOCKET_EVENTS.LEAVE_ROOM, (payload = {}, acknowledge) => {
    try {
      const roomId = normalizeRoomId(payload);
      const result = roomManager.leaveRoom({ roomId, socketId: socket.id });

      socket.leave(roomId);
      socket.to(roomId).emit(SOCKET_EVENTS.PLAYER_LEFT, {
        success: true,
        data: {
          roomId,
          member: result.member,
          room: result.room,
        },
      });
      logger.info({ socketId: socket.id, roomId, deleted: result.deleted }, 'Socket room left');

      if (result.deleted) {
        emitSocketSuccess(socket, SOCKET_EVENTS.ROOM_DELETED, { roomId }, undefined);
      }

      return emitSocketSuccess(
        socket,
        SOCKET_EVENTS.ROOM_LEFT,
        {
          roomId,
          room: result.room,
          deleted: result.deleted,
        },
        acknowledge,
      );
    } catch (error) {
      return handleSocketError({ socket, error, acknowledge, logger });
    }
  });
}

function handleSocketError({ socket, error, acknowledge, logger }) {
  const code = error.code ?? 'SOCKET_ERROR';
  const message = error.message ?? 'Socket request failed.';
  const eventName = getErrorEventName(error);

  logger.warn(
    {
      socketId: socket.id,
      code,
      message,
    },
    'Socket request failed',
  );

  return emitSocketFailure(socket, code, message, acknowledge, eventName);
}

function getErrorEventName(error) {
  if (error instanceof RoomManagerError && error.code === 'ROOM_FULL') {
    return SOCKET_EVENTS.ROOM_FULL;
  }

  if (error.code === 'GAME_NOT_FOUND' || error.code === 'ROOM_NOT_FOUND') {
    return SOCKET_EVENTS.ROOM_NOT_FOUND;
  }

  return SOCKET_EVENTS.ERROR;
}

function normalizeRoomId(payload) {
  const roomId = payload.roomId ?? payload.gameId;
  return typeof roomId === 'string' ? roomId.trim() : roomId;
}
