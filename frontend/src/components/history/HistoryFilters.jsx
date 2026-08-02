import { classNames } from '@utils/classNames';

const RESULTS = [
  { value: 'all', label: 'All Games' },
  { value: 'white_win', label: 'White Won' },
  { value: 'black_win', label: 'Black Won' },
  { value: 'draw', label: 'Draw' },
];

export function HistoryFilters({ filterState, onFilterChange }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap gap-2 rounded-lg border border-slate-800 bg-slate-900/50 p-1">
        {RESULTS.map((res) => (
          <button
            key={res.value}
            onClick={() => onFilterChange({ ...filterState, result: res.value, page: 1 })}
            className={classNames(
              'rounded-md px-3 py-1.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300',
              filterState.result === res.value
                ? 'bg-emerald-500 text-emerald-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-100',
            )}
          >
            {res.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <input
          type="text"
          placeholder="Search Game ID..."
          value={filterState.search}
          onChange={(e) => onFilterChange({ ...filterState, search: e.target.value, page: 1 })}
          className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 sm:w-48"
        />
        <select
          value={filterState.sort}
          onChange={(e) => onFilterChange({ ...filterState, sort: e.target.value, page: 1 })}
          className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        >
          <option value="desc">Newest First</option>
          <option value="asc">Oldest First</option>
        </select>
      </div>
    </div>
  );
}
