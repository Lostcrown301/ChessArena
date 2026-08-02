import { Chessboard } from 'react-chessboard';

export function ReviewBoardPanel({ position, orientation = 'white', lastMove }) {
  const customSquareStyles = {};

  if (lastMove?.from && lastMove?.to) {
    const highlight = {
      background:
        'radial-gradient(circle, rgba(16, 185, 129, 0.38) 26%, rgba(16, 185, 129, 0.18) 28%, transparent 52%)',
    };
    customSquareStyles[lastMove.from] = highlight;
    customSquareStyles[lastMove.to] = highlight;
  }

  return (
    <section
      aria-label="Review chessboard"
      className="min-w-0 rounded-lg border border-slate-800 bg-slate-900/80 p-3 shadow-sm shadow-black/20 sm:p-4"
    >
      <div
        className="mx-auto aspect-square w-full max-w-full overflow-hidden rounded-md ring-1 ring-slate-700"
        style={{ maxWidth: 'min(74vh, 42rem)' }}
      >
        <Chessboard
          animationDuration={200}
          areArrowsAllowed={true}
          arePiecesDraggable={false}
          boardOrientation={orientation}
          customBoardStyle={{ borderRadius: '6px' }}
          customDarkSquareStyle={{ backgroundColor: '#334155' }}
          customLightSquareStyle={{ backgroundColor: '#cbd5e1' }}
          customNotationStyle={{ fontSize: '0.7rem', fontWeight: 700 }}
          customSquareStyles={customSquareStyles}
          position={position || 'start'}
          showBoardNotation
        />
      </div>
    </section>
  );
}
