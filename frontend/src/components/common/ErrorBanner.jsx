export function ErrorBanner({ message }) {
  if (!message) {
    return null;
  }

  return (
    <div
      className="rounded-md border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100"
      role="alert"
    >
      {message}
    </div>
  );
}
