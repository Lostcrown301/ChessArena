import { useEffect, useRef, useState } from 'react';
import { useGame } from '@hooks/useGame';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { PLAYER_NAME_MAX_LENGTH, normalizePlayerName, validatePlayerName } from '@utils/validation';

export function PlayerNameModal({ isOpen, onClose }) {
  const { playerName, setPlayerName } = useGame();
  const [draftName, setDraftName] = useState(playerName);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setDraftName(playerName);
    setError('');
    window.requestAnimationFrame(() => inputRef.current?.focus());
  }, [isOpen, playerName]);

  if (!isOpen) {
    return null;
  }

  function handleSubmit(event) {
    event.preventDefault();

    const validationError = validatePlayerName(draftName);

    if (validationError) {
      setError(validationError);
      return;
    }

    setPlayerName(normalizePlayerName(draftName));
    onClose();
  }

  return (
    <div
      aria-labelledby="player-name-title"
      aria-modal="true"
      className="fixed inset-0 z-50 grid place-items-center bg-slate-950/75 px-4"
      role="dialog"
    >
      <form
        className="w-full max-w-md rounded-lg border border-slate-700 bg-slate-900 p-6 shadow-xl"
        onSubmit={handleSubmit}
      >
        <h2 className="text-lg font-semibold text-slate-50" id="player-name-title">
          Choose your display name
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          This name is saved on this device and used when creating or joining games.
        </p>
        <div className="mt-5">
          <Input
            aria-describedby={error ? 'player-name-error' : 'player-name-help'}
            id="player-name"
            label="Display name"
            maxLength={PLAYER_NAME_MAX_LENGTH}
            onChange={(event) => setDraftName(event.target.value)}
            placeholder="Enter your name"
            ref={inputRef}
            value={draftName}
          />
          <p className="mt-2 text-xs text-slate-500" id="player-name-help">
            Maximum {PLAYER_NAME_MAX_LENGTH} characters.
          </p>
          {error ? (
            <p className="mt-2 text-sm text-rose-200" id="player-name-error">
              {error}
            </p>
          ) : null}
        </div>
        <div className="mt-6 flex justify-end gap-3">
          {playerName ? (
            <Button onClick={onClose} variant="ghost">
              Cancel
            </Button>
          ) : null}
          <Button type="submit">Save name</Button>
        </div>
      </form>
    </div>
  );
}
