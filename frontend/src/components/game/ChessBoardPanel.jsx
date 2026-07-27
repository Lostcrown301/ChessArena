import { Chessboard } from 'react-chessboard';

function getLastMoveStyles(move) {
  if (!move?.from || !move?.to) {
    return {};
  }

  const highlight = {
    background:
      'radial-gradient(circle, rgba(16, 185, 129, 0.38) 26%, rgba(16, 185, 129, 0.18) 28%, transparent 52%)',
  };

  return {
    [move.from]: highlight,
    [move.to]: highlight,
  };
}

// The board renders only server-confirmed FEN. Dragging requests moves; it never mutates local state.
export function ChessBoardPanel({
  isDraggable = false,
  isSubmittingMove = false,
  lastMove,
  onPieceDrop,
  orientation = 'white',
  position,
}) {
  return (
    <section
      aria-busy={isSubmittingMove}
      aria-label="Live chessboard"
      className="min-w-0 rounded-lg border border-slate-800 bg-slate-900/80 p-3 shadow-sm shadow-black/20 sm:p-4"
      data-orientation={orientation}
      data-testid="chess-board-panel"
    >
      <div
        className="mx-auto aspect-square w-full max-w-full overflow-hidden rounded-md ring-1 ring-slate-700"
      >
        {position ? (
          <Chessboard
            animationDuration={200}
            areArrowsAllowed={false}
            arePiecesDraggable={!isSubmittingMove}
            boardOrientation={orientation}
            customBoardStyle={{
              borderRadius: '6px',
            }}
            customDarkSquareStyle={{
              backgroundColor: '#334155',
            }}
            customLightSquareStyle={{
              backgroundColor: '#cbd5e1',
            }}
            customNotationStyle={{
              fontSize: '0.7rem',
              fontWeight: 700,
            }}
            customSquareStyles={getLastMoveStyles(lastMove)}
            id="chess-arena-live-board"
            onPieceDrop={onPieceDrop}
            position={position}
            showBoardNotation
          />
        ) : (
          <div className="flex h-full min-h-80 items-center justify-center bg-slate-950 text-sm text-slate-400">
            Loading board...
          </div>
        )}
      </div>
      <p className="mt-3 text-center text-xs text-slate-400">
        Board state is rendered from the backend. Moves update only after server acceptance.
      </p>
    </section>
  );
}
