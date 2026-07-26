import { createContext } from 'react';

export const GameContext = createContext({
  activeGame: null,
  currentGameId: '',
  error: '',
  gameSessions: {},
  isLoading: false,
  playerName: '',
  clearError: () => {},
  getPlayerSession: () => null,
  setActiveGame: () => {},
  setCurrentGameId: () => {},
  setError: () => {},
  setIsLoading: () => {},
  setPlayerSession: () => {},
  setPlayerName: () => {},
});
