import { classNames } from '@utils/classNames';

// Card frames repeated content and forwards semantic/test attributes to its chosen element.
export function Card({ children, className, as: Component = 'article', ...props }) {
  return (
    <Component
      className={classNames(
        'rounded-lg border border-slate-800 bg-slate-900/80 p-5 shadow-sm shadow-black/20',
        className,
      )}
      {...props}
    >
      {children}
    </Component>
  );
}
