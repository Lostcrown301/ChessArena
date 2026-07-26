import { Input } from '@components/ui/Input';

export function GameIdInput({ error, onChange, value }) {
  return (
    <div>
      <Input
        aria-describedby={error ? 'game-id-error' : 'game-id-help'}
        id="game-id"
        label="Game ID"
        onChange={(event) => onChange(event.target.value)}
        placeholder="Paste a game UUID"
        value={value}
      />
      <p className="mt-2 text-xs text-slate-500" id="game-id-help">
        Game IDs are generated after a game is created.
      </p>
      {error ? (
        <p className="mt-2 text-sm text-rose-200" id="game-id-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}
