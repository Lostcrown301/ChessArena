import { Link } from 'react-router-dom';
import { Card } from '@components/ui/Card';
import { classNames } from '@utils/classNames';

export function GameHistoryCard({ game }) {
  const resultColors = {
    white_win: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    black_win: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    draw: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
    ongoing: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    abandoned: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
  };

  const labels = {
    white_win: 'White Won',
    black_win: 'Black Won',
    draw: 'Draw',
    ongoing: 'Ongoing',
    abandoned: 'Abandoned',
  };

  const date = new Date(game.startedAt).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <Card
      as={Link}
      to={`/review/${game.id}`}
      className="group block transition hover:border-emerald-500/50 hover:bg-slate-800/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-slate-100">
              {game.whitePlayer?.displayName ?? 'Unknown'} (White)
            </span>
            <span className="text-xs text-slate-400">vs</span>
            <span className="text-sm font-semibold text-slate-100">
              {game.blackPlayer?.displayName ?? 'Unknown'} (Black)
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4 sm:flex-col sm:items-end sm:gap-1">
          <span
            className={classNames(
              'rounded-full border px-2.5 py-0.5 text-xs font-semibold',
              resultColors[game.result] || resultColors.ongoing,
            )}
          >
            {labels[game.result] || 'Unknown'}
          </span>
          <span className="text-xs text-slate-400">{date}</span>
        </div>
      </div>
    </Card>
  );
}
