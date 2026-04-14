import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import NavShell from '@/components/NavShell';

export default async function DashboardLayout({ children }: { children?: React.ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  // Two-step query avoids PostgREST join ambiguity under strict RLS
  const { data: profile } = await supabase
    .from('users')
    .select('first_name, last_name, role, organization_id')
    .eq('id', user.id)
    .maybeSingle();

  let orgName = 'VolleyTrainer';
  if (profile?.organization_id) {
    const { data: org } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', profile.organization_id)
      .maybeSingle();
    if (org?.name) orgName = org.name;
  }

  const initials = profile
    ? `${profile.first_name?.[0] ?? ''}${profile.last_name?.[0] ?? ''}`.toUpperCase() || 'C'
    : user.email?.[0]?.toUpperCase() ?? 'C';
  const displayName = profile
    ? `${profile.first_name ?? ''} ${profile.last_name ?? ''}`.trim() || user.email
    : user.email ?? 'Coach';

  return (
    <NavShell
      orgName={orgName}
      displayName={displayName ?? 'Coach'}
      initials={initials}
      role={profile?.role ?? 'coach'}
    >
      {children}
    </NavShell>
  );
}
