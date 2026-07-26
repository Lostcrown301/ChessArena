import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ConnectionStatus } from '@components/common/ConnectionStatus';
import { CreateGameCard } from '@components/common/CreateGameCard';
import { ErrorBanner } from '@components/common/ErrorBanner';
import { JoinGameCard } from '@components/common/JoinGameCard';
import { LoadingOverlay } from '@components/common/LoadingOverlay';
import { PageContainer } from '@components/common/PageContainer';
import { PlayerNameModal } from '@components/common/PlayerNameModal';
import { Section } from '@components/common/Section';
import { SuccessBanner } from '@components/common/SuccessBanner';
import { RecentGamesPanel } from '@components/history/RecentGamesPanel';
import { Button } from '@components/ui/Button';
import { Card } from '@components/ui/Card';
import { createGame, extractGameFromPayload, joinGame } from '@services/socket/gameSocketService';
import { useGame } from '@hooks/useGame';
import { useSocket } from '@hooks/useSocket';
import { getFriendlyGameError } from '@utils/errors';
import { normalizeGameId, validateGameId } from '@utils/validation';

export function LobbyPage() {
  const navigate = useNavigate();
  const {
    clearError,
    error,
    isLoading,
    playerName,
    setCurrentGameId,
    setError,
    setIsLoading,
    setPlayerSession,
  } = useGame();
  const { connectSocket, connectionStatus } = useSocket();
  const [gameId, setGameId] = useState('');
  const [gameIdError, setGameIdError] = useState('');
  const [isNameModalOpen, setIsNameModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (!playerName) {
      setIsNameModalOpen(true);
    }
  }, [playerName]);

  async function handleCreateGame() {
    if (!playerName || isLoading) {
      setIsNameModalOpen(true);
      return;
    }

    clearError();
    setSuccessMessage('');
    setIsLoading(true);
    connectSocket();

    try {
      const response = await createGame({ displayName: playerName });
      const game = extractGameFromPayload(response);

      if (!game?.gameId || !game?.whitePlayer?.id) {
        throw new Error('The server did not return a usable game.');
      }

      setPlayerSession(game.gameId, {
        color: 'white',
        displayName: game.whitePlayer.displayName,
        playerId: game.whitePlayer.id,
      });
      setCurrentGameId(game.gameId);
      setSuccessMessage('Game created. Opening the game room now.');
      navigate(`/game/${game.gameId}`);
    } catch (requestError) {
      setError(getFriendlyGameError(requestError));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleJoinGame(event) {
    event.preventDefault();

    if (!playerName || isLoading) {
      setIsNameModalOpen(true);
      return;
    }

    const validationError = validateGameId(gameId);

    if (validationError) {
      setGameIdError(validationError);
      return;
    }

    clearError();
    setGameIdError('');
    setSuccessMessage('');
    setIsLoading(true);
    connectSocket();

    try {
      const normalizedGameId = normalizeGameId(gameId);
      const response = await joinGame({ gameId: normalizedGameId, displayName: playerName });
      const game = extractGameFromPayload(response);
      const blackPlayer = game?.players?.black ?? game?.blackPlayer;

      if (!game?.gameId || !blackPlayer?.id) {
        throw new Error('The server did not return a usable game.');
      }

      setPlayerSession(game.gameId, {
        color: 'black',
        displayName: blackPlayer.displayName,
        playerId: blackPlayer.id,
      });
      setCurrentGameId(game.gameId);
      setSuccessMessage('Game joined. Opening the game room now.');
      navigate(`/game/${game.gameId}`);
    } catch (requestError) {
      setError(getFriendlyGameError(requestError));
    } finally {
      setIsLoading(false);
    }
  }

  function handleGameIdChange(value) {
    setGameId(value);

    if (gameIdError) {
      setGameIdError('');
    }
  }

  return (
    <PageContainer>
      <LoadingOverlay isVisible={isLoading} label="Preparing your game" />
      <PlayerNameModal isOpen={isNameModalOpen} onClose={() => setIsNameModalOpen(false)} />

      <Section eyebrow="Lobby" title="Create or join a game">
        <div className="mb-6 grid gap-3">
          <ErrorBanner message={error} />
          <SuccessBanner message={successMessage} />
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_1fr_18rem]">
          <CreateGameCard disabled={isLoading} onCreate={handleCreateGame} />
          <JoinGameCard
            disabled={isLoading}
            gameId={gameId}
            gameIdError={gameIdError}
            onGameIdChange={handleGameIdChange}
            onJoin={handleJoinGame}
          />
          <Card as="aside">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-50">Player</h2>
                <p className="mt-1 text-sm text-slate-400">
                  {playerName || 'Choose a display name to continue.'}
                </p>
              </div>
              <Button onClick={() => setIsNameModalOpen(true)} variant="ghost">
                Edit
              </Button>
            </div>

            <div className="mt-6">
              <h2 className="text-lg font-semibold text-slate-50">Connection</h2>
              <div className="mt-3">
                <ConnectionStatus label={connectionStatus} tone="neutral" />
              </div>
            </div>
          </Card>
        </div>
      </Section>

      <div className="mt-8">
        <RecentGamesPanel />
      </div>
    </PageContainer>
  );
}
