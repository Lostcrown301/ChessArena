import { env } from '../../../config/env.js';
import { logger as defaultLogger } from '../../../config/logger.js';
import { getRedisClient } from '../../../lib/redis.js';
import { ActiveGame, GameStore, GameStoreError } from './GameStore.js';

const GAME_KEY_PREFIX = 'game:';

// RedisGameStore is the production active-game store. It persists only live
// multiplayer state as JSON and applies a TTL so abandoned active games do not
// remain in Redis forever.
export class RedisGameStore extends GameStore {
  constructor({
    redisClient = getRedisClient(),
    logger = defaultLogger,
    ttlSeconds = env.activeGameTtlSeconds,
  } = {}) {
    super();
    this.redis = redisClient;
    this.logger = logger;
    this.ttlSeconds = ttlSeconds;
  }

  async createGame({ gameId, whitePlayer }) {
    return this.save(new ActiveGame({ gameId, whitePlayer }));
  }

  async getGame(gameId) {
    await this.ensureConnected();

    try {
      const value = await this.redis.get(this.createKey(gameId));
      this.logger.debug({ gameId }, 'Redis active game read');

      if (!value) {
        return null;
      }

      return ActiveGame.fromSnapshot(JSON.parse(value));
    } catch (error) {
      this.logger.error({ err: error, gameId }, 'Redis active game read failed');
      throw this.normalizeRedisError(error, 'GAME_STORE_READ_FAILED', 'Unable to read active game');
    }
  }

  async updateGame(activeGame) {
    activeGame.updatedAt = new Date();
    await this.ensureConnected();

    try {
      const serializedGame = JSON.stringify(activeGame.toSnapshot());
      await this.redis.set(
        this.createKey(activeGame.gameId),
        serializedGame,
        'EX',
        this.ttlSeconds,
      );
      this.logger.debug(
        { gameId: activeGame.gameId, ttlSeconds: this.ttlSeconds },
        'Redis active game written and TTL refreshed',
      );

      return activeGame;
    } catch (error) {
      this.logger.error(
        { err: error, gameId: activeGame.gameId },
        'Redis active game write failed',
      );
      throw this.normalizeRedisError(
        error,
        'GAME_STORE_WRITE_FAILED',
        'Unable to write active game',
      );
    }
  }

  async deleteGame(gameId) {
    await this.ensureConnected();

    try {
      const deleted = await this.redis.del(this.createKey(gameId));
      this.logger.debug({ gameId, deleted }, 'Redis active game deleted');
      return deleted > 0;
    } catch (error) {
      this.logger.error({ err: error, gameId }, 'Redis active game delete failed');
      throw this.normalizeRedisError(
        error,
        'GAME_STORE_DELETE_FAILED',
        'Unable to delete active game',
      );
    }
  }

  async hasGame(gameId) {
    await this.ensureConnected();

    try {
      const exists = (await this.redis.exists(this.createKey(gameId))) === 1;
      this.logger.debug({ gameId, exists }, 'Redis active game existence checked');
      return exists;
    } catch (error) {
      this.logger.error({ err: error, gameId }, 'Redis active game exists check failed');
      throw this.normalizeRedisError(error, 'GAME_STORE_READ_FAILED', 'Unable to read active game');
    }
  }

  async listGames() {
    await this.ensureConnected();

    try {
      const keys = await this.scanGameKeys();

      if (keys.length === 0) {
        return [];
      }

      const values = await this.redis.mget(keys);
      this.logger.debug({ count: keys.length }, 'Redis active games listed');
      return values.filter(Boolean).map((value) => ActiveGame.fromSnapshot(JSON.parse(value)));
    } catch (error) {
      this.logger.error({ err: error }, 'Redis active game list failed');
      throw this.normalizeRedisError(
        error,
        'GAME_STORE_READ_FAILED',
        'Unable to list active games',
      );
    }
  }

  async save(activeGame) {
    return this.updateGame(activeGame);
  }

  async clear() {
    await this.ensureConnected();

    try {
      const keys = await this.scanGameKeys();

      if (keys.length === 0) {
        return;
      }

      await this.redis.del(...keys);
      this.logger.debug({ deleted: keys.length }, 'Redis active games cleared');
    } catch (error) {
      this.logger.error({ err: error }, 'Redis active game clear failed');
      throw this.normalizeRedisError(
        error,
        'GAME_STORE_DELETE_FAILED',
        'Unable to clear active games',
      );
    }
  }

  createKey(gameId) {
    return `${GAME_KEY_PREFIX}${gameId}`;
  }

  async scanGameKeys() {
    let cursor = '0';
    const keys = [];

    do {
      const [nextCursor, batch] = await this.redis.scan(
        cursor,
        'MATCH',
        `${GAME_KEY_PREFIX}*`,
        'COUNT',
        100,
      );
      cursor = nextCursor;
      keys.push(...batch);
    } while (cursor !== '0');

    return keys;
  }

  async ensureConnected() {
    if (this.redis.status === 'ready') {
      return;
    }

    try {
      await this.redis.connect();
      this.logger.info({ status: this.redis.status }, 'Redis active game store connected');
    } catch (error) {
      if (this.redis.status === 'ready') {
        return;
      }

      this.logger.error(
        { err: error, status: this.redis.status },
        'Redis active game store unavailable',
      );
      throw new GameStoreError(
        'REDIS_UNAVAILABLE',
        'Active game store is currently unavailable',
        503,
      );
    }
  }

  normalizeRedisError(error, code, message) {
    if (error instanceof GameStoreError) {
      return error;
    }

    if (error instanceof SyntaxError) {
      return new GameStoreError('GAME_DESERIALIZATION_FAILED', 'Stored game data is invalid', 500);
    }

    return new GameStoreError(code, message, 503);
  }
}
