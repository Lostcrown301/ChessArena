import { Outlet } from 'react-router-dom';
import { Footer } from '@components/layout/Footer';
import { Navbar } from '@components/layout/Navbar';

// MainLayout wraps public routes with navigation, footer, and responsive spacing.
export function MainLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
      <Navbar />
      <main className="flex flex-1 flex-col min-h-0">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
