import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@components/ui/Card';
import { EmptyState } from '@components/common/EmptyState';
import { listHistory } from '@services/api/HistoryService';

export function RecentGamesPanel() {
  const [games, setGames] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function fetchRecent() {
      try {
        const data = await listHistory({ limit: 5, sort: 'desc' });
        if (mounted) setGames(data.games);
      } catch (err) {
        console.error('Failed to load recent games', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    fetchRecent();
    return () => {
      mounted = false;
    };
  }, []);

  if (isLoading) {
    return (
      <Card as="aside">
        <h2 className="text-lg font-semibold text-slate-50">Recent Games</h2>
        <div className="mt-4 flex animate-pulse flex-col gap-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-12 rounded-md bg-slate-800"></div>
          ))}
        </div>
      </Card>
    );
  }

  if (games.length === 0) {
    return (
      <EmptyState title="No games yet">
        When you complete a game, it will appear here in your recent history.
      </EmptyState>
    );
  }

  return (
    <Card as="aside" className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-50">Recent Games</h2>
        <Link
          to="/history"
          className="text-sm font-semibold text-emerald-400 hover:text-emerald-300"
        >
          View all
        </Link>
      </div>

      <div className="flex flex-col gap-2">
        {games.map((game) => (
          <Link
            key={game.id}
            to={`/review/${game.id}`}
            className="group flex flex-col justify-center rounded-md border border-slate-800 bg-slate-900/50 p-3 transition hover:border-emerald-500/30 hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
          >
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-slate-200">
                {game.whitePlayer?.displayName} vs {game.blackPlayer?.displayName}
              </span>
              <span className="text-xs text-slate-400">
                {new Date(game.startedAt).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </div>
            <span className="mt-1 text-xs text-slate-500 group-hover:text-emerald-400/80">
              {game.result.replace('_', ' ')}
            </span>
          </Link>
        ))}
      </div>
    </Card>
  );
}
