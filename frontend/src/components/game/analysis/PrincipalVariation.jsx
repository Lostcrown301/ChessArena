export function PrincipalVariation({ moves = [] }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Top line</p>
      <div
        className="mt-2 flex min-h-10 flex-wrap gap-2 rounded-md border border-slate-800 bg-slate-950 p-3"
        data-testid="principal-variation"
      >
        {moves.length ? (
          moves.map((move, index) => (
            <span className="font-mono text-sm text-slate-100" key={`${move}-${index}`}>
              {move}
            </span>
          ))
        ) : (
          <span className="text-sm text-slate-500">
            Analyze the current position to see a line.
          </span>
        )}
      </div>
    </div>
  );
}
