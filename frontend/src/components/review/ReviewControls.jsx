import { Button } from '@components/ui/Button';
import { Card } from '@components/ui/Card';

export function ReviewControls({
  currentIndex,
  totalMoves,
  onFirst,
  onPrev,
  onNext,
  onLast,
  onFlipBoard,
}) {
  return (
    <Card className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          onClick={onFirst}
          disabled={currentIndex === -1}
          aria-label="First move"
        >
          {'<<'}
        </Button>
        <Button
          variant="secondary"
          onClick={onPrev}
          disabled={currentIndex === -1}
          aria-label="Previous move"
        >
          {'<'}
        </Button>
        <span className="min-w-[4rem] text-center text-sm font-semibold text-slate-300">
          {currentIndex + 1} / {totalMoves}
        </span>
        <Button
          variant="secondary"
          onClick={onNext}
          disabled={currentIndex === totalMoves - 1}
          aria-label="Next move"
        >
          {'>'}
        </Button>
        <Button
          variant="secondary"
          onClick={onLast}
          disabled={currentIndex === totalMoves - 1}
          aria-label="Last move"
        >
          {'>>'}
        </Button>
      </div>
      <div>
        <Button variant="ghost" onClick={onFlipBoard}>
          Flip Board
        </Button>
      </div>
    </Card>
  );
}
