import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const links = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/products', label: 'Products', end: false },
  { to: '/admin/categories', label: 'Categories', end: false },
  { to: '/admin/settings', label: 'Settings', end: false },
];

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `block rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${
    isActive ? 'bg-brand text-white' : 'text-neutral-700 hover:bg-neutral-100'
  }`;

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { session, logout } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = () => {
    logout();
    onNavigate?.();
    navigate('/admin/login', { replace: true });
  };

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-neutral-200 px-4 py-4">
        <img
          src="/images/grubbix-logo.jpeg"
          alt="Grubbix Warehouse"
          width={576}
          height={480}
          className="h-11 w-auto"
        />
        <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
          Admin portal
        </p>
      </div>

      <nav aria-label="Admin navigation" className="flex-1 space-y-1 p-3">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={linkClass}
            onClick={onNavigate}
          >
            {link.label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-neutral-200 p-3">
        <p className="truncate px-3 text-xs text-neutral-500">{session?.admin.email}</p>
        <button
          type="button"
          onClick={handleSignOut}
          className="mt-2 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
        >
          Sign out
        </button>
        <NavLink
          to="/"
          className="mt-2 block rounded-lg px-3 py-2 text-center text-xs font-medium text-neutral-500 hover:text-brand"
        >
          View website
        </NavLink>
      </div>
    </div>
  );
}

export default function AdminLayout() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-neutral-50 text-ink">
      <aside className="hidden w-64 shrink-0 border-r border-neutral-200 bg-white lg:block">
        <div className="sticky top-0 h-screen">
          <SidebarContent />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-4 border-b border-neutral-200 bg-white px-4 py-3 lg:hidden">
          <img
            src="/images/grubbix-logo.jpeg"
            alt="Grubbix Warehouse"
            width={576}
            height={480}
            className="h-9 w-auto"
          />
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Open admin menu"
            className="rounded-lg border border-neutral-300 px-3 py-2 text-sm font-semibold text-neutral-700"
          >
            Menu
          </button>
        </header>

        {menuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setMenuOpen(false)}
              className="absolute inset-0 bg-black/40"
            />
            <div className="relative h-full w-72 max-w-[85%] bg-white shadow-xl">
              <SidebarContent onNavigate={() => setMenuOpen(false)} />
            </div>
          </div>
        )}

        <main className="flex-1 px-4 py-8 sm:px-6 lg:px-10">
          <div className="mx-auto max-w-6xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
