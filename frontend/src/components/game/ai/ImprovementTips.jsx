export function ImprovementTips({ tips = [] }) {
  return (
    <section>
      <h3 className="text-sm font-semibold text-slate-100">Improvement tips</h3>
      {tips.length > 0 ? (
        <ol className="mt-2 grid gap-2 text-sm text-slate-300">
          {tips.map((tip, index) => (
            <li key={tip} className="rounded-md border border-slate-800 bg-slate-950/50 px-3 py-2">
              <span className="mr-2 font-semibold text-emerald-200">{index + 1}.</span>
              {tip}
            </li>
          ))}
        </ol>
      ) : (
        <p className="mt-2 text-sm text-slate-400">Run coaching to see targeted tips.</p>
      )}
    </section>
  );
}
