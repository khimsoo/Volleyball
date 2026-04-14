'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import AssignProgramModal from '@/components/roster/AssignProgramModal';
import LogSessionModal from '@/components/roster/LogSessionModal';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Athlete {
  id: string;
  first_name: string;
  last_name: string;
  primary_position: string;
  jersey_number: number | null;
  experience_tier: string;
  height_cm: number | null;
  weight_kg: number | null;
  date_of_birth: string | null;
  email: string | null;
}

interface ProgramAssignment {
  id: string;
  program_id: string;
  start_date: string;
  end_date: string | null;
  status: 'active' | 'paused' | 'completed' | 'cancelled';
  training_programs: {
    name: string;
    phase: string;
    duration_weeks: number;
    sessions_per_week: number;
  };
}

interface TrainingSession {
  id: string;
  scheduled_date: string;
  session_type: string;
  session_rpe: number | null;
  completed_at: string | null;
  coach_notes: string | null;
  drill_count: number;
}

// ─── Style maps ───────────────────────────────────────────────────────────────

const POSITION_LABELS: Record<string, string> = {
  setter: 'Setter',
  libero: 'Libero',
  outside_hitter: 'Outside Hitter',
  opposite: 'Opposite',
  middle_blocker: 'Middle Blocker',
  defensive_specialist: 'DS',
};

const POSITION_COLORS: Record<string, string> = {
  setter: 'bg-purple-500/20 text-purple-400',
  libero: 'bg-yellow-500/20 text-yellow-400',
  outside_hitter: 'bg-blue-500/20 text-blue-400',
  opposite: 'bg-orange-500/20 text-orange-400',
  middle_blocker: 'bg-green-500/20 text-green-400',
  defensive_specialist: 'bg-pink-500/20 text-pink-400',
};

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-green-500/20 text-green-400',
  paused: 'bg-yellow-500/20 text-yellow-400',
  completed: 'bg-slate-500/20 text-slate-400',
  cancelled: 'bg-red-500/20 text-red-400',
};

const PHASE_COLORS: Record<string, string> = {
  hypertrophy: 'text-purple-400',
  strength: 'text-blue-400',
  power: 'text-orange-400',
  peaking: 'text-red-400',
  competition_maintenance: 'text-green-400',
  deload: 'text-slate-400',
  general: 'text-sky-400',
};

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ');
}

function getAge(dob: string | null): string {
  if (!dob) return '—';
  return String(Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000)));
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AthleteProfilePage() {
  const params = useParams();
  const id = params.id as string;

  const [athlete, setAthlete] = useState<Athlete | null>(null);
  const [assignments, setAssignments] = useState<ProgramAssignment[]>([]);
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [logTarget, setLogTarget] = useState<{
    assignmentId: string;
    programId: string;
    programName: string;
  } | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  async function loadData() {
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data: profile } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();
    if (profile) setOrgId(profile.organization_id);

    // Athlete profile
    const { data: athleteData } = await supabase
      .from('athlete_profiles')
      .select('id, first_name, last_name, primary_position, jersey_number, experience_tier, height_cm, weight_kg, date_of_birth, email')
      .eq('id', id)
      .maybeSingle();
    setAthlete(athleteData ?? null);

    // Program assignments with program details
    const { data: assignData } = await supabase
      .from('athlete_program_assignments')
      .select(`
        id, program_id, start_date, end_date, status,
        training_programs(name, phase, duration_weeks, sessions_per_week)
      `)
      .eq('athlete_id', id)
      .order('created_at', { ascending: false });
    setAssignments((assignData ?? []) as unknown as ProgramAssignment[]);

    // Recent training sessions
    const { data: sessionData } = await supabase
      .from('training_sessions')
      .select('id, scheduled_date, session_type, session_rpe, completed_at, coach_notes')
      .eq('athlete_id', id)
      .order('scheduled_date', { ascending: false })
      .limit(20);

    if (sessionData && sessionData.length > 0) {
      // Drill log counts per session
      const { data: drillCountRows } = await supabase
        .from('session_drill_logs')
        .select('training_session_id')
        .in('training_session_id', sessionData.map((s) => s.id));

      const countMap: Record<string, number> = {};
      (drillCountRows ?? []).forEach((row) => {
        countMap[row.training_session_id] = (countMap[row.training_session_id] ?? 0) + 1;
      });

      setSessions(sessionData.map((s) => ({ ...s, drill_count: countMap[s.id] ?? 0 })));
    } else {
      setSessions([]);
    }

    setLoading(false);
  }

  useEffect(() => { loadData(); }, [id]);

  async function updateAssignmentStatus(assignmentId: string, status: string) {
    setUpdatingStatus(assignmentId);
    await supabase
      .from('athlete_program_assignments')
      .update({ status })
      .eq('id', assignmentId);
    setUpdatingStatus(null);
    loadData();
  }

  // ─── Loading skeleton ──────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="p-4 sm:p-8 space-y-6 animate-pulse">
        <div className="h-4 bg-slate-800 rounded w-28" />
        <div className="flex gap-4">
          <div className="w-16 h-16 bg-slate-800 rounded-full shrink-0" />
          <div className="flex-1 space-y-2 pt-1">
            <div className="h-6 bg-slate-800 rounded w-48" />
            <div className="h-4 bg-slate-800 rounded w-32" />
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-20 bg-slate-800 rounded-xl" />)}
        </div>
        <div className="h-40 bg-slate-800 rounded-xl" />
      </div>
    );
  }

  if (!athlete) {
    return (
      <div className="p-4 sm:p-8">
        <Link href="/roster" className="text-sm text-slate-400 hover:text-white mb-6 inline-flex items-center gap-1">
          ← Back to Roster
        </Link>
        <div className="card p-12 text-center mt-6">
          <p className="text-slate-400">Athlete not found.</p>
        </div>
      </div>
    );
  }

  // ─── Derived stats ─────────────────────────────────────────────────────────

  const sessions30d = sessions.filter(
    (s) => new Date(s.scheduled_date) >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
  ).length;
  const totalDrillsLogged = sessions.reduce((n, s) => n + s.drill_count, 0);
  const activeAssignments = assignments.filter((a) => a.status === 'active');

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="p-4 sm:p-8">
      {/* Back nav */}
      <Link
        href="/roster"
        className="text-sm text-slate-400 hover:text-white mb-6 inline-flex items-center gap-1"
      >
        ← Back to Roster
      </Link>

      {/* ── Athlete Header ──────────────────────────────────────────────── */}
      <div className="flex items-start gap-4 sm:gap-6 mt-4 mb-6 sm:mb-8">
        <div className="w-14 h-14 sm:w-20 sm:h-20 bg-brand-500/20 rounded-full flex items-center justify-center text-xl sm:text-3xl font-black text-brand-400 shrink-0">
          {athlete.first_name[0]}{athlete.last_name[0]}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            {athlete.first_name} {athlete.last_name}
          </h1>
          <div className="flex flex-wrap items-center gap-2 mt-1.5">
            <span
              className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                POSITION_COLORS[athlete.primary_position] ?? 'bg-slate-700 text-slate-300'
              }`}
            >
              {POSITION_LABELS[athlete.primary_position] ?? capitalize(athlete.primary_position)}
            </span>
            {athlete.jersey_number && (
              <span className="text-slate-400 text-sm">#{athlete.jersey_number}</span>
            )}
            <span className="text-xs bg-slate-800 text-slate-400 px-2.5 py-1 rounded-full capitalize">
              {athlete.experience_tier}
            </span>
          </div>
          <div className="flex flex-wrap gap-4 mt-1.5 text-xs text-slate-500">
            {athlete.date_of_birth && <span>Age {getAge(athlete.date_of_birth)}</span>}
            {athlete.height_cm && <span>{athlete.height_cm} cm</span>}
            {athlete.weight_kg && <span>{athlete.weight_kg} kg</span>}
            {athlete.email && <span className="truncate">{athlete.email}</span>}
          </div>
        </div>
      </div>

      {/* ── Quick Stats ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-8">
        <StatCard label="Active Programs" value={String(activeAssignments.length)} />
        <StatCard label="Sessions (30d)" value={String(sessions30d)} />
        <StatCard label="Total Sessions" value={String(sessions.length)} />
        <StatCard label="Drills Logged" value={String(totalDrillsLogged)} />
      </div>

      {/* ── Programs ────────────────────────────────────────────────────── */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4 gap-3">
          <h2 className="text-lg font-bold text-white">Training Programs</h2>
          <button className="btn-primary text-sm shrink-0" onClick={() => setShowAssignModal(true)}>
            + Assign Program
          </button>
        </div>

        {assignments.length === 0 ? (
          <div className="card p-10 text-center">
            <div className="text-4xl mb-3">📋</div>
            <h3 className="text-base font-bold text-white mb-2">No programs assigned</h3>
            <p className="text-slate-400 text-sm mb-5 max-w-sm mx-auto">
              Assign a training program to start tracking sessions and drill progress for this athlete.
            </p>
            <button className="btn-primary" onClick={() => setShowAssignModal(true)}>
              Assign First Program
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {assignments.map((a) => {
              const prog = a.training_programs;
              return (
                <div key={a.id} className="card p-4 sm:p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                    {/* Program info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="font-bold text-white">{prog.name}</h3>
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLES[a.status]}`}
                        >
                          {capitalize(a.status)}
                        </span>
                      </div>
                      <p className={`text-xs font-medium ${PHASE_COLORS[prog.phase] ?? 'text-slate-400'}`}>
                        {capitalize(prog.phase)} · {prog.duration_weeks}w · {prog.sessions_per_week}×/week
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Started{' '}
                        {new Date(a.start_date).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                        {a.end_date &&
                          ` · Ends ${new Date(a.end_date).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}`}
                      </p>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <select
                        value={a.status}
                        disabled={updatingStatus === a.id}
                        onChange={(e) => updateAssignmentStatus(a.id, e.target.value)}
                        className="text-xs bg-slate-800 border border-slate-700 text-slate-300 rounded-lg px-2 py-1.5 focus:outline-none focus:border-brand-500 disabled:opacity-50"
                      >
                        <option value="active">Active</option>
                        <option value="paused">Paused</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                      {a.status === 'active' && (
                        <button
                          className="btn-primary text-xs px-3 py-1.5"
                          onClick={() =>
                            setLogTarget({
                              assignmentId: a.id,
                              programId: a.program_id,
                              programName: prog.name,
                            })
                          }
                        >
                          + Log Session
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Session History ──────────────────────────────────────────────── */}
      <section>
        <h2 className="text-lg font-bold text-white mb-4">Session History</h2>

        {sessions.length === 0 ? (
          <div className="card p-8 text-center text-slate-500 text-sm">
            No sessions logged yet. Assign an active program above and click "+ Log Session" to start.
          </div>
        ) : (
          <div className="space-y-2">
            {sessions.map((s) => {
              const date = new Date(s.scheduled_date);
              return (
                <div key={s.id} className="card p-4 flex items-center gap-3 sm:gap-4">
                  {/* Date */}
                  <div className="w-12 sm:w-16 shrink-0 text-center">
                    <p className="text-xs font-semibold text-slate-300">
                      {date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                    </p>
                    <p className="text-xs text-slate-600">{date.getFullYear()}</p>
                  </div>

                  {/* Completion dot */}
                  <div
                    className={`w-2 h-8 rounded-full shrink-0 ${
                      s.completed_at ? 'bg-green-500' : 'bg-slate-700'
                    }`}
                  />

                  {/* Session details */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white capitalize">
                      {s.session_type.replace(/_/g, ' ')} Session
                    </p>
                    <p className="text-xs text-slate-400">
                      {s.drill_count > 0
                        ? `${s.drill_count} drill${s.drill_count !== 1 ? 's' : ''} logged`
                        : 'No drills logged'}
                      {s.session_rpe != null && ` · RPE ${s.session_rpe}/10`}
                      {s.completed_at && ' · Completed'}
                    </p>
                    {s.coach_notes && (
                      <p className="text-xs text-slate-500 mt-0.5 truncate">{s.coach_notes}</p>
                    )}
                  </div>

                  {/* RPE badge */}
                  {s.session_rpe != null && (
                    <div
                      className={`shrink-0 text-xs font-bold px-2 py-1 rounded-lg ${
                        s.session_rpe >= 8
                          ? 'bg-red-500/20 text-red-400'
                          : s.session_rpe >= 6
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : 'bg-green-500/20 text-green-400'
                      }`}
                    >
                      RPE {s.session_rpe}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Modals ──────────────────────────────────────────────────────── */}
      {showAssignModal && orgId && (
        <AssignProgramModal
          athleteId={id}
          organizationId={orgId}
          onClose={() => setShowAssignModal(false)}
          onSaved={loadData}
        />
      )}

      {logTarget && orgId && (
        <LogSessionModal
          athleteId={id}
          organizationId={orgId}
          programId={logTarget.programId}
          programName={logTarget.programName}
          onClose={() => setLogTarget(null)}
          onSaved={loadData}
        />
      )}
    </div>
  );
}

// ─── StatCard ─────────────────────────────────────────────────────────────────

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-4 sm:p-5">
      <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">{label}</p>
      <p className="text-2xl font-black text-white">{value}</p>
    </div>
  );
}
