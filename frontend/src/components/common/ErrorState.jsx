import { Button } from '@components/ui/Button';

// ErrorState provides an accessible recovery surface for future async screens.
export function ErrorState({ message, onRetry, title = 'Something went wrong' }) {
  return (
    <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-6 py-8" role="alert">
      <h2 className="text-lg font-semibold text-rose-100">{title}</h2>
      {message ? <p className="mt-2 text-sm text-rose-200/80">{message}</p> : null}
      {onRetry ? (
        <div className="mt-5">
          <Button onClick={onRetry} variant="secondary">
            Try again
          </Button>
        </div>
      ) : null}
    </div>
  );
}
