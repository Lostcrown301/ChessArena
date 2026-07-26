import { classNames } from '@utils/classNames';

// PageContainer keeps route-level spacing consistent across desktop and mobile.
export function PageContainer({ children, className }) {
  return (
    <div className={classNames('mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8', className)}>
      {children}
    </div>
  );
}
