import { useEffect, useRef } from 'react';
import { Card } from '@components/ui/Card';

function groupMovesByTurn(moves) {
  return moves.reduce((historyRows, move) => {
    const rowNumber = Math.ceil(move.moveNumber / 2);
    const existingRow = historyRows.find((row) => row.moveNumber === rowNumber);
    const row = existingRow ?? { black: '', moveNumber: rowNumber, white: '' };

    if (move.color === 'w') {
      row.white = move.san;
    } else {
      row.black = move.san;
    }

    if (!existingRow) {
      historyRows.push(row);
    }

    return historyRows;
  }, []);
}

// MoveHistoryPanel renders backend-confirmed SAN only and auto-scrolls as moves arrive.
export function MoveHistoryPanel({ moves = [] }) {
  const endRef = useRef(null);
  const rows = groupMovesByTurn(moves);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'nearest' });
  }, [moves]);

  return (
    <Card as="section" className="min-h-72 min-w-0" data-testid="move-history-panel">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-slate-50">Move History</h2>
        <span className="text-xs text-slate-400">{moves.length} moves</span>
      </div>
      <div
        aria-label="Move history"
        className="mt-4 max-h-72 overflow-auto rounded-md border border-slate-800"
        role="region"
        tabIndex={0}
      >
        <table className="w-full border-collapse text-left text-sm">
          <thead className="sticky top-0 bg-slate-950 text-xs uppercase text-slate-400">
            <tr>
              <th className="w-16 px-3 py-2 font-semibold">#</th>
              <th className="px-3 py-2 font-semibold">White</th>
              <th className="px-3 py-2 font-semibold">Black</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {rows.map((move) => (
              <tr key={move.moveNumber} className="text-slate-200">
                <td className="px-3 py-2 font-mono text-slate-400">{move.moveNumber}</td>
                <td className="px-3 py-2 font-mono">{move.white || '-'}</td>
                <td className="px-3 py-2 font-mono">{move.black || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <span ref={endRef} />
      </div>
    </Card>
  );
}
