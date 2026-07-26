import { useCallback, useMemo, useState } from 'react';
import { STORAGE_KEYS } from '@constants/storageKeys';
import {
  readStorageJson,
  readStorageValue,
  writeStorageJson,
  writeStorageValue,
} from '@utils/storage';
import { GameContext } from './GameContext';

// GameProvider mirrors server-confirmed game snapshots; it never validates chess rules locally.
export function GameProvider({ children }) {
  const [playerName, setPlayerNameValue] = useState(() =>
    readStorageValue(STORAGE_KEYS.playerName),
  );
  const [activeGame, setActiveGame] = useState(null);
  const [currentGameId, setCurrentGameId] = useState('');
  const [gameSessions, setGameSessions] = useState(() =>
    readStorageJson(STORAGE_KEYS.gameSessions),
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const setPlayerName = useCallback((value) => {
    const normalizedValue = value.trim();
    setPlayerNameValue(normalizedValue);
    writeStorageValue(STORAGE_KEYS.playerName, normalizedValue);
  }, []);

  const clearError = useCallback(() => {
    setError('');
  }, []);

  const setPlayerSession = useCallback((gameId, session) => {
    if (!gameId || !session?.playerId) {
      return;
    }

    setGameSessions((currentSessions) => {
      const nextSessions = {
        ...currentSessions,
        [gameId]: session,
      };

      writeStorageJson(STORAGE_KEYS.gameSessions, nextSessions);
      return nextSessions;
    });
  }, []);

  const getPlayerSession = useCallback(
    (gameId) => {
      if (!gameId) {
        return null;
      }

      return gameSessions[gameId] ?? null;
    },
    [gameSessions],
  );

  const value = useMemo(
    () => ({
      activeGame,
      clearError,
      currentGameId,
      error,
      gameSessions,
      getPlayerSession,
      isLoading,
      playerName,
      setActiveGame,
      setCurrentGameId,
      setError,
      setIsLoading,
      setPlayerSession,
      setPlayerName,
    }),
    [
      activeGame,
      clearError,
      currentGameId,
      error,
      gameSessions,
      getPlayerSession,
      isLoading,
      playerName,
      setPlayerSession,
      setPlayerName,
    ],
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}
