export function SuccessBanner({ message }) {
  if (!message) {
    return null;
  }

  return (
    <div
      className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100"
      role="status"
    >
      {message}
    </div>
  );
}
