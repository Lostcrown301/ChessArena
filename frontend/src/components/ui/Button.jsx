import { classNames } from '@utils/classNames';

const variants = {
  primary: 'bg-emerald-500 text-emerald-950 hover:bg-emerald-400 focus-visible:ring-emerald-300',
  secondary:
    'border border-slate-600 bg-slate-900 text-slate-100 hover:bg-slate-800 focus-visible:ring-slate-400',
  ghost: 'text-slate-200 hover:bg-slate-800 focus-visible:ring-slate-400',
};

// Button centralizes interactive styling so future feature controls stay consistent.
export function Button({
  as: Component = 'button',
  children,
  className,
  type = 'button',
  variant = 'primary',
  ...props
}) {
  const componentProps = Component === 'button' ? { type } : {};

  return (
    <Component
      className={classNames(
        'inline-flex min-h-10 items-center justify-center rounded-md px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:cursor-not-allowed disabled:opacity-60',
        variants[variant] ?? variants.primary,
        className,
      )}
      {...componentProps}
      {...props}
    >
      {children}
    </Component>
  );
}
