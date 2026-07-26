import { Card } from '@components/ui/Card';

// GameInfoPanel reports backend metadata without inventing local board state.
export function GameInfoPanel({ game, gameId, orientation }) {
  const moveCount = game?.moveHistory?.length ?? 0;
  const updatedAt = game?.updatedAt ? new Date(game.updatedAt).toLocaleString() : 'Not loaded';
  const pgn = game?.pgn || 'No moves yet';

  return (
    <Card as="section" data-testid="game-info-panel">
      <h2 className="text-base font-semibold text-slate-50">Game Information</h2>
      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">Game ID</dt>
          <dd className="mt-1 break-all font-mono text-slate-100">
            {gameId || 'No game selected'}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Orientation
          </dt>
          <dd className="mt-1 capitalize text-slate-100" data-testid="board-orientation-label">
            {orientation}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">Status</dt>
          <dd className="mt-1 text-slate-100">{game?.status ?? 'Loading'}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">Turn</dt>
          <dd className="mt-1 text-slate-100">{game?.turn === 'b' ? 'Black' : 'White'}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">Moves</dt>
          <dd className="mt-1 text-slate-100">{moveCount}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">Updated</dt>
          <dd className="mt-1 text-slate-100">{updatedAt}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">PGN</dt>
          <dd className="mt-1 max-h-28 overflow-auto rounded-md border border-slate-800 bg-slate-950 p-3 font-mono text-xs text-slate-100">
            {pgn}
          </dd>
        </div>
      </dl>
    </Card>
  );
}
