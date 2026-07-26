import { randomUUID } from 'node:crypto';
import { logger as defaultLogger } from '../../config/logger.js';
import { gameCompletionPersistence } from './GameCompletionPersistence.js';
import { chessMapper } from './ChessMapper.js';
import { ChessServiceError, chessValidator } from './ChessValidator.js';
import { gameStore as defaultGameStore } from './store/StoreFactory.js';
import { GAME_STATUSES, TERMINAL_GAME_STATUSES } from './store/GameStore.js';

// ChessService is the authoritative chess engine boundary. Controllers request
// actions, but this service is the only place that mutates game state.
export class ChessService {
  constructor({
    gameStore = defaultGameStore,
    validator = chessValidator,
    mapper = chessMapper,
    completionPersistence = gameCompletionPersistence,
    logger = defaultLogger,
  } = {}) {
    this.gameStore = gameStore;
    this.validator = validator;
    this.mapper = mapper;
    this.completionPersistence = completionPersistence;
    this.logger = logger;
  }

  /**
   * Initializes a new game in the active store and assigns the creator as the White player.
   * @param {Object} params
   * @param {string} params.displayName - The requested name for the creator.
   * @returns {Promise<Object>} A summary of the newly created game.
   */
  async createGame({ displayName }) {
    const whitePlayer = this.createPlayer(displayName);
    const activeGame = await this.gameStore.createGame({
      gameId: randomUUID(),
      whitePlayer,
    });

    return this.mapper.mapSummary(activeGame);
  }

  /**
   * Assigns a player to an open slot in the game (currently only Black).
   * @param {string} gameId - The UUID of the game.
   * @param {Object} params
   * @param {string} params.playerId - The UUID of the joining player.
   * @param {string} params.displayName - The requested name of the joining player.
   * @returns {Promise<Object>} The updated game state.
   */
  async joinGame(gameId, { playerId, displayName }) {
    const activeGame = await this.getExistingGame(gameId);
    const normalizedPlayerId = playerId ? this.validator.validatePlayerId(playerId) : randomUUID();
    const blackPlayer = this.createPlayer(displayName, normalizedPlayerId);

    this.validator.assertGameJoinable(activeGame, blackPlayer.id);

    activeGame.blackPlayer = blackPlayer;
    activeGame.status = this.getStatusFromPosition(activeGame.chess);
    this.refreshRuntimeState(activeGame);

    return this.mapper.mapGame(await this.gameStore.updateGame(activeGame));
  }

  /**
   * Validates and applies a move to the board. If the move is terminal (checkmate/draw),
   * archives the game to the permanent database.
   * @param {string} gameId - The UUID of the game.
   * @param {Object} params
   * @param {string} params.playerId - The UUID of the player making the move.
   * @param {Object} params.move - The requested move (from, to, promotion).
   * @returns {Promise<Object>} The move result including the updated game and applied move.
   */
  async requestMove(gameId, { playerId, move }) {
    const activeGame = await this.getExistingGame(gameId);

    this.validator.assertPlayerBelongsToGame(activeGame, playerId);
    this.validator.assertGameCanAcceptMoves(activeGame);
    this.validator.assertCorrectTurn(activeGame, playerId);

    const legalMove = this.validator.validateLegalMove(activeGame, move);
    const appliedMove = activeGame.chess.move(legalMove);
    const mappedMove = this.mapper.mapMove(
      appliedMove,
      activeGame.moveHistory.length + 1,
      new Date(),
    );

    activeGame.moveHistory.push(mappedMove);
    activeGame.status = this.getStatusFromPosition(activeGame.chess);
    activeGame.drawOffer = null;
    this.refreshRuntimeState(activeGame);

    this.applyCompletionState(activeGame, playerId);
    const savedGame = await this.saveAndCleanupIfTerminal(activeGame);

    return this.mapper.mapMoveResult(savedGame, mappedMove);
  }

  /**
   * Ends the game by resignation. Archives the game immediately.
   * @param {string} gameId - The UUID of the game.
   * @param {Object} params
   * @param {string} params.playerId - The UUID of the player resigning.
   * @returns {Promise<Object>} The updated (terminal) game state.
   */
  async resignGame(gameId, { playerId }) {
    const activeGame = await this.getExistingGame(gameId);

    this.validator.assertPlayerBelongsToGame(activeGame, playerId);
    this.validator.assertGameCanAcceptMoves(activeGame);

    const loser = this.getPlayer(activeGame, playerId);
    const winner = this.getOpponent(activeGame, playerId);

    activeGame.status = GAME_STATUSES.RESIGNED;
    activeGame.winner = winner;
    activeGame.loser = loser;
    activeGame.completedAt = new Date();
    activeGame.drawOffer = null;
    this.refreshRuntimeState(activeGame);

    return this.mapper.mapGame(await this.saveAndCleanupIfTerminal(activeGame));
  }

  async offerDraw(gameId, { playerId }) {
    const activeGame = await this.getExistingGame(gameId);

    this.validator.assertPlayerBelongsToGame(activeGame, playerId);
    this.validator.assertGameCanAcceptMoves(activeGame);
    this.validator.assertNoPendingDrawOffer(activeGame);

    const offeredBy = this.getPlayer(activeGame, playerId);
    const offeredTo = this.getOpponent(activeGame, playerId);

    activeGame.drawOffer = {
      offeredBy: offeredBy.id,
      offeredTo: offeredTo.id,
      createdAt: new Date().toISOString(),
    };

    this.refreshRuntimeState(activeGame);

    return this.mapper.mapGame(await this.gameStore.updateGame(activeGame));
  }

  async acceptDraw(gameId, { playerId }) {
    const activeGame = await this.getExistingGame(gameId);

    this.validator.assertCanRespondToDrawOffer(activeGame, playerId);
    this.validator.assertGameCanAcceptMoves(activeGame);

    activeGame.status = GAME_STATUSES.DRAW;
    activeGame.drawOffer = null;
    activeGame.completedAt = new Date();
    this.refreshRuntimeState(activeGame);

    return this.mapper.mapGame(await this.saveAndCleanupIfTerminal(activeGame));
  }

  async declineDraw(gameId, { playerId }) {
    const activeGame = await this.getExistingGame(gameId);

    this.validator.assertCanRespondToDrawOffer(activeGame, playerId);
    this.validator.assertGameCanAcceptMoves(activeGame);
    activeGame.drawOffer = null;
    this.refreshRuntimeState(activeGame);

    return this.mapper.mapGame(await this.gameStore.updateGame(activeGame));
  }

  async markPlayerConnected(gameId, { playerId }) {
    const activeGame = await this.getExistingGame(gameId);
    const player = this.getPlayer(activeGame, playerId);

    player.connected = true;
    player.disconnectedAt = null;
    this.refreshRuntimeState(activeGame);

    return this.mapper.mapGame(await this.gameStore.updateGame(activeGame));
  }

  async markPlayerDisconnected(gameId, { playerId }) {
    const activeGame = await this.getExistingGame(gameId);
    const player = this.getPlayer(activeGame, playerId);

    player.connected = false;
    player.disconnectedAt = new Date();
    this.refreshRuntimeState(activeGame);

    return this.mapper.mapGame(await this.gameStore.updateGame(activeGame));
  }

  async getGame(gameId) {
    return this.mapper.mapGame(await this.getExistingGame(gameId));
  }

  async getHistory(gameId) {
    return this.mapper.mapHistory(await this.getExistingGame(gameId));
  }

  async getPgn(gameId) {
    return this.mapper.mapPgn(await this.getExistingGame(gameId));
  }

  async getFen(gameId) {
    return this.mapper.mapFen(await this.getExistingGame(gameId));
  }

  async getExistingGame(gameId) {
    const activeGame = await this.gameStore.getGame(gameId);
    this.validator.assertGameExists(activeGame);
    return activeGame;
  }

  createPlayer(displayName, playerId = randomUUID()) {
    return {
      id: playerId,
      displayName: this.validator.validateDisplayName(displayName),
      connected: true,
      disconnectedAt: null,
    };
  }

  getPlayer(activeGame, playerId) {
    const color = this.validator.getPlayerColor(activeGame, playerId);

    if (color === 'white') {
      return activeGame.whitePlayer;
    }

    if (color === 'black') {
      return activeGame.blackPlayer;
    }

    this.validator.assertPlayerBelongsToGame(activeGame, playerId);
    return null;
  }

  getOpponent(activeGame, playerId) {
    const color = this.validator.getPlayerColor(activeGame, playerId);

    if (color === 'white') {
      return activeGame.blackPlayer;
    }

    if (color === 'black') {
      return activeGame.whitePlayer;
    }

    this.validator.assertPlayerBelongsToGame(activeGame, playerId);
    return null;
  }

  refreshRuntimeState(activeGame) {
    activeGame.fen = activeGame.chess.fen();
    activeGame.pgn = activeGame.chess.pgn();
    activeGame.turn = activeGame.chess.turn();
    activeGame.updatedAt = new Date();
    return activeGame;
  }

  getStatusFromPosition(chess) {
    if (chess.isCheckmate()) {
      return GAME_STATUSES.CHECKMATE;
    }

    if (chess.isDraw()) {
      return GAME_STATUSES.DRAW;
    }

    if (chess.isCheck()) {
      return GAME_STATUSES.CHECK;
    }

    return GAME_STATUSES.ACTIVE;
  }

  applyCompletionState(activeGame, playerId) {
    if (activeGame.status === GAME_STATUSES.CHECKMATE) {
      activeGame.winner = this.getPlayer(activeGame, playerId);
      activeGame.loser = this.getOpponent(activeGame, playerId);
      activeGame.completedAt = new Date();
    }

    if (activeGame.status === GAME_STATUSES.DRAW) {
      activeGame.winner = null;
      activeGame.loser = null;
      activeGame.completedAt = new Date();
    }
  }

  /**
   * Checks if a game has reached a terminal state (checkmate, draw, resignation).
   * If it has, the game is archived to PostgreSQL and deleted from Redis.
   * @param {Object} activeGame - The current game state.
   * @returns {Promise<Object>} The saved game state.
   * @throws {ChessServiceError} If permanent archival fails.
   */
  async saveAndCleanupIfTerminal(activeGame) {
    const savedGame = await this.gameStore.updateGame(activeGame);

    if (!TERMINAL_GAME_STATUSES.includes(savedGame.status)) {
      return savedGame;
    }

    try {
      await this.completionPersistence.persistCompletedGame(savedGame);
    } catch (error) {
      this.logger.error({ err: error, gameId: savedGame.gameId }, 'Completed game archival failed');
      throw new ChessServiceError(
        'GAME_PERSISTENCE_FAILED',
        'Completed game could not be persisted',
        503,
      );
    }

    try {
      await this.gameStore.deleteGame(savedGame.gameId);
      this.logger.info({ gameId: savedGame.gameId }, 'Completed game removed from active store');
    } catch (error) {
      this.logger.error({ err: error, gameId: savedGame.gameId }, 'Completed game cleanup failed');
    }

    return savedGame;
  }
}

export const chessService = new ChessService();
