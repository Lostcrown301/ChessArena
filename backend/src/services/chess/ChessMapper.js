// ChessMapper turns internal ActiveGame objects into stable API response shapes.
// Controllers use these methods so they do not need to know about chess.js or
// the temporary in-memory storage details.
export class ChessMapper {
  mapPlayer(player) {
    if (!player) {
      return null;
    }

    return {
      id: player.id,
      displayName: player.displayName,
      connected: player.connected ?? true,
      disconnectedAt: player.disconnectedAt?.toISOString?.() ?? null,
    };
  }

  mapBoard(chess) {
    return chess.board();
  }

  mapMove(move, moveNumber, playedAt = new Date()) {
    return {
      moveNumber,
      color: move.color,
      from: move.from,
      to: move.to,
      piece: move.piece,
      captured: move.captured ?? null,
      promotion: move.promotion ?? null,
      san: move.san,
      lan: move.lan,
      before: move.before,
      after: move.after,
      playedAt: playedAt.toISOString(),
    };
  }

  mapRules(chess) {
    return {
      check: chess.isCheck(),
      checkmate: chess.isCheckmate(),
      draw: chess.isDraw(),
      stalemate: chess.isStalemate(),
      threefoldRepetition: chess.isThreefoldRepetition(),
      fiftyMoveRule: chess.isDrawByFiftyMoves(),
      insufficientMaterial: chess.isInsufficientMaterial(),
      gameOver: chess.isGameOver(),
    };
  }

  mapSummary(activeGame) {
    return {
      gameId: activeGame.gameId,
      fen: activeGame.fen,
      turn: activeGame.turn,
      status: activeGame.status,
      whitePlayer: this.mapPlayer(activeGame.whitePlayer),
      blackPlayer: this.mapPlayer(activeGame.blackPlayer),
    };
  }

  mapGame(activeGame) {
    return {
      ...this.mapSummary(activeGame),
      board: this.mapBoard(activeGame.chess),
      pgn: activeGame.pgn,
      moveHistory: activeGame.moveHistory,
      players: {
        white: this.mapPlayer(activeGame.whitePlayer),
        black: this.mapPlayer(activeGame.blackPlayer),
      },
      drawOffer: activeGame.drawOffer,
      winner: this.mapPlayer(activeGame.winner),
      loser: this.mapPlayer(activeGame.loser),
      completedAt: activeGame.completedAt?.toISOString?.() ?? null,
      rules: this.mapRules(activeGame.chess),
      createdAt: activeGame.createdAt.toISOString(),
      updatedAt: activeGame.updatedAt.toISOString(),
    };
  }

  mapMoveResult(activeGame, move) {
    return {
      ...this.mapGame(activeGame),
      move,
    };
  }

  mapHistory(activeGame) {
    return {
      gameId: activeGame.gameId,
      moves: activeGame.moveHistory,
    };
  }

  mapFen(activeGame) {
    return {
      gameId: activeGame.gameId,
      fen: activeGame.fen,
    };
  }

  mapPgn(activeGame) {
    return {
      gameId: activeGame.gameId,
      pgn: activeGame.pgn,
    };
  }
}

export const chessMapper = new ChessMapper();
