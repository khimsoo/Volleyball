'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import AddMatchModal from '@/components/matches/AddMatchModal';

interface Match {
  id: string;
  match_date: string;
  opponent: string;
  competition_name: string;
  competition_level: string;
  venue: string | null;
  home_away: string;
  sets_won: number;
  sets_lost: number;
  result: 'win' | 'loss' | 'draw' | null;
  notes: string | null;
}

const LEVEL_LABELS: Record<string, string> = {
  practice: 'Practice',
  scrimmage: 'Scrimmage',
  league: 'League',
  cup: 'Cup',
  national: 'National',
  international: 'International',
};

const RESULT_STYLES: Record<string, string> = {
  win: 'bg-green-500/20 text-green-400',
  loss: 'bg-red-500/20 text-red-400',
  draw: 'bg-slate-500/20 text-slate-400',
};

export default function MatchesPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

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
      .from('matches')
      .select('*')
      .eq('organization_id', profile.organization_id)
      .order('match_date', { ascending: false });

    setMatches(data ?? []);
    setLoading(false);
  }

  useEffect(() => { loadData(); }, []);

  async function deleteMatch(id: string) {
    if (!confirm('Delete this match record?')) return;
    await supabase.from('matches').delete().eq('id', id);
    loadData();
  }

  const wins = matches.filter((m) => m.result === 'win').length;
  const losses = matches.filter((m) => m.result === 'loss').length;
  const totalSetsWon = matches.reduce((s, m) => s + m.sets_won, 0);
  const totalSetsPlayed = matches.reduce((s, m) => s + m.sets_won + m.sets_lost, 0);
  const setsPct = totalSetsPlayed > 0 ? `${Math.round((totalSetsWon / totalSetsPlayed) * 100)}%` : '—';

  return (
    <div className="p-4 sm:p-8">
      <div className="flex items-center justify-between mb-6 sm:mb-8 gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">Match Analytics</h1>
          <p className="text-slate-400 mt-1 text-sm sm:text-base">Track match results and player statistics</p>
        </div>
        <button className="btn-primary shrink-0" onClick={() => setShowModal(true)}>+ Log Match</button>
      </div>

      {/* Season summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-6 sm:mb-8">
        {[
          { label: 'Matches Played', value: matches.length || '—' },
          { label: 'Wins', value: matches.length ? wins : '—', color: 'text-green-400' },
          { label: 'Losses', value: matches.length ? losses : '—', color: 'text-red-400' },
          { label: 'Sets Won %', value: setsPct },
          {
            label: 'Win Rate',
            value: matches.length ? `${Math.round((wins / matches.length) * 100)}%` : '—',
            color: matches.length && wins / matches.length >= 0.5 ? 'text-green-400' : 'text-white',
          },
        ].map((stat) => (
          <div key={stat.label} className="card p-4">
            <p className="text-xs text-slate-400 mb-1">{stat.label}</p>
            <p className={`text-2xl font-black ${stat.color ?? 'text-white'}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card p-5 h-20 animate-pulse" />
          ))}
        </div>
      ) : matches.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-5xl mb-4">🏆</div>
          <h3 className="text-lg font-bold text-white mb-2">No matches logged</h3>
          <p className="text-slate-400 text-sm max-w-sm mx-auto mb-6">
            Log your first match to start tracking results, sets scores, and season performance.
          </p>
          <button className="btn-primary" onClick={() => setShowModal(true)}>Log First Match</button>
        </div>
      ) : (
        <div className="space-y-3">
          {matches.map((match) => (
            <div key={match.id} className="card p-4 sm:p-5 flex items-center gap-3 sm:gap-4 group">
              {/* Date */}
              <div className="w-14 sm:w-20 shrink-0 text-center">
                <p className="text-xs text-slate-500">
                  {new Date(match.match_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                </p>
                <p className="text-xs text-slate-600 hidden sm:block">
                  {new Date(match.match_date).getFullYear()}
                </p>
              </div>

              {/* Result badge */}
              {match.result ? (
                <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-bold shrink-0 ${RESULT_STYLES[match.result]}`}>
                  {match.result.toUpperCase()}
                </span>
              ) : (
                <span className="px-2 sm:px-3 py-1 rounded-full text-xs font-bold shrink-0 bg-slate-700 text-slate-400">
                  TBD
                </span>
              )}

              {/* Score */}
              <div className="shrink-0 font-black text-white text-lg sm:text-xl w-12 sm:w-16 text-center">
                {match.sets_won}–{match.sets_lost}
              </div>

              {/* Match info */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white truncate text-sm sm:text-base">vs {match.opponent}</p>
                <p className="text-xs text-slate-400 truncate">
                  {match.competition_name} · {LEVEL_LABELS[match.competition_level] ?? match.competition_level}
                  {match.venue ? ` · ${match.venue}` : ''}
                  {' · '}<span className="capitalize">{match.home_away}</span>
                </p>
              </div>

              {/* Delete */}
              <button
                onClick={() => deleteMatch(match.id)}
                className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 transition-all text-lg leading-none shrink-0"
                title="Delete match"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Stats explanation */}
      <div className="mt-6 sm:mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Attack Efficiency', formula: '(Kills − Errors − Blocked) ÷ Attempts', target: '> 0.280' },
          { label: 'Reception Efficiency', formula: 'Positive Receptions ÷ Total Receptions', target: '> 65%' },
          { label: 'Side-Out %', formula: 'Points won on reception ÷ Total receptions', target: '> 58%' },
        ].map((s) => (
          <div key={s.label} className="card p-4">
            <p className="text-sm font-bold text-white mb-1">{s.label}</p>
            <p className="text-xs text-slate-400 mb-2 font-mono">{s.formula}</p>
            <p className="text-xs text-green-400">Pro target: {s.target}</p>
          </div>
        ))}
      </div>

      {showModal && orgId && (
        <AddMatchModal
          organizationId={orgId}
          onClose={() => setShowModal(false)}
          onSaved={loadData}
        />
      )}
    </div>
  );
}
