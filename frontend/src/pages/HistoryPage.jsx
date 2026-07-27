import { useEffect, useState } from 'react';
import { Section } from '@components/common/Section';
import { EmptyState } from '@components/common/EmptyState';
import { GameHistoryCard } from '@components/history/GameHistoryCard';
import { HistoryFilters } from '@components/history/HistoryFilters';
import { HistoryPagination } from '@components/history/HistoryPagination';
import { listHistory } from '@services/api/HistoryService';

export function HistoryPage() {
  const [filterState, setFilterState] = useState({
    page: 1,
    limit: 10,
    result: 'all',
    search: '',
    sort: 'desc',
  });
  
  const [data, setData] = useState({ games: [], pagination: { totalPages: 1 } });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function loadGames() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await listHistory(filterState);
        if (mounted) setData(response);
      } catch {
        if (mounted) setError('Failed to load history.');
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    // Debounce search slightly to avoid spamming the API while typing
    const timer = setTimeout(() => {
      loadGames();
    }, 300);

    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, [filterState]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <Section title="Game History" eyebrow="Archives">
        <div className="mb-8">
          <HistoryFilters filterState={filterState} onFilterChange={setFilterState} />
        </div>

        {error ? (
          <EmptyState title="Error Loading History">{error}</EmptyState>
        ) : isLoading ? (
          <div className="flex animate-pulse flex-col gap-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-24 rounded-lg bg-slate-800" />
            ))}
          </div>
        ) : !data?.games || data.games.length === 0 ? (
          <EmptyState title="No games found">
            Try adjusting your search or filters.
          </EmptyState>
        ) : (
          <div className="flex flex-col gap-4">
            {data?.games?.map((game) => (
              <GameHistoryCard key={game.id} game={game} />
            ))}
          </div>
        )}

        <div className="mt-8">
          <HistoryPagination
            page={filterState.page}
            totalPages={data.pagination?.totalPages ?? 1}
            onPageChange={(page) => setFilterState((prev) => ({ ...prev, page }))}
          />
        </div>
      </Section>
    </div>
  );
}
