import { Button } from '@components/ui/Button';

// EmptyState gives feature pages a polished placeholder before data exists.
export function EmptyState({ actionLabel, children, onAction, title }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-700 bg-slate-900/60 px-6 py-10 text-center">
      <h2 className="text-lg font-semibold text-slate-50">{title}</h2>
      {children ? <p className="mx-auto mt-2 max-w-xl text-sm text-slate-400">{children}</p> : null}
      {actionLabel ? (
        <div className="mt-5">
          <Button onClick={onAction}>{actionLabel}</Button>
        </div>
      ) : null}
    </div>
  );
}
