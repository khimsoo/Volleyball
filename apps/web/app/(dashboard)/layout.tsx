import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase';
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

export default async function DashboardLayout({ children }: { children?: React.ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: profile } = await supabase
    .from('users')
    .select('first_name, last_name, role, organizations(name)')
    .eq('id', user.id)
    .single();

  const initials = profile
    ? `${profile.first_name[0]}${profile.last_name[0]}`
    : user.email?.[0]?.toUpperCase() ?? 'C';
  const displayName = profile
    ? `${profile.first_name} ${profile.last_name}`
    : user.email ?? 'Coach';
  const orgName =
    profile?.organizations && !Array.isArray(profile.organizations)
      ? (profile.organizations as { name: string }).name
      : 'My School';

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="w-56 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0">
        <div className="p-5 border-b border-slate-800">
          <span className="text-xl font-black text-white tracking-tight">🏐 VolleyTrainer</span>
          <p className="text-xs text-slate-500 mt-0.5 truncate">{orgName}</p>
        </div>
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
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-brand-500 rounded-full flex items-center justify-center text-xs font-bold shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{displayName}</p>
              <p className="text-xs text-slate-500 capitalize">{profile?.role ?? 'coach'}</p>
            </div>
            <LogoutButton />
          </div>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
