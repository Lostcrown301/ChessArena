import { classNames } from '@utils/classNames';

const tones = {
  neutral: 'border-slate-600 bg-slate-800 text-slate-200',
  success: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200',
  warning: 'border-amber-500/40 bg-amber-500/10 text-amber-200',
};

// Badge labels compact statuses without forcing a specific domain meaning.
export function Badge({ children, className, tone = 'neutral' }) {
  return (
    <span
      className={classNames(
        'inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
