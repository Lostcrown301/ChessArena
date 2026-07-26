// Backward-compatible exports for modules that need chess game status values.
// Active game persistence now lives under ./store and is selected by StoreFactory.
export { ActiveGame, GAME_STATUSES, TERMINAL_GAME_STATUSES } from './store/GameStore.js';
export {
  inMemoryGameStore as activeGameStore,
  InMemoryGameStore as ActiveGameStore,
} from './store/InMemoryGameStore.js';
