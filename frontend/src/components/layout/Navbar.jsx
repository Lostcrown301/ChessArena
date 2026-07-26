import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { env } from '@config/env';
import { EXTERNAL_LINKS, NAVIGATION_LINKS } from '@constants/navigation';
import { Button } from '@components/ui/Button';
import { classNames } from '@utils/classNames';

// Navbar owns only navigation presentation. Route definitions stay in the router.
export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="border-b border-slate-800 bg-slate-950/90 backdrop-blur">
      <nav
        aria-label="Primary navigation"
        className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8"
      >
        <NavLink
          className="text-lg font-bold text-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
          to="/"
        >
          {env.appName}
        </NavLink>

        <div className="hidden items-center gap-2 md:flex">
          {NAVIGATION_LINKS.map((link) => (
            <NavigationItem key={link.path} {...link} />
          ))}
          <a
            className="rounded-md px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
            href={EXTERNAL_LINKS.github}
          >
            GitHub
          </a>
        </div>

        <Button
          aria-controls="mobile-navigation"
          aria-expanded={isMenuOpen}
          aria-label="Toggle navigation menu"
          className="md:hidden"
          onClick={() => setIsMenuOpen((value) => !value)}
          variant="secondary"
        >
          Menu
        </Button>
      </nav>

      {isMenuOpen ? (
        <div className="border-t border-slate-800 px-4 pb-4 md:hidden" id="mobile-navigation">
          <div className="mx-auto grid max-w-6xl gap-2">
            {NAVIGATION_LINKS.map((link) => (
              <NavigationItem key={link.path} onClick={() => setIsMenuOpen(false)} {...link} />
            ))}
            <a
              className="rounded-md px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
              href={EXTERNAL_LINKS.github}
            >
              GitHub
            </a>
          </div>
        </div>
      ) : null}
    </header>
  );
}

function NavigationItem({ label, onClick, path }) {
  return (
    <NavLink
      className={({ isActive }) =>
        classNames(
          'rounded-md px-3 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300',
          isActive ? 'bg-slate-800 text-slate-50' : 'text-slate-300 hover:bg-slate-800',
        )
      }
      onClick={onClick}
      to={path}
    >
      {label}
    </NavLink>
  );
}
