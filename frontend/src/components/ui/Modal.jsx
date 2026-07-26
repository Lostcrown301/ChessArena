import { useId } from 'react';
import { Button } from './Button';

// Modal is a controlled presentational shell. It does not own feature state.
export function Modal({ children, description, isOpen, onClose, title }) {
  const titleId = useId();
  const descriptionId = useId();

  if (!isOpen) {
    return null;
  }

  return (
    <div
      aria-describedby={description ? descriptionId : undefined}
      aria-labelledby={titleId}
      aria-modal="true"
      className="fixed inset-0 z-50 grid place-items-center bg-slate-950/75 px-4"
      role="dialog"
    >
      <div className="w-full max-w-lg rounded-lg border border-slate-700 bg-slate-900 p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-50" id={titleId}>
              {title}
            </h2>
            {description ? (
              <p className="mt-1 text-sm text-slate-400" id={descriptionId}>
                {description}
              </p>
            ) : null}
          </div>
          <Button aria-label="Close dialog" onClick={onClose} variant="ghost">
            Close
          </Button>
        </div>
        <div className="mt-5">{children}</div>
      </div>
    </div>
  );
}
