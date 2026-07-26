import { Badge } from '@components/ui/Badge';
import { TERMINAL_GAME_STATUSES } from '@constants/gameUi';

// GameResultBanner appears only after the backend marks the active game terminal.
export function GameResultBanner({ game }) {
  if (!game || !TERMINAL_GAME_STATUSES.includes(game.status)) {
    return null;
  }

  const result = game.status === 'DRAW' ? 'Draw' : `${game.winner?.displayName ?? 'Winner'} wins`;

  return (
    <section
      aria-label="Game result"
      className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4"
      data-testid="game-result-banner"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-emerald-100">Result</h2>
          <p className="mt-1 text-sm text-emerald-50">Final PGN and FEN are server-confirmed.</p>
        </div>
        <Badge tone="success">{result}</Badge>
      </div>
    </section>
  );
}
