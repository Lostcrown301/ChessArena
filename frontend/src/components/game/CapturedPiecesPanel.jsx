import { Card } from '@components/ui/Card';

function PieceRow({ label, pieces }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</p>
      <div className="mt-2 flex min-h-10 flex-wrap gap-2">
        {pieces.length ? (
          pieces.map((piece, index) => (
            <span
              aria-label={`Captured ${piece}`}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-700 bg-slate-950 font-mono text-sm font-semibold text-slate-200"
              key={`${piece}-${index}`}
            >
              {piece}
            </span>
          ))
        ) : (
          <span className="text-sm text-slate-500">None yet</span>
        )}
      </div>
    </div>
  );
}

// CapturedPiecesPanel renders captures already reported by backend-confirmed move history.
export function CapturedPiecesPanel({ capturedPieces }) {
  return (
    <Card as="section" data-testid="captured-pieces-panel">
      <h2 className="text-base font-semibold text-slate-50">Captured Pieces</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
        <PieceRow label="White captures" pieces={capturedPieces.white} />
        <PieceRow label="Black captures" pieces={capturedPieces.black} />
      </div>
    </Card>
  );
}
