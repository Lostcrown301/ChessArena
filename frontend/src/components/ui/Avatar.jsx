import { classNames } from '@utils/classNames';

// Avatar renders initials now and can later accept profile images without changing consumers.
export function Avatar({ label = 'Player', className }) {
  const initials = label
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  return (
    <span
      aria-label={label}
      className={classNames(
        'inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 text-sm font-bold text-emerald-200 ring-1 ring-slate-700',
        className,
      )}
      role="img"
    >
      {initials || 'CA'}
    </span>
  );
}
