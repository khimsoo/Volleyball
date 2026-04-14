'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import AthleteModal from '@/components/roster/AthleteModal';

interface Athlete {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  primary_position: string;
  jersey_number: number | null;
  height_cm: number | null;
  weight_kg: number | null;
  experience_tier: string;
}

// Position color mapping
const POSITION_COLORS: Record<string, string> = {
  setter: 'bg-purple-500/20 text-purple-400',
  libero: 'bg-yellow-500/20 text-yellow-400',
  outside_hitter: 'bg-blue-500/20 text-blue-400',
  opposite: 'bg-orange-500/20 text-orange-400',
  middle_blocker: 'bg-green-500/20 text-green-400',
  defensive_specialist: 'bg-pink-500/20 text-pink-400',
};

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ');
}

export default function RosterPage() {
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('All');

  async function loadData() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (profile) {
      setOrganizationId(profile.organization_id);
      const { data } = await supabase
        .from('athlete_profiles')
        .select(`
          id,
          user_id,
          primary_position,
          jersey_number,
          height_cm,
          weight_kg,
          experience_tier,
          users:user_id(first_name, last_name, email)
        `)
        .eq('organization_id', profile.organization_id)
        .is('deleted_at', null)
        .order('jersey_number', { nullsFirst: false });

      if (data) {
        const formatted = data.map((row: any) => ({
          id: row.id,
          user_id: row.user_id,
          first_name: row.users?.first_name || '',
          last_name: row.users?.last_name || '',
          email: row.users?.email || '',
          primary_position: row.primary_position,
          jersey_number: row.jersey_number,
          height_cm: row.height_cm,
          weight_kg: row.weight_kg,
          experience_tier: row.experience_tier,
        }));
        setAthletes(formatted);
      }
    }
    setLoading(false);
  }

  useEffect(() => { loadData(); }, []);

  const filteredAthletes = filter === 'All'
    ? athletes
    : athletes.filter((a) => a.primary_position === filter.toLowerCase().replace(/ /g, '_'));

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-white">Roster</h1>
          <p className="text-slate-400 mt-1">Manage your team athletes and profiles</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary"
        >
          + Add Athlete
        </button>
      </div>

      {/* Position filter tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {['All', 'Setter', 'Libero', 'Outside Hitter', 'Middle Blocker', 'Opposite', 'DS'].map(
          (pos) => (
            <button
              key={pos}
              onClick={() => setFilter(pos)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium flex-shrink-0 transition-colors
                         ${filter === pos
                  ? 'bg-brand-500 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
            >
              {pos}
            </button>
          ),
        )}
      </div>

      {/* Athlete list */}
      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="card p-5 h-20 animate-pulse bg-slate-800" />
          ))}
        </div>
      ) : filteredAthletes.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-5xl mb-4">🏐</div>
          <h3 className="text-lg font-bold text-white mb-2">No athletes yet</h3>
          <p className="text-slate-400 text-sm max-w-sm mx-auto mb-6">
            Add athletes to your roster to start tracking their performance, training load, and
            readiness.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary"
          >
            Add First Athlete
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAthletes.map((athlete) => (
            <div key={athlete.id} className="card p-5 flex items-center gap-5 hover:bg-slate-800/50 transition-colors">
              <div className={`text-sm font-bold px-3 py-1.5 rounded-full shrink-0 ${POSITION_COLORS[athlete.primary_position] ?? 'bg-slate-700 text-slate-300'}`}>
                {athlete.jersey_number ?? '—'}
              </div>
              <div className="flex-1 min-w-0">
                <Link
                  href={`/roster/${athlete.id}`}
                  className="font-semibold text-white hover:text-brand-500 transition-colors"
                >
                  {athlete.first_name} {athlete.last_name}
                </Link>
                <p className="text-xs text-slate-400 mt-0.5">
                  {capitalize(athlete.primary_position)} · {athlete.email}
                  {athlete.height_cm && ` · ${athlete.height_cm} cm`}
                  {athlete.weight_kg && ` · ${athlete.weight_kg} kg`}
                </p>
              </div>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                athlete.experience_tier === 'professional' ? 'bg-purple-500/20 text-purple-400'
                  : athlete.experience_tier === 'national' ? 'bg-blue-500/20 text-blue-400'
                    : athlete.experience_tier === 'collegiate' ? 'bg-green-500/20 text-green-400'
                      : 'bg-slate-700 text-slate-400'
              }`}>
                {capitalize(athlete.experience_tier)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Position legend */}
      <div className="mt-8 flex flex-wrap gap-3">
        {Object.entries(POSITION_COLORS).map(([pos, cls]) => (
          <span key={pos} className={`text-xs font-semibold px-3 py-1 rounded-full ${cls}`}>
            {pos.replace(/_/g, ' ')}
          </span>
        ))}
      </div>

      {/* Add Athlete Modal */}
      {showModal && organizationId && (
        <AthleteModal
          athlete={null}
          organizationId={organizationId}
          onClose={() => setShowModal(false)}
          onSaved={loadData}
        />
      )}
    </div>
  );
}

