import { logger as defaultLogger } from '../../config/logger.js';
import {
  countGames,
  findAnalysisByGameId,
  findGameWithPlayers,
  listGamesWithPlayers,
  listMovesForGame,
} from '../../repositories/index.js';

export class HistoryServiceError extends Error {
  constructor(code, message, statusCode = 404) {
    super(message);
    this.name = 'HistoryServiceError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

export class HistoryService {
  constructor({
    repositories = {
      listGamesWithPlayers,
      countGames,
      findGameWithPlayers,
      listMovesForGame,
      findAnalysisByGameId,
    },
    logger = defaultLogger,
  } = {}) {
    this.repositories = repositories;
    this.logger = logger;
  }

  /**
   * Retrieves a paginated list of archived games, optionally filtered and sorted.
   * @param {Object} params
   * @param {number|string} params.page - The current page (1-indexed).
   * @param {number|string} params.limit - The number of games per page (max 50).
   * @param {string} [params.result] - Filter by result ('w', 'b', 'draw').
   * @param {string} [params.search] - Search by player UUID.
   * @param {string} [params.sort='desc'] - Sort direction by completion time.
   * @returns {Promise<Object>} Paginated game list and metadata.
   */
  async listHistory({ page = 1, limit = 10, result, search, sort = 'desc' }) {
    const normalizedPage = Math.max(1, Number(page));
    const normalizedLimit = Math.min(50, Math.max(1, Number(limit)));
    const offset = (normalizedPage - 1) * normalizedLimit;

    const [games, total] = await Promise.all([
      this.repositories.listGamesWithPlayers({
        limit: normalizedLimit,
        offset,
        result,
        search,
        sort,
      }),
      this.repositories.countGames({ result, search }),
    ]);

    return {
      games,
      pagination: {
        page: normalizedPage,
        limit: normalizedLimit,
        total,
        totalPages: Math.ceil(total / normalizedLimit),
      },
    };
  }

  /**
   * Retrieves the details and full move history for a specific archived game.
   * @param {string} gameId - The UUID of the game.
   * @returns {Promise<Object>} The game metadata and move list.
   * @throws {HistoryServiceError} If the game does not exist.
   */
  async getGame(gameId) {
    const game = await this.repositories.findGameWithPlayers(gameId);

    if (!game) {
      throw new HistoryServiceError('GAME_NOT_FOUND', 'Game not found in history.');
    }

    const moves = await this.repositories.listMovesForGame(gameId);

    return { game, moves };
  }

  /**
   * Retrieves the raw PGN string for a specific archived game.
   * @param {string} gameId - The UUID of the game.
   * @returns {Promise<string>} The PGN string.
   * @throws {HistoryServiceError} If the game does not exist.
   */
  async getPgn(gameId) {
    const game = await this.repositories.findGameWithPlayers(gameId);

    if (!game) {
      throw new HistoryServiceError('GAME_NOT_FOUND', 'Game not found in history.');
    }

    return game.pgn;
  }

  /**
   * Retrieves the game details along with its associated post-game analysis (Stockfish & Gemini).
   * @param {string} gameId - The UUID of the game.
   * @returns {Promise<Object>} The game metadata, moves, and analysis data.
   * @throws {HistoryServiceError} If the game or analysis does not exist.
   */
  async getAnalysis(gameId) {
    const [game, analysis] = await Promise.all([
      this.getGame(gameId),
      this.repositories.findAnalysisByGameId(gameId),
    ]);

    if (!analysis) {
      throw new HistoryServiceError('ANALYSIS_NOT_FOUND', 'Analysis not found for this game.');
    }

    return { ...game, analysis };
  }

  async getReviewData(gameId) {
    // This is basically getAnalysis but conceptually it represents the aggregated review payload.
    // In our case, getAnalysis already returns game, moves, and analysis.
    return this.getAnalysis(gameId);
  }
}

export const historyService = new HistoryService();
