function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function EvaluationBar({ evaluation, mate }) {
  const normalized =
    mate !== null && mate !== undefined
      ? mate > 0
        ? 100
        : 0
      : clamp(50 + (evaluation ?? 0) * 8, 0, 100);

  return (
    <div aria-label="Evaluation bar" className="overflow-hidden rounded-md border border-slate-700">
      <div className="h-3 bg-slate-950">
        <div className="h-full bg-emerald-400 transition-all" style={{ width: `${normalized}%` }} />
      </div>
      <div className="flex justify-between bg-slate-900 px-2 py-1 text-xs text-slate-400">
        <span>Black</span>
        <span>White</span>
      </div>
    </div>
  );
}
