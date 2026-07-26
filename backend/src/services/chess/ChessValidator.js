import { Chess } from 'chess.js';
import { TERMINAL_GAME_STATUSES } from './store/GameStore.js';

export class ChessServiceError extends Error {
  constructor(code, message, statusCode = 400) {
    super(message);
    this.name = 'ChessServiceError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

// ChessValidator owns rule checks that protect the authoritative backend state.
// It never mutates the live game while checking legality; cloning avoids the
// common mistake of accidentally applying a move during validation.
export class ChessValidator {
  validatePlayerId(playerId) {
    if (typeof playerId !== 'string' || playerId.trim().length === 0) {
      throw new ChessServiceError('INVALID_PLAYER_ID', 'playerId is required');
    }

    return playerId.trim();
  }

  validateDisplayName(displayName, label = 'displayName') {
    if (typeof displayName !== 'string' || displayName.trim().length === 0) {
      throw new ChessServiceError('INVALID_PLAYER_NAME', `${label} is required`);
    }

    if (displayName.trim().length > 80) {
      throw new ChessServiceError('INVALID_PLAYER_NAME', `${label} must be 80 characters or fewer`);
    }

    return displayName.trim();
  }

  assertGameExists(activeGame) {
    if (!activeGame) {
      throw new ChessServiceError('GAME_NOT_FOUND', 'Game not found', 404);
    }
  }

  assertGameJoinable(activeGame, playerId) {
    this.assertGameExists(activeGame);

    if (activeGame.whitePlayer.id === playerId || activeGame.blackPlayer?.id === playerId) {
      throw new ChessServiceError(
        'PLAYER_ALREADY_JOINED',
        'Player has already joined this game',
        409,
      );
    }

    if (activeGame.blackPlayer) {
      throw new ChessServiceError('GAME_FULL', 'Game already has two players', 409);
    }
  }

  assertPlayerBelongsToGame(activeGame, playerId) {
    this.assertGameExists(activeGame);

    if (!this.getPlayerColor(activeGame, playerId)) {
      throw new ChessServiceError('PLAYER_NOT_IN_GAME', 'Player does not belong to this game', 403);
    }
  }

  getPlayerColor(activeGame, playerId) {
    const normalizedPlayerId = this.validatePlayerId(playerId);

    if (activeGame.whitePlayer.id === normalizedPlayerId) {
      return 'white';
    }

    if (activeGame.blackPlayer?.id === normalizedPlayerId) {
      return 'black';
    }

    return null;
  }

  assertGameCanAcceptMoves(activeGame) {
    if (!activeGame.blackPlayer) {
      throw new ChessServiceError(
        'GAME_WAITING_FOR_PLAYER',
        'Game is waiting for a second player',
        409,
      );
    }

    if (TERMINAL_GAME_STATUSES.includes(activeGame.status)) {
      throw new ChessServiceError('GAME_ALREADY_FINISHED', 'Game cannot accept more moves', 409);
    }
  }

  assertCorrectTurn(activeGame, playerId) {
    const normalizedPlayerId = this.validatePlayerId(playerId);
    const expectedPlayerId =
      activeGame.chess.turn() === 'w' ? activeGame.whitePlayer.id : activeGame.blackPlayer?.id;

    if (normalizedPlayerId !== expectedPlayerId) {
      throw new ChessServiceError('WRONG_TURN', "It is not this player's turn", 409);
    }
  }

  validateMoveShape(move) {
    if (typeof move === 'string' && move.trim().length > 0) {
      return move.trim();
    }

    if (!move || typeof move !== 'object') {
      throw new ChessServiceError('INVALID_MOVE_FORMAT', 'Move must be SAN text or a move object');
    }

    const { from, to, promotion } = move;

    if (typeof from !== 'string' || typeof to !== 'string') {
      throw new ChessServiceError(
        'INVALID_MOVE_FORMAT',
        'Move object requires from and to squares',
      );
    }

    return {
      from: from.trim(),
      to: to.trim(),
      promotion: typeof promotion === 'string' ? promotion.trim() : undefined,
    };
  }

  validateLegalMove(activeGame, move) {
    const normalizedMove = this.validateMoveShape(move);
    const chess = new Chess(activeGame.chess.fen());

    try {
      const candidateMove = chess.move(normalizedMove);

      if (!candidateMove) {
        throw new Error('Move rejected');
      }

      return normalizedMove;
    } catch {
      throw new ChessServiceError('ILLEGAL_MOVE', 'Move is not legal in the current position', 422);
    }
  }

  assertDrawOfferExists(activeGame) {
    if (!activeGame.drawOffer) {
      throw new ChessServiceError('DRAW_OFFER_NOT_FOUND', 'No draw offer is pending', 404);
    }
  }

  assertNoPendingDrawOffer(activeGame) {
    if (activeGame.drawOffer) {
      throw new ChessServiceError(
        'DRAW_OFFER_ALREADY_PENDING',
        'A draw offer is already pending a response',
        409,
      );
    }
  }

  assertCanRespondToDrawOffer(activeGame, playerId) {
    this.assertDrawOfferExists(activeGame);
    this.assertPlayerBelongsToGame(activeGame, playerId);

    const normalizedPlayerId = this.validatePlayerId(playerId);

    if (activeGame.drawOffer.offeredBy === normalizedPlayerId) {
      throw new ChessServiceError(
        'DRAW_OFFER_OWNER',
        'The player who offered a draw cannot respond to it',
        409,
      );
    }

    if (activeGame.drawOffer.offeredTo !== normalizedPlayerId) {
      throw new ChessServiceError(
        'DRAW_OFFER_RECIPIENT',
        'Only the draw offer recipient can respond to it',
        403,
      );
    }
  }
}

export const chessValidator = new ChessValidator();
