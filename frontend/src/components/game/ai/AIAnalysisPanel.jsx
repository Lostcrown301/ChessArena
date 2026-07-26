import { Button } from '@components/ui/Button';
import { Card } from '@components/ui/Card';
import { classNames } from '@utils/classNames';
import { BestMoveExplanation } from './BestMoveExplanation';
import { DifficultyBadge } from './DifficultyBadge';
import { GameSummaryCard } from './GameSummaryCard';
import { ImprovementTips } from './ImprovementTips';
import { MistakeList } from './MistakeList';

const STYLE_OPTIONS = [
  { label: 'Beginner', value: 'beginner' },
  { label: 'Intermediate', value: 'intermediate' },
  { label: 'Advanced', value: 'advanced' },
];

export function AIAnalysisPanel({
  explanation,
  error,
  isDisabled,
  isGenerating,
  onExplain,
  onStyleChange,
  style,
}) {
  return (
    <Card as="section" data-testid="ai-analysis-panel">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-50">AI Coach</h2>
          <p className="mt-1 text-sm text-slate-400">
            Gemini explains Stockfish results in human language. It never replaces engine analysis.
          </p>
        </div>
        {explanation?.difficulty ? <DifficultyBadge difficulty={explanation.difficulty} /> : null}
      </div>

      <div className="mt-4 grid gap-4">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Explanation style">
          {STYLE_OPTIONS.map((option) => (
            <button
              key={option.value}
              aria-pressed={style === option.value}
              className={classNames(
                'rounded-md border px-3 py-2 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950',
                style === option.value
                  ? 'border-emerald-400 bg-emerald-400 text-emerald-950'
                  : 'border-slate-700 bg-slate-950 text-slate-200 hover:bg-slate-800',
              )}
              disabled={isGenerating}
              onClick={() => onStyleChange(option.value)}
              type="button"
            >
              {option.label}
            </button>
          ))}
        </div>

        {isDisabled ? (
          <p className="rounded-md border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm text-slate-400">
            Run Stockfish analysis first so Gemini has trusted engine context.
          </p>
        ) : null}

        {error ? <p className="text-sm text-rose-200">{error}</p> : null}

        {explanation ? (
          <div className="grid gap-4">
            <GameSummaryCard summary={explanation.summary} />
            <BestMoveExplanation explanation={explanation.bestMoveExplanation} />
            <MistakeList mistakes={explanation.mistakes} />
            <ImprovementTips tips={explanation.tips} />
            {explanation.cached ? (
              <p className="text-xs text-slate-500">Using a cached coaching explanation.</p>
            ) : null}
          </div>
        ) : null}

        <Button disabled={isDisabled || isGenerating} onClick={onExplain} variant="secondary">
          {isGenerating
            ? 'Generating coaching...'
            : error
              ? 'Retry Explanation'
              : 'Explain Position'}
        </Button>
      </div>
    </Card>
  );
}
