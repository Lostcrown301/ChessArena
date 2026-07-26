import { classNames } from '@utils/classNames';

const tones = {
  info: 'border-sky-500/40 bg-sky-500/10 text-sky-100',
  success: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-100',
  error: 'border-rose-500/40 bg-rose-500/10 text-rose-100',
};

// Toast is display-only; future notification state should live in a provider.
export function Toast({ children, tone = 'info' }) {
  return (
    <div
      className={classNames('rounded-md border px-4 py-3 text-sm shadow-lg', tones[tone])}
      role="status"
    >
      {children}
    </div>
  );
}
