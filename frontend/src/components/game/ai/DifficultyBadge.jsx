const toneByDifficulty = {
  Beginner: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-100',
  Intermediate: 'border-amber-400/30 bg-amber-400/10 text-amber-100',
  Advanced: 'border-sky-400/30 bg-sky-400/10 text-sky-100',
};

export function DifficultyBadge({ difficulty = 'Intermediate' }) {
  const tone = toneByDifficulty[difficulty] ?? toneByDifficulty.Intermediate;

  return (
    <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${tone}`}>
      {difficulty}
    </span>
  );
}
