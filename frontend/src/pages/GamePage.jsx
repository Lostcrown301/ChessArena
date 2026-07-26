import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ConnectionStatus } from '@components/common/ConnectionStatus';
import { LoadingOverlay } from '@components/common/LoadingOverlay';
import { PageContainer } from '@components/common/PageContainer';
import { Section } from '@components/common/Section';
import { CapturedPiecesPanel } from '@components/game/CapturedPiecesPanel';
import { ChessBoardPanel } from '@components/game/ChessBoardPanel';
import { GameControls } from '@components/game/GameControls';
import { GameInfoPanel } from '@components/game/GameInfoPanel';
import { GameResultBanner } from '@components/game/GameResultBanner';
import { GameStatusPanel } from '@components/game/GameStatusPanel';
import { MoveHistoryPanel } from '@components/game/MoveHistoryPanel';
import { PlayerPanel } from '@components/game/PlayerPanel';
import { WaitingForOpponent } from '@components/game/WaitingForOpponent';
import { AnalysisPanel } from '@components/game/analysis/AnalysisPanel';
import { AIAnalysisPanel } from '@components/game/ai/AIAnalysisPanel';
import { Toast } from '@components/ui/Toast';
import { SOCKET_EVENTS } from '@constants/socketEvents';
import { useGame } from '@hooks/useGame';
import { useSocket } from '@hooks/useSocket';
import { explainAnalysis } from '@services/api/AIService';
import {
  acceptDraw,
  declineDraw,
  extractGameFromPayload,
  getSocket,
  joinGame,
  leaveRoom,
  makeMove,
  offerDraw,
  onGameSocketEvent,
  requestGameState,
  resignGame,
} from '@services/socket/gameSocketService';
import { analyzePosition } from '@services/api/AnalysisService';
import { getFriendlyGameError } from '@utils/errors';
import {
  canCurrentPlayerMove,
  getCapturedPieces,
  getLastMove,
  getPlayerWithColor,
  isCurrentPlayerTurn,
  isDrawOfferByPlayer,
  isDrawOfferForPlayer,
  isGameActive,
} from '@utils/gameState';

const GAME_UPDATE_EVENTS = [
  SOCKET_EVENTS.GAME_CREATED,
  SOCKET_EVENTS.GAME_JOINED,
  SOCKET_EVENTS.GAME_STARTED,
  SOCKET_EVENTS.GAME_STATE,
  SOCKET_EVENTS.BOARD_UPDATED,
  SOCKET_EVENTS.MOVE_ACCEPTED,
  SOCKET_EVENTS.CHECK,
  SOCKET_EVENTS.CHECKMATE,
  SOCKET_EVENTS.DRAW,
  SOCKET_EVENTS.DRAW_OFFER,
  SOCKET_EVENTS.DRAW_DECLINED,
  SOCKET_EVENTS.PLAYER_RESIGNED,
  SOCKET_EVENTS.GAME_OVER,
];

function createToast(message, tone = 'info') {
  return {
    id: `${Date.now()}-${Math.random()}`,
    message,
    tone,
  };
}

export function GamePage() {
  const { gameId = '' } = useParams();
  const [boardOrientation, setBoardOrientation] = useState('white');
  const [analysis, setAnalysis] = useState(null);
  const [analysisError, setAnalysisError] = useState('');
  const [aiExplanation, setAiExplanation] = useState(null);
  const [aiError, setAiError] = useState('');
  const [aiStyle, setAiStyle] = useState('beginner');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isRecovering, setIsRecovering] = useState(true);
  const [pendingAction, setPendingAction] = useState('');
  const [toasts, setToasts] = useState([]);
  const {
    activeGame,
    getPlayerSession,
    playerName,
    setActiveGame,
    setCurrentGameId,
    setPlayerSession,
  } = useGame();
  const { connectSocket, connectionError, connectionStatus, disconnectSocket, isConnected } =
    useSocket();
  const playerSession = getPlayerSession(gameId);
  const playerId = playerSession?.playerId;
  const playerColor = playerSession?.color;

  const blackPlayer = useMemo(() => getPlayerWithColor(activeGame, 'black'), [activeGame]);
  const whitePlayer = useMemo(() => getPlayerWithColor(activeGame, 'white'), [activeGame]);
  const capturedPieces = useMemo(() => getCapturedPieces(activeGame), [activeGame]);
  const lastMove = getLastMove(activeGame);
  const canMove = canCurrentPlayerMove({ game: activeGame, isConnected, playerColor });
  const canUseGameActions = Boolean(playerId && isGameActive(activeGame));
  const canAcceptDraw = isDrawOfferForPlayer(activeGame, playerId);
  const canOfferDraw = canUseGameActions && !activeGame?.drawOffer;
  const hasDrawOfferByPlayer = isDrawOfferByPlayer(activeGame, playerId);

  const addToast = useCallback((message, tone = 'info') => {
    const toast = createToast(message, tone);
    setToasts((currentToasts) => [...currentToasts.slice(-2), toast]);
    window.setTimeout(() => {
      setToasts((currentToasts) =>
        currentToasts.filter((currentToast) => currentToast.id !== toast.id),
      );
    }, 5000);
  }, []);

  const applyGamePayload = useCallback(
    (payload) => {
      const nextGame = extractGameFromPayload(payload);

      if (!nextGame || nextGame.gameId !== gameId) {
        return null;
      }

      setActiveGame(nextGame);
      return nextGame;
    },
    [gameId, setActiveGame],
  );

  const syncGameState = useCallback(
    async ({ allowAutoJoin = false, showLoading = true } = {}) => {
      if (!gameId) {
        return null;
      }

      if (showLoading) {
        setIsRecovering(true);
      }

      try {
        const response = await requestGameState({ gameId, playerId });
        let nextGame = applyGamePayload(response);

        if (allowAutoJoin && !playerId && playerName && nextGame && !nextGame.players?.black) {
          const joinResponse = await joinGame({ displayName: playerName, gameId });
          nextGame = extractGameFromPayload(joinResponse);
          const blackPlayerIdentity = nextGame?.players?.black ?? nextGame?.blackPlayer;

          if (nextGame?.gameId && blackPlayerIdentity?.id) {
            setPlayerSession(nextGame.gameId, {
              color: 'black',
              displayName: blackPlayerIdentity.displayName,
              playerId: blackPlayerIdentity.id,
            });
            setActiveGame(nextGame);
            addToast('Joined game as Black.', 'success');
          }
        }

        return nextGame;
      } catch (error) {
        addToast(getFriendlyGameError(error), 'error');
        return null;
      } finally {
        setIsRecovering(false);
      }
    },
    [addToast, applyGamePayload, gameId, playerId, playerName, setActiveGame, setPlayerSession],
  );

  function handleFlipBoard() {
    setBoardOrientation((currentOrientation) =>
      currentOrientation === 'white' ? 'black' : 'white',
    );
  }

  function handlePieceDrop(sourceSquare, targetSquare) {
    if (!canMove || pendingAction) {
      addToast('The board is locked until the server says it is your turn.', 'error');
      return false;
    }

    setPendingAction('move');
    makeMove({
      gameId,
      move: {
        from: sourceSquare,
        promotion: 'q',
        to: targetSquare,
      },
      playerId,
    })
      .then((response) => {
        applyGamePayload(response);
      })
      .catch((error) => {
        addToast(getFriendlyGameError(error), 'error');
      })
      .finally(() => {
        setPendingAction('');
      });

    return false;
  }

  async function runGameAction(action, successMessage) {
    if (!playerId || pendingAction) {
      return;
    }

    setPendingAction('control');

    try {
      const response = await action({ gameId, playerId });
      applyGamePayload(response);
      addToast(successMessage, 'success');
    } catch (error) {
      addToast(getFriendlyGameError(error), 'error');
    } finally {
      setPendingAction('');
    }
  }

  async function handleAnalyzePosition() {
    if (!activeGame?.fen || isAnalyzing) {
      return;
    }

    setAnalysisError('');
    setIsAnalyzing(true);

    try {
      const result = await analyzePosition({
        depth: 8,
        fen: activeGame.fen,
        timeLimit: 2000,
      });
      setAnalysis(result);
      setAiExplanation(null);
      setAiError('');
      addToast('Stockfish analysis complete.', 'success');
    } catch (error) {
      const message = getFriendlyGameError(error);
      setAnalysisError(message);
      addToast(message, 'error');
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function handleExplainPosition() {
    if (!analysis || !activeGame?.fen || isGeneratingAi) {
      return;
    }

    setAiError('');
    setIsGeneratingAi(true);

    try {
      const explanation = await explainAnalysis({
        context: {
          currentFen: activeGame.fen,
          gameResult: activeGame.result ?? activeGame.status,
          pgn: activeGame.pgn,
          playerColor,
          stockfish: analysis,
        },
        playerColor,
        style: aiStyle,
      });
      setAiExplanation(explanation);
      addToast('AI coaching explanation ready.', 'success');
    } catch (error) {
      const message = getFriendlyGameError(error);
      setAiError(message);
      addToast(message, 'error');
    } finally {
      setIsGeneratingAi(false);
    }
  }

  function handleLeaveGame() {
    if (!gameId) {
      return;
    }

    leaveRoom({ gameId }).catch(() => {
      // Leaving the route should not be blocked by transport cleanup failure.
    });
  }

  useEffect(() => {
    setCurrentGameId(gameId);
    connectSocket();
    syncGameState({ allowAutoJoin: true });

    return () => {
      disconnectSocket();
    };
  }, [connectSocket, disconnectSocket, gameId, setCurrentGameId, syncGameState]);

  useEffect(() => {
    const cleanups = GAME_UPDATE_EVENTS.map((eventName) =>
      onGameSocketEvent(eventName, (payload) => {
        const nextGame = applyGamePayload(payload);

        if (
          nextGame &&
          eventName === SOCKET_EVENTS.DRAW_OFFER &&
          isDrawOfferForPlayer(nextGame, playerId)
        ) {
          addToast('Your opponent offered a draw.', 'info');
        }

        if (nextGame && eventName === SOCKET_EVENTS.DRAW_DECLINED) {
          addToast('Draw offer declined.', 'info');
        }
      }),
    );

    const cleanupRejectedMove = onGameSocketEvent(SOCKET_EVENTS.MOVE_REJECTED, (payload) => {
      addToast(getFriendlyGameError(payload?.error), 'error');
    });
    const cleanupError = onGameSocketEvent(SOCKET_EVENTS.ERROR, (payload) => {
      addToast(getFriendlyGameError(payload?.error), 'error');
    });
    const cleanupPlayerLeft = onGameSocketEvent(SOCKET_EVENTS.PLAYER_LEFT, () => {
      addToast('A player disconnected. Restoring game state...', 'info');
      syncGameState({ showLoading: false });
    });
    const socket = getSocket();
    const handleConnect = () => {
      syncGameState({ showLoading: false });
    };
    const handleDisconnect = () => {
      addToast('Disconnected from the game server.', 'error');
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    return () => {
      cleanups.forEach((cleanup) => cleanup());
      cleanupRejectedMove();
      cleanupError();
      cleanupPlayerLeft();
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
    };
  }, [addToast, applyGamePayload, playerId, syncGameState]);

  useEffect(() => {
    if (playerColor) {
      setBoardOrientation(playerColor);
    }
  }, [playerColor]);

  const loadingLabel =
    pendingAction === 'move'
      ? 'Submitting move'
      : pendingAction === 'control'
        ? 'Submitting action'
        : 'Restoring game state';

  return (
    <PageContainer className="max-w-7xl">
      <LoadingOverlay isVisible={isRecovering || Boolean(pendingAction)} label={loadingLabel} />
      <div className="fixed right-4 top-4 z-50 grid w-[min(24rem,calc(100vw-2rem))] gap-3">
        {toasts.map((toast) => (
          <Toast key={toast.id} tone={toast.tone}>
            {toast.message}
          </Toast>
        ))}
      </div>

      <Section eyebrow="Game" title="Arena board">
        <div className="mb-5 flex flex-col gap-3 rounded-lg border border-slate-800 bg-slate-900/80 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-50">Socket synchronization</p>
            {connectionError ? (
              <p className="mt-1 text-sm text-rose-200">{connectionError}</p>
            ) : (
              <p className="mt-1 text-sm text-slate-400">
                Backend state is the source of truth. This browser is{' '}
                {playerColor ? `playing ${playerColor}` : 'viewing without a player identity'}.
              </p>
            )}
            {hasDrawOfferByPlayer ? (
              <p className="mt-1 text-sm text-amber-200">Your draw offer is pending.</p>
            ) : null}
          </div>
          <ConnectionStatus label={connectionStatus} tone={isConnected ? 'success' : 'neutral'} />
        </div>

        <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(20rem,1fr)]">
          <div className="min-w-0 space-y-4">
            <PlayerPanel
              isCurrentTurn={isCurrentPlayerTurn(activeGame, 'black')}
              player={blackPlayer}
            />
            <ChessBoardPanel
              isDraggable={canMove}
              isSubmittingMove={pendingAction === 'move'}
              lastMove={lastMove}
              onPieceDrop={handlePieceDrop}
              orientation={boardOrientation}
              position={activeGame?.fen}
            />
            <PlayerPanel
              isCurrentTurn={isCurrentPlayerTurn(activeGame, 'white')}
              player={whitePlayer}
            />
          </div>

          <aside className="min-w-0 space-y-4">
            <WaitingForOpponent isVisible={activeGame?.status === 'WAITING'} />
            <GameStatusPanel activeStatus={activeGame?.status} turn={activeGame?.turn} />
            <AnalysisPanel
              analysis={analysis}
              error={analysisError}
              isDisabled={!activeGame?.fen}
              isThinking={isAnalyzing}
              onAnalyze={handleAnalyzePosition}
            />
            <AIAnalysisPanel
              error={aiError}
              explanation={aiExplanation}
              isDisabled={!analysis}
              isGenerating={isGeneratingAi}
              onExplain={handleExplainPosition}
              onStyleChange={setAiStyle}
              style={aiStyle}
            />
            <CapturedPiecesPanel capturedPieces={capturedPieces} />
            <GameControls
              canAcceptDraw={canAcceptDraw}
              canOfferDraw={canOfferDraw}
              canResign={canUseGameActions}
              gameId={gameId}
              hasPendingAction={Boolean(pendingAction)}
              onAcceptDraw={() => runGameAction(acceptDraw, 'Draw accepted.')}
              onDeclineDraw={() => runGameAction(declineDraw, 'Draw declined.')}
              onFlipBoard={handleFlipBoard}
              onLeaveGame={handleLeaveGame}
              onOfferDraw={() => runGameAction(offerDraw, 'Draw offer sent.')}
              onResign={() => runGameAction(resignGame, 'Resignation submitted.')}
            />
            <GameResultBanner game={activeGame} />
          </aside>
        </div>

        <div className="mt-6 grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,0.8fr)]">
          <MoveHistoryPanel moves={activeGame?.moveHistory ?? []} />
          <GameInfoPanel game={activeGame} gameId={gameId} orientation={boardOrientation} />
        </div>
      </Section>
    </PageContainer>
  );
}
