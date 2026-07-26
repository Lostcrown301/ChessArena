export function GameSummaryCard({ summary }) {
  return (
    <section className="rounded-md border border-slate-800 bg-slate-950/60 p-3">
      <h3 className="text-sm font-semibold text-slate-100">Coach summary</h3>
      <p className="mt-2 text-sm leading-6 text-slate-300">
        {summary || 'Request an explanation to generate a coach summary.'}
      </p>
    </section>
  );
}
