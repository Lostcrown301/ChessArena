import { forwardRef } from 'react';
import { classNames } from '@utils/classNames';

// Input provides accessible defaults for forms that later milestones will add.
export const Input = forwardRef(function Input({ className, id, label, ...props }, ref) {
  return (
    <label className="grid gap-2 text-sm font-medium text-slate-200" htmlFor={id}>
      {label ? <span>{label}</span> : null}
      <input
        className={classNames(
          'min-h-10 rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/30',
          className,
        )}
        id={id}
        ref={ref}
        {...props}
      />
    </label>
  );
});
