// LoadingSpinner gives async screens a consistent accessible loading indicator.
export function LoadingSpinner({ label = 'Loading' }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm text-slate-300" role="status">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-600 border-t-emerald-400" />
      <span>{label}</span>
    </span>
  );
}
