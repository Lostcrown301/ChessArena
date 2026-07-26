import { classNames } from '@utils/classNames';

// Section standardizes semantic page regions and heading hierarchy.
export function Section({ children, className, eyebrow, title }) {
  return (
    <section className={classNames('py-6', className)}>
      {eyebrow ? (
        <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-emerald-300">
          {eyebrow}
        </p>
      ) : null}
      {title ? <h2 className="mb-4 text-2xl font-semibold text-slate-50">{title}</h2> : null}
      {children}
    </section>
  );
}
