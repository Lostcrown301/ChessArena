import { Button } from '@components/ui/Button';
import { Card } from '@components/ui/Card';
import { EvaluationBar } from './EvaluationBar';
import { EngineStatus } from './EngineStatus';
import { BestMoveCard } from './BestMoveCard';
import { PrincipalVariation } from './PrincipalVariation';

export function AnalysisPanel({ analysis, error, isDisabled, isThinking, onAnalyze }) {
  const principalVariation =
    analysis?.pv?.length || !analysis?.bestMove ? (analysis?.pv ?? []) : [analysis.bestMove];

  return (
    <Card as="section" data-testid="analysis-panel">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-50">Analysis</h2>
          <p className="mt-1 text-sm text-slate-400">
            Stockfish evaluates only when requested and never controls gameplay.
          </p>
        </div>
        <EngineStatus error={error} isThinking={isThinking} />
      </div>

      <div className="mt-4 grid gap-4">
        <EvaluationBar evaluation={analysis?.evaluation} mate={analysis?.mate} />
        <BestMoveCard
          bestMove={analysis?.bestMove}
          depth={analysis?.depth}
          evaluation={analysis?.evaluation}
          mate={analysis?.mate}
        />
        {analysis?.mate !== null && analysis?.mate !== undefined ? (
          <p className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
            Mate detected in {analysis.mate}.
          </p>
        ) : null}
        <PrincipalVariation moves={principalVariation} />
        {error ? <p className="text-sm text-rose-200">{error}</p> : null}
        <Button disabled={isDisabled || isThinking} onClick={onAnalyze} variant="secondary">
          {isThinking ? 'Analyzing...' : 'Analyze Position'}
        </Button>
      </div>
    </Card>
  );
}
