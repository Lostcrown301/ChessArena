import { LoadingSpinner } from '@components/ui/LoadingSpinner';

export function LoadingOverlay({ isVisible, label = 'Working' }) {
  if (!isVisible) {
    return null;
  }

  return (
    <div
      aria-live="polite"
      className="fixed inset-0 z-40 grid place-items-center bg-slate-950/70 px-4"
      role="status"
    >
      <div className="rounded-lg border border-slate-700 bg-slate-900 px-6 py-5 shadow-xl">
        <LoadingSpinner label={label} />
      </div>
    </div>
  );
}
