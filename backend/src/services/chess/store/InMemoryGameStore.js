import { ActiveGame, GameStore } from './GameStore.js';

// InMemoryGameStore is useful for local development and unit tests where Redis
// is not available. It implements the same contract as RedisGameStore so
// ChessService never depends on Map-specific behavior.
export class InMemoryGameStore extends GameStore {
  constructor() {
    super();
    this.games = new Map();
  }

  async createGame({ gameId, whitePlayer }) {
    return this.save(new ActiveGame({ gameId, whitePlayer }));
  }

  async getGame(gameId) {
    return this.games.get(gameId) ?? null;
  }

  async updateGame(activeGame) {
    activeGame.updatedAt = new Date();
    this.games.set(activeGame.gameId, activeGame);
    return activeGame;
  }

  async deleteGame(gameId) {
    return this.games.delete(gameId);
  }

  async hasGame(gameId) {
    return this.games.has(gameId);
  }

  async listGames() {
    return [...this.games.values()];
  }

  async save(activeGame) {
    return this.updateGame(activeGame);
  }

  async clear() {
    this.games.clear();
  }
}

export const inMemoryGameStore = new InMemoryGameStore();
