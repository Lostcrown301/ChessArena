import { env } from '@config/env';

// Footer keeps product metadata in one place for every route.
export function Footer() {
  return (
    <footer className="border-t border-slate-800 bg-slate-950">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <p>{env.appName}</p>
        <p>Copyright {new Date().getFullYear()}</p>
        <p>Version 0.1.0</p>
      </div>
    </footer>
  );
}
