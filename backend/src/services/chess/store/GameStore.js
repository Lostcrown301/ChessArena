import { Chess } from 'chess.js';

export const GAME_STATUSES = Object.freeze({
  WAITING: 'WAITING',
  ACTIVE: 'ACTIVE',
  CHECK: 'CHECK',
  CHECKMATE: 'CHECKMATE',
  DRAW: 'DRAW',
  RESIGNED: 'RESIGNED',
  ABANDONED: 'ABANDONED',
  COMPLETED: 'COMPLETED',
});

export const TERMINAL_GAME_STATUSES = Object.freeze([
  GAME_STATUSES.CHECKMATE,
  GAME_STATUSES.DRAW,
  GAME_STATUSES.RESIGNED,
  GAME_STATUSES.ABANDONED,
  GAME_STATUSES.COMPLETED,
]);

export class GameStoreError extends Error {
  constructor(code, message, statusCode = 503) {
    super(message);
    this.name = 'GameStoreError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

// ActiveGame is the runtime model shared by every active-game store. Redis
// stores JSON snapshots, then rehydrates them into this shape so ChessService
// can keep using chess.js without knowing where the game was loaded from.
export class ActiveGame {
  constructor({ gameId, whitePlayer }) {
    const chess = new Chess();
    const now = new Date();

    this.gameId = gameId;
    this.whitePlayer = whitePlayer;
    this.blackPlayer = null;
    this.drawOffer = null;
    this.winner = null;
    this.loser = null;
    this.completedAt = null;
    this.chess = chess;
    this.fen = chess.fen();
    this.pgn = chess.pgn();
    this.moveHistory = [];
    this.turn = chess.turn();
    this.status = GAME_STATUSES.WAITING;
    this.createdAt = now;
    this.updatedAt = now;
  }

  static fromSnapshot(snapshot) {
    if (!snapshot || typeof snapshot !== 'object') {
      throw new GameStoreError('GAME_DESERIALIZATION_FAILED', 'Stored game snapshot is invalid');
    }

    assertSnapshotString(snapshot.gameId, 'gameId');
    assertSnapshotPlayer(snapshot.whitePlayer, 'whitePlayer');

    const activeGame = new ActiveGame({
      gameId: snapshot.gameId,
      whitePlayer: revivePlayer(snapshot.whitePlayer),
    });

    activeGame.blackPlayer = revivePlayer(snapshot.blackPlayer);
    activeGame.drawOffer = snapshot.drawOffer ?? null;
    activeGame.winner = revivePlayer(snapshot.winner);
    activeGame.loser = revivePlayer(snapshot.loser);
    activeGame.completedAt = reviveDate(snapshot.completedAt);
    activeGame.moveHistory = Array.isArray(snapshot.moveHistory) ? snapshot.moveHistory : [];
    activeGame.status = snapshot.status ?? GAME_STATUSES.WAITING;
    activeGame.createdAt = reviveDate(snapshot.createdAt) ?? new Date();
    activeGame.updatedAt = reviveDate(snapshot.updatedAt) ?? new Date();
    activeGame.chess = rehydrateChess(snapshot);
    activeGame.fen = snapshot.fen ?? activeGame.chess.fen();
    activeGame.pgn = snapshot.pgn ?? activeGame.chess.pgn();
    activeGame.turn = snapshot.turn ?? activeGame.chess.turn();

    return activeGame;
  }

  toSnapshot() {
    return {
      gameId: this.gameId,
      whitePlayer: serializePlayer(this.whitePlayer),
      blackPlayer: serializePlayer(this.blackPlayer),
      drawOffer: this.drawOffer,
      winner: serializePlayer(this.winner),
      loser: serializePlayer(this.loser),
      completedAt: serializeDate(this.completedAt),
      fen: this.fen,
      pgn: this.pgn,
      moveHistory: this.moveHistory,
      turn: this.turn,
      status: this.status,
      createdAt: serializeDate(this.createdAt),
      updatedAt: serializeDate(this.updatedAt),
    };
  }
}

// GameStore documents the persistence contract. Concrete stores contain no
// chess rules; they only create, load, save, list, and delete ActiveGame data.
export class GameStore {
  createGame() {
    throw new GameStoreError('STORE_METHOD_NOT_IMPLEMENTED', 'createGame() is not implemented');
  }

  getGame() {
    throw new GameStoreError('STORE_METHOD_NOT_IMPLEMENTED', 'getGame() is not implemented');
  }

  updateGame() {
    throw new GameStoreError('STORE_METHOD_NOT_IMPLEMENTED', 'updateGame() is not implemented');
  }

  deleteGame() {
    throw new GameStoreError('STORE_METHOD_NOT_IMPLEMENTED', 'deleteGame() is not implemented');
  }

  hasGame() {
    throw new GameStoreError('STORE_METHOD_NOT_IMPLEMENTED', 'hasGame() is not implemented');
  }

  listGames() {
    throw new GameStoreError('STORE_METHOD_NOT_IMPLEMENTED', 'listGames() is not implemented');
  }

  save() {
    throw new GameStoreError('STORE_METHOD_NOT_IMPLEMENTED', 'save() is not implemented');
  }

  clear() {
    throw new GameStoreError('STORE_METHOD_NOT_IMPLEMENTED', 'clear() is not implemented');
  }
}

function rehydrateChess(snapshot) {
  const chess = new Chess();
  const moves = Array.isArray(snapshot.moveHistory) ? snapshot.moveHistory : [];

  try {
    for (const move of moves) {
      chess.move({
        from: move.from,
        to: move.to,
        promotion: move.promotion ?? undefined,
      });
    }

    if (moves.length === 0 && snapshot.fen) {
      return new Chess(snapshot.fen);
    }

    if (snapshot.fen && chess.fen() !== snapshot.fen) {
      throw new GameStoreError(
        'GAME_DESERIALIZATION_FAILED',
        'Stored game move history does not match FEN',
        500,
      );
    }

    return chess;
  } catch {
    throw new GameStoreError('GAME_DESERIALIZATION_FAILED', 'Stored game data is invalid', 500);
  }
}

function assertSnapshotString(value, fieldName) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new GameStoreError(
      'GAME_DESERIALIZATION_FAILED',
      `Stored game snapshot is missing ${fieldName}`,
      500,
    );
  }
}

function assertSnapshotPlayer(player, fieldName) {
  if (!player || typeof player !== 'object') {
    throw new GameStoreError(
      'GAME_DESERIALIZATION_FAILED',
      `Stored game snapshot is missing ${fieldName}`,
      500,
    );
  }

  assertSnapshotString(player.id, `${fieldName}.id`);
  assertSnapshotString(player.displayName, `${fieldName}.displayName`);
}

function revivePlayer(player) {
  if (!player) {
    return null;
  }

  return {
    ...player,
    disconnectedAt: reviveDate(player.disconnectedAt),
  };
}

function serializePlayer(player) {
  if (!player) {
    return null;
  }

  return {
    ...player,
    disconnectedAt: serializeDate(player.disconnectedAt),
  };
}

function reviveDate(value) {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return value;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function serializeDate(value) {
  return value?.toISOString?.() ?? null;
}
