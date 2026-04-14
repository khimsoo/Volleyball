'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import AddAthleteModal from '@/components/roster/AddAthleteModal';

interface Athlete {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  primary_position: string;
  jersey_number: number | null;
  experience_tier: string;
  height_cm: number | null;
  weight_kg: number | null;
  date_of_birth: string | null;
}

const POSITION_COLORS: Record<string, string> = {
  setter: 'bg-purple-500/20 text-purple-400',
  libero: 'bg-yellow-500/20 text-yellow-400',
  outside_hitter: 'bg-blue-500/20 text-blue-400',
  opposite: 'bg-orange-500/20 text-orange-400',
  middle_blocker: 'bg-green-500/20 text-green-400',
  defensive_specialist: 'bg-pink-500/20 text-pink-400',
};

const POSITION_LABELS: Record<string, string> = {
  setter: 'Setter',
  libero: 'Libero',
  outside_hitter: 'Outside Hitter',
  opposite: 'Opposite',
  middle_blocker: 'Middle Blocker',
  defensive_specialist: 'DS',
};

const FILTER_TABS = ['All', 'setter', 'libero', 'outside_hitter', 'middle_blocker', 'opposite', 'defensive_specialist'];

function getAge(dob: string | null): string {
  if (!dob) return '—';
  const diff = Date.now() - new Date(dob).getTime();
  return String(Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000)));
}

export default function RosterPage() {
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [loading, setLoading] = useState(true);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState('All');
  const [deleting, setDeleting] = useState<string | null>(null);

  async function loadData() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (!profile) return;
    setOrgId(profile.organization_id);

    const { data } = await supabase
      .from('athlete_profiles')
      .select('id, first_name, last_name, email, primary_position, jersey_number, experience_tier, height_cm, weight_kg, date_of_birth')
      .eq('organization_id', profile.organization_id)
      .is('deleted_at', null)
      .order('last_name', { ascending: true });

    setAthletes(data ?? []);
    setLoading(false);
  }

  useEffect(() => { loadData(); }, []);

  async function deleteAthlete(id: string) {
    if (!confirm('Remove this athlete from the roster?')) return;
    setDeleting(id);
    await supabase
      .from('athlete_profiles')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);
    setDeleting(null);
    loadData();
  }

  const displayed = filter === 'All' ? athletes : athletes.filter((a) => a.primary_position === filter);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-white">Roster</h1>
          <p className="text-slate-400 mt-1">
            {athletes.length} athlete{athletes.length !== 1 ? 's' : ''} on your team
          </p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>+ Add Athlete</button>
      </div>

      {/* Position filter tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {FILTER_TABS.map((pos) => (
          <button
            key={pos}
            onClick={() => setFilter(pos)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === pos
                ? 'bg-brand-500 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            {pos === 'All' ? 'All' : POSITION_LABELS[pos] ?? pos}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card p-5 animate-pulse h-40" />
          ))}
        </div>
      ) : displayed.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-5xl mb-4">🏐</div>
          <h3 className="text-lg font-bold text-white mb-2">
            {filter === 'All' ? 'No athletes yet' : `No ${POSITION_LABELS[filter] ?? filter} yet`}
          </h3>
          <p className="text-slate-400 text-sm max-w-sm mx-auto mb-6">
            Add athletes to your roster to start tracking their performance, training load, and readiness.
          </p>
          <button className="btn-primary" onClick={() => setShowModal(true)}>Add First Athlete</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {displayed.map((athlete) => (
            <div key={athlete.id} className="card p-5 flex flex-col gap-3 group relative">
              <button
                onClick={() => deleteAthlete(athlete.id)}
                disabled={deleting === athlete.id}
                className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 transition-all text-lg leading-none"
                title="Remove athlete"
              >
                ×
              </button>

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-brand-500/20 flex items-center justify-center text-lg font-bold text-brand-400 shrink-0">
                  {athlete.first_name[0]}{athlete.last_name[0]}
                </div>
                <div className="min-w-0">
                  <Link
                    href={`/roster/${athlete.id}`}
                    className="font-bold text-white hover:text-brand-400 transition-colors truncate block"
                  >
                    {athlete.first_name} {athlete.last_name}
                  </Link>
                  {athlete.jersey_number && (
                    <p className="text-xs text-slate-500">#{athlete.jersey_number}</p>
                  )}
                </div>
              </div>

              <span
                className={`self-start text-xs font-semibold px-2.5 py-1 rounded-full ${
                  POSITION_COLORS[athlete.primary_position] ?? 'bg-slate-500/20 text-slate-400'
                }`}
              >
                {POSITION_LABELS[athlete.primary_position] ?? athlete.primary_position}
              </span>

              <div className="flex gap-4 text-xs text-slate-400 border-t border-slate-800 pt-3 mt-auto">
                <span>Age: <span className="text-white">{getAge(athlete.date_of_birth)}</span></span>
                {athlete.height_cm && (
                  <span>{athlete.height_cm} <span className="text-slate-600">cm</span></span>
                )}
                <span className="ml-auto capitalize text-slate-500">{athlete.experience_tier}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && orgId && (
        <AddAthleteModal
          organizationId={orgId}
          onClose={() => setShowModal(false)}
          onSaved={loadData}
        />
      )}
    </div>
  );
}
