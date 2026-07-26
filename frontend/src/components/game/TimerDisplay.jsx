import { classNames } from '@utils/classNames';

// TimerDisplay is static in this milestone; countdown ownership belongs to later gameplay state.
export function TimerDisplay({ className, label = 'Timer', time = '10:00' }) {
  return (
    <span
      aria-label={`${label}: ${time}`}
      className={classNames(
        'inline-flex min-w-20 items-center justify-center rounded-md border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-sm font-semibold text-slate-100',
        className,
      )}
    >
      {time}
    </span>
  );
}
