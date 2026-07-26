// WaitingForOpponent reflects backend WAITING state while the second player has not joined.
export function WaitingForOpponent({ isVisible }) {
  if (!isVisible) {
    return null;
  }

  return (
    <section
      aria-live="polite"
      className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-50"
      data-testid="waiting-for-opponent"
    >
      <h2 className="font-semibold">Waiting for opponent</h2>
      <p className="mt-1 text-amber-100">
        The board unlocks after the backend confirms both players are in the game.
      </p>
    </section>
  );
}
