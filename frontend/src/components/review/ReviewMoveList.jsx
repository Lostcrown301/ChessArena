import { useEffect, useRef } from 'react';
import { Card } from '@components/ui/Card';
import { classNames } from '@utils/classNames';

function groupMovesByTurn(moves) {
  return moves.reduce((historyRows, move) => {
    const rowNumber = Math.ceil(move.moveNumber / 2);
    const existingRow = historyRows.find((row) => row.moveNumber === rowNumber);
    const row = existingRow ?? { black: null, moveNumber: rowNumber, white: null };

    if (move.moveNumber % 2 !== 0) {
      row.white = move;
    } else {
      row.black = move;
    }

    if (!existingRow) {
      historyRows.push(row);
    }

    return historyRows;
  }, []);
}

export function ReviewMoveList({ moves = [], currentIndex, onJumpToMove }) {
  const activeRef = useRef(null);
  const rows = groupMovesByTurn(moves);

  useEffect(() => {
    if (activeRef.current) {
      activeRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [currentIndex]);

  const renderMoveCell = (move, index) => {
    if (!move) return <td className="px-3 py-2 font-mono">-</td>;

    const isActive = index === currentIndex;

    return (
      <td className="p-1">
        <button
          ref={isActive ? activeRef : null}
          onClick={() => onJumpToMove(index)}
          className={classNames(
            'w-full cursor-pointer rounded px-2 py-1 text-left font-mono text-sm transition',
            isActive
              ? 'bg-emerald-500/20 text-emerald-300 font-bold'
              : 'text-slate-300 hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500',
          )}
        >
          {move.san}
        </button>
      </td>
    );
  };

  return (
    <Card as="section" className="flex h-full flex-col min-h-[20rem]">
      <h2 className="mb-4 text-base font-semibold text-slate-50">Moves</h2>
      <div
        className="flex-1 overflow-auto rounded-md border border-slate-800 bg-slate-900/50"
        tabIndex={0}
      >
        <table className="w-full border-collapse text-left text-sm">
          <thead className="sticky top-0 bg-slate-950 text-xs uppercase text-slate-400 z-10 shadow-sm shadow-black/50">
            <tr>
              <th className="w-16 px-3 py-2 font-semibold">#</th>
              <th className="px-3 py-2 font-semibold w-1/2">White</th>
              <th className="px-3 py-2 font-semibold w-1/2">Black</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {rows.map((row) => (
              <tr key={row.moveNumber}>
                <td className="px-3 py-2 font-mono text-slate-500">{row.moveNumber}</td>
                {renderMoveCell(row.white, row.white ? row.white.moveNumber - 1 : -1)}
                {renderMoveCell(row.black, row.black ? row.black.moveNumber - 1 : -1)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
