import { Card } from '@components/ui/Card';

export function BestMoveCard({ bestMove, depth, evaluation, mate }) {
  const score = mate !== null && mate !== undefined ? `Mate ${mate}` : `${evaluation ?? 0}`;

  return (
    <Card className="bg-slate-950/60 p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Best move</p>
      <p className="mt-2 font-mono text-lg font-semibold text-slate-50">
        {bestMove ?? 'Not analyzed'}
      </p>
      <p className="mt-1 text-sm text-slate-400">
        Score {score} at depth {depth ?? '-'}
      </p>
    </Card>
  );
}
