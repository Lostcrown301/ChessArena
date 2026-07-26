export function MistakeList({ mistakes = [] }) {
  return (
    <section>
      <h3 className="text-sm font-semibold text-slate-100">Critical mistakes</h3>
      {mistakes.length > 0 ? (
        <ul className="mt-2 grid gap-2 text-sm text-slate-300">
          {mistakes.map((mistake) => (
            <li
              key={mistake}
              className="rounded-md border border-slate-800 bg-slate-950/50 px-3 py-2"
            >
              {mistake}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-slate-400">No mistakes have been explained yet.</p>
      )}
    </section>
  );
}
