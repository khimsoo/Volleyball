'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import LogoutButton from '@/components/LogoutButton';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: '⚡' },
  { href: '/roster', label: 'Roster', icon: '👥' },
  { href: '/programs', label: 'Programs', icon: '📋' },
  { href: '/drills', label: 'Drill Library', icon: '🏐' },
  { href: '/matches', label: 'Matches', icon: '🏆' },
  { href: '/analytics', label: 'Analytics', icon: '📊' },
  { href: '/planning', label: 'Planning', icon: '📅' },
];

interface Props {
  orgName: string;
  displayName: string;
  initials: string;
  role: string;
  children: React.ReactNode;
}

export default function NavShell({ orgName, displayName, initials, role, children }: Props) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const sidebarContent = (
    <>
      {/* Brand */}
      <div className="p-5 border-b border-slate-800">
        <span className="text-xl font-black text-white tracking-tight">🏐 VolleyTrainer</span>
        <p className="text-xs text-slate-500 mt-0.5 truncate">{orgName}</p>
      </div>

      {/* Nav links */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-brand-500/20 text-brand-400'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <span className="text-base shrink-0">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-brand-500 rounded-full flex items-center justify-center text-xs font-bold shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">{displayName}</p>
            <p className="text-xs text-slate-500 capitalize">{role}</p>
          </div>
          <LogoutButton />
        </div>
      </div>
    </>
  );

  return (
    <div className="flex h-dvh overflow-hidden">
      {/* ── Desktop sidebar ──────────────────────────────── */}
      <aside className="hidden lg:flex lg:w-56 lg:shrink-0 flex-col bg-slate-900 border-r border-slate-800">
        {sidebarContent}
      </aside>

      {/* ── Mobile drawer overlay ─────────────────────────── */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* ── Mobile drawer ─────────────────────────────────── */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col w-72 bg-slate-900 border-r border-slate-800
                    transform transition-transform duration-250 ease-in-out lg:hidden
                    ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Close button */}
        <button
          onClick={() => setOpen(false)}
          className="absolute top-4 right-4 text-slate-400 hover:text-white text-2xl leading-none"
        >
          ×
        </button>
        {sidebarContent}
      </aside>

      {/* ── Main area ─────────────────────────────────────── */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Mobile top bar */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-slate-900 border-b border-slate-800 shrink-0">
          <button
            onClick={() => setOpen(true)}
            className="text-slate-400 hover:text-white p-1 -ml-1"
            aria-label="Open menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="text-base font-black text-white tracking-tight">🏐 VolleyTrainer</span>
        </header>

        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
