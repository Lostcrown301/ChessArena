import { Button } from '@components/ui/Button';
import { Card } from '@components/ui/Card';
import { GameIdInput } from './GameIdInput';

export function JoinGameCard({ disabled, gameId, gameIdError, onGameIdChange, onJoin }) {
  return (
    <Card>
      <h2 className="text-xl font-semibold text-slate-50">Join Game</h2>
      <p className="mt-2 text-sm leading-6 text-slate-400">
        Enter an existing game ID to join as the second player.
      </p>
      <form className="mt-6 grid gap-4" onSubmit={onJoin}>
        <GameIdInput error={gameIdError} onChange={onGameIdChange} value={gameId} />
        <Button disabled={disabled} type="submit" variant="secondary">
          Join game
        </Button>
      </form>
    </Card>
  );
}
