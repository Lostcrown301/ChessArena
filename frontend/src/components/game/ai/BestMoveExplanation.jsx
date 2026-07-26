export function BestMoveExplanation({ explanation }) {
  return (
    <section className="rounded-md border border-emerald-500/20 bg-emerald-500/10 p-3">
      <h3 className="text-sm font-semibold text-emerald-100">Best move explanation</h3>
      <p className="mt-2 text-sm leading-6 text-emerald-50">
        {explanation || 'Stockfish best-move context will be explained here.'}
      </p>
    </section>
  );
}
