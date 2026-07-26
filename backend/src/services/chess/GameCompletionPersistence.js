import { logger as defaultLogger } from '../../config/logger.js';
import { db as defaultDatabase } from '../../db/client.js';
import {
  createAnalysis,
  createGame,
  createMove,
  createPlayer,
  updateAnalysisByGameId,
} from '../../repositories/index.js';
import { analysisQueue } from '../analysis/AnalysisQueue.js';
import { stockfishService } from '../analysis/StockfishService.js';
import { GAME_STATUSES } from './store/GameStore.js';

// Completed games leave the active GameStore and are archived in PostgreSQL.
// This service contains persistence mapping only; it does not validate moves or
// decide winners, because ChessService has already finalized the active game.
export class GameCompletionPersistence {
  constructor({
    repositories = { createPlayer, createGame, createMove, createAnalysis, updateAnalysisByGameId },
    queue = analysisQueue,
    database = defaultDatabase,
    logger = defaultLogger,
    stockfish = stockfishService,
  } = {}) {
    this.repositories = repositories;
    this.queue = queue;
    this.database = database;
    this.logger = logger;
    this.stockfish = stockfish;
  }

  async persistCompletedGame(activeGame) {
    if (!activeGame.blackPlayer) {
      return null;
    }

    try {
      const persistedGame = await this.runInTransaction((transaction) =>
        this.persistCompletedGameRecords(activeGame, transaction),
      );

      this.logger.info({ gameId: activeGame.gameId }, 'Completed game persisted to PostgreSQL');
      this.enqueueFinalPositionAnalysis(activeGame);
      return persistedGame;
    } catch (error) {
      this.logger.error(
        { err: error, gameId: activeGame.gameId },
        'Completed game persistence failed',
      );
      throw error;
    }
  }

  enqueueFinalPositionAnalysis(activeGame) {
    this.queue
      .enqueue(async () => {
        const evaluation = await this.stockfish.evaluatePosition({
          depth: 12,
          fen: activeGame.fen,
          timeLimit: 3000,
        });

        await this.repositories.updateAnalysisByGameId(activeGame.gameId, {
          analyzedAt: new Date(evaluation.analyzedAt),
          bestMove: evaluation.bestMove,
          centipawnScore: evaluation.centipawns,
          depth: evaluation.depth,
          finalEvaluation: evaluation.evaluation,
          mateScore: evaluation.mate,
        });

        this.logger.info({ gameId: activeGame.gameId }, 'Final Stockfish analysis stored');
      })
      .catch((error) => {
        this.logger.warn(
          { err: error, gameId: activeGame.gameId },
          'Final Stockfish analysis failed',
        );
      });
  }

  async persistCompletedGameRecords(activeGame, database) {
    await this.repositories.createPlayer(
      {
        id: activeGame.whitePlayer.id,
        displayName: activeGame.whitePlayer.displayName,
      },
      database,
    );
    await this.repositories.createPlayer(
      {
        id: activeGame.blackPlayer.id,
        displayName: activeGame.blackPlayer.displayName,
      },
      database,
    );

    const persistedGame = await this.repositories.createGame(
      {
        id: activeGame.gameId,
        whitePlayerId: activeGame.whitePlayer.id,
        blackPlayerId: activeGame.blackPlayer.id,
        result: this.mapResult(activeGame),
        winnerId: activeGame.winner?.id ?? null,
        opening: null,
        pgn: activeGame.pgn,
        startedAt: activeGame.createdAt,
        endedAt: activeGame.completedAt ?? new Date(),
      },
      database,
    );

    for (const move of activeGame.moveHistory) {
      await this.repositories.createMove(
        {
          gameId: activeGame.gameId,
          moveNumber: move.moveNumber,
          san: move.san,
          fen: move.after,
          playedAt: new Date(move.playedAt),
        },
        database,
      );
    }

    await this.repositories.createAnalysis(
      {
        gameId: activeGame.gameId,
        mistakes: 0,
        blunders: 0,
        summary: null,
        improvementTips: null,
      },
      database,
    );

    return persistedGame;
  }

  async runInTransaction(callback) {
    if (typeof this.database?.transaction !== 'function') {
      return callback(this.database);
    }

    return this.database.transaction(callback);
  }

  mapResult(activeGame) {
    if (activeGame.status === GAME_STATUSES.DRAW) {
      return 'draw';
    }

    if (activeGame.status === GAME_STATUSES.ABANDONED) {
      return 'abandoned';
    }

    if (activeGame.winner?.id === activeGame.whitePlayer.id) {
      return 'white_win';
    }

    if (activeGame.winner?.id === activeGame.blackPlayer?.id) {
      return 'black_win';
    }

    return 'ongoing';
  }
}

export const gameCompletionPersistence = new GameCompletionPersistence();
