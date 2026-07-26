import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@components/ui/Button';
import { Card } from '@components/ui/Card';
import { Toast } from '@components/ui/Toast';

async function copyText(value) {
  if (!value) {
    throw new Error('No game ID available.');
  }

  try {
    if (navigator.clipboard?.writeText && window.isSecureContext) {
      await navigator.clipboard.writeText(value);
      return;
    }
  } catch {
    // Fall through to the textarea strategy for browsers that expose but deny Clipboard API.
  }

  const textarea = document.createElement('textarea');
  textarea.value = value;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();

  const didCopy = document.execCommand('copy');
  document.body.removeChild(textarea);

  if (!didCopy) {
    throw new Error('Clipboard copy was blocked.');
  }
}

// GameControls calls backend actions but never decides whether a chess action is legal.
export function GameControls({
  canAcceptDraw = false,
  canOfferDraw = false,
  canResign = false,
  gameId,
  hasPendingAction = false,
  onAcceptDraw,
  onDeclineDraw,
  onFlipBoard,
  onLeaveGame,
  onOfferDraw,
  onResign,
}) {
  const [toast, setToast] = useState(null);

  async function handleCopyGameId() {
    try {
      await copyText(gameId);
      setToast({ message: 'Game ID copied.', tone: 'success' });
    } catch (error) {
      setToast({ message: error.message, tone: 'error' });
    }
  }

  return (
    <Card as="section" data-testid="game-controls">
      <h2 className="text-base font-semibold text-slate-50">Game Controls</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
        <Button as={Link} onClick={onLeaveGame} to="/lobby" variant="secondary">
          Leave Game
        </Button>
        <Button aria-label="Copy game ID" onClick={handleCopyGameId} variant="secondary">
          Copy Game ID
        </Button>
        <Button aria-label="Flip board orientation" onClick={onFlipBoard} variant="ghost">
          Flip Board
        </Button>
        <Button disabled={!canResign || hasPendingAction} onClick={onResign} variant="ghost">
          Resign
        </Button>
        <Button disabled={!canOfferDraw || hasPendingAction} onClick={onOfferDraw} variant="ghost">
          Offer Draw
        </Button>
        {canAcceptDraw ? (
          <>
            <Button disabled={hasPendingAction} onClick={onAcceptDraw} variant="primary">
              Accept Draw
            </Button>
            <Button disabled={hasPendingAction} onClick={onDeclineDraw} variant="secondary">
              Decline Draw
            </Button>
          </>
        ) : null}
      </div>
      {toast ? (
        <div className="mt-4" data-testid="copy-toast">
          <Toast tone={toast.tone}>{toast.message}</Toast>
        </div>
      ) : null}
    </Card>
  );
}
