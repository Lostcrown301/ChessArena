import { env } from '../../../config/env.js';
import { logger as defaultLogger } from '../../../config/logger.js';
import { GameStoreError } from './GameStore.js';
import { inMemoryGameStore, InMemoryGameStore } from './InMemoryGameStore.js';
import { RedisGameStore } from './RedisGameStore.js';

export const GAME_STORE_DRIVERS = Object.freeze({
  MEMORY: 'memory',
  REDIS: 'redis',
});

// StoreFactory is the composition point for active-game storage. ChessService
// asks for a GameStore contract and remains unaware of Redis, Map, or any future
// storage implementation.
export function createGameStore({
  driver = env.gameStoreDriver,
  logger = defaultLogger,
  redisClient,
} = {}) {
  if (driver === GAME_STORE_DRIVERS.MEMORY) {
    logger.info({ driver }, 'Using in-memory active game store');
    return inMemoryGameStore;
  }

  if (driver === GAME_STORE_DRIVERS.REDIS) {
    logger.info({ driver }, 'Using Redis active game store');
    return new RedisGameStore({ redisClient, logger });
  }

  throw new GameStoreError(
    'INVALID_GAME_STORE_DRIVER',
    `Unsupported active game store driver: ${driver}`,
    500,
  );
}

export function createIsolatedInMemoryGameStore() {
  return new InMemoryGameStore();
}

export const gameStore = createGameStore();
