import Link from 'next/link';
import { type ReactNode } from 'react';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: '⚡' },
  { href: '/roster', label: 'Roster', icon: '👥' },
  { href: '/programs', label: 'Programs', icon: '📋' },
  { href: '/drills', label: 'Drill Library', icon: '🏐' },
  { href: '/matches', label: 'Matches', icon: '🏆' },
  { href: '/analytics', label: 'Analytics', icon: '📊' },
  { href: '/planning', label: 'Planning', icon: '📅' },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-56 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0">
        {/* Logo */}
        <div className="p-5 border-b border-slate-800">
          <span className="text-xl font-black text-white tracking-tight">
            🏐 VolleyTrainer
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400
                         hover:text-white hover:bg-slate-800 transition-colors text-sm font-medium"
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-brand-500 rounded-full flex items-center justify-center text-xs font-bold">
              C
            </div>
            <div>
              <p className="text-xs font-semibold text-white">Coach</p>
              <p className="text-xs text-slate-500">Head Coach</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
