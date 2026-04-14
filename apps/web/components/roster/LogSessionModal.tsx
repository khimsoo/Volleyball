'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface DrillInProgram {
  psd_id: string;
  drill_id: string;
  drill_name: string;
  skill_type: string;
  target_sets: number | null;
  target_reps: number | null;
  target_duration_seconds: number | null;
  sequence_order: number;
}

interface DrillLog {
  drill_id: string;
  drill_name: string;
  skill_type: string;
  completed: boolean;
  sets_completed: string;
  reps_completed: string;
  duration_seconds: string;
  notes: string;
}

interface Props {
  athleteId: string;
  organizationId: string;
  programId: string;
  programName: string;
  onClose: () => void;
  onSaved: () => void;
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ');
}

export default function LogSessionModal({
  athleteId,
  organizationId,
  programId,
  programName,
  onClose,
  onSaved,
}: Props) {
  const [drills, setDrills] = useState<DrillInProgram[]>([]);
  const [drillLogs, setDrillLogs] = useState<DrillLog[]>([]);
  const [loadingDrills, setLoadingDrills] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split('T')[0]);
  const [sessionRpe, setSessionRpe] = useState('');
  const [coachNotes, setCoachNotes] = useState('');

  useEffect(() => {
    async function fetchDrills() {
      setLoadingDrills(true);

      // Get the first week of the program
      const { data: weeks } = await supabase
        .from('program_weeks')
        .select('id')
        .eq('program_id', programId)
        .order('week_number')
        .limit(1);

      if (!weeks?.length) { setLoadingDrills(false); return; }

      // Get sessions in that week
      const { data: sessionsList } = await supabase
        .from('program_sessions')
        .select('id')
        .in('program_week_id', weeks.map((w) => w.id))
        .order('day_of_week');

      if (!sessionsList?.length) { setLoadingDrills(false); return; }

      // Get all drills across all sessions in the first week
      const { data: psd } = await supabase
        .from('program_session_drills')
        .select('id, drill_id, sets, reps, duration_seconds, sequence_order, drills(name, skill_type)')
        .in('program_session_id', sessionsList.map((s) => s.id))
        .order('sequence_order');

      const loaded: DrillInProgram[] = (psd ?? []).map((row) => ({
        psd_id: row.id,
        drill_id: row.drill_id,
        drill_name: (row.drills as any)?.name ?? 'Unknown Drill',
        skill_type: (row.drills as any)?.skill_type ?? '',
        target_sets: row.sets ?? null,
        target_reps: row.reps ?? null,
        target_duration_seconds: row.duration_seconds ?? null,
        sequence_order: row.sequence_order,
      }));

      setDrills(loaded);
      setDrillLogs(
        loaded.map((d) => ({
          drill_id: d.drill_id,
          drill_name: d.drill_name,
          skill_type: d.skill_type,
          completed: false,
          sets_completed: d.target_sets ? String(d.target_sets) : '',
          reps_completed: d.target_reps ? String(d.target_reps) : '',
          duration_seconds: d.target_duration_seconds ? String(d.target_duration_seconds) : '',
          notes: '',
        })),
      );
      setLoadingDrills(false);
    }
    fetchDrills();
  }, [programId]);

  function updateLog(index: number, field: keyof DrillLog, value: string | boolean) {
    setDrillLogs((prev) => prev.map((log, i) => (i === index ? { ...log, [field]: value } : log)));
  }

  function toggleAllCompleted() {
    const allDone = drillLogs.every((l) => l.completed);
    setDrillLogs((prev) => prev.map((l) => ({ ...l, completed: !allDone })));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');

    // Create the training_session row
    const { data: session, error: sessionErr } = await supabase
      .from('training_sessions')
      .insert({
        athlete_id: athleteId,
        organization_id: organizationId,
        scheduled_date: sessionDate,
        session_type: 'technical',
        session_rpe: sessionRpe ? parseInt(sessionRpe) : null,
        coach_notes: coachNotes.trim() || null,
        completed_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (sessionErr || !session) {
      setError(sessionErr?.message ?? 'Failed to create session');
      setSaving(false);
      return;
    }

    // Insert drill logs for any drill that has data
    const logsToInsert = drillLogs
      .filter((log) => log.completed || log.sets_completed || log.reps_completed || log.duration_seconds || log.notes)
      .map((log, i) => ({
        training_session_id: session.id,
        drill_id: log.drill_id,
        sequence_order: i,
        sets_completed: log.sets_completed ? parseInt(log.sets_completed) : null,
        reps_completed: log.reps_completed ? parseInt(log.reps_completed) : null,
        duration_completed_seconds: log.duration_seconds ? parseInt(log.duration_seconds) : null,
        notes: log.notes.trim() || null,
        completed_at: log.completed ? new Date().toISOString() : null,
      }));

    if (logsToInsert.length > 0) {
      const { error: logsErr } = await supabase.from('session_drill_logs').insert(logsToInsert);
      if (logsErr) {
        setError(logsErr.message);
        setSaving(false);
        return;
      }
    }

    setSaving(false);
    onSaved();
    onClose();
  }

  const completedCount = drillLogs.filter((l) => l.completed).length;
  const allDone = drillLogs.length > 0 && completedCount === drillLogs.length;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-slate-900 rounded-t-2xl sm:rounded-2xl w-full max-w-2xl border border-slate-700 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-white">Log Training Session</h2>
            <p className="text-xs text-slate-400 mt-0.5">{programName}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl leading-none">×</button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col max-h-[85dvh]">
          {/* Session meta */}
          <div className="p-5 border-b border-slate-800 space-y-4 shrink-0">
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg p-3">
                {error}
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Session Date *</label>
                <input
                  type="date"
                  className="input w-full"
                  value={sessionDate}
                  onChange={(e) => setSessionDate(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Session RPE (1–10)</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  className="input w-full"
                  value={sessionRpe}
                  onChange={(e) => setSessionRpe(e.target.value)}
                  placeholder="7"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Coach Notes</label>
                <input
                  className="input w-full"
                  value={coachNotes}
                  onChange={(e) => setCoachNotes(e.target.value)}
                  placeholder="Overall session feedback…"
                />
              </div>
            </div>
          </div>

          {/* Drill list — scrollable */}
          <div className="flex-1 overflow-y-auto p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white">
                Drills
                {drills.length > 0 && (
                  <span className="ml-2 text-xs font-normal text-slate-400">
                    {completedCount}/{drills.length} completed
                  </span>
                )}
              </h3>
              {drills.length > 0 && (
                <button
                  type="button"
                  onClick={toggleAllCompleted}
                  className="text-xs text-brand-400 hover:text-brand-300 transition-colors"
                >
                  {allDone ? 'Unmark All' : 'Mark All Done'}
                </button>
              )}
            </div>

            {loadingDrills ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 bg-slate-800 animate-pulse rounded-xl" />
                ))}
              </div>
            ) : drills.length === 0 ? (
              <div className="card p-8 text-center">
                <p className="text-slate-400 text-sm">No drills in this program yet.</p>
                <p className="text-xs text-slate-500 mt-1">
                  Open the program and add drills first, then log sessions.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {drillLogs.map((log, i) => {
                  const drill = drills[i];
                  return (
                    <div
                      key={drill.drill_id}
                      className={`border rounded-xl p-4 transition-colors ${
                        log.completed
                          ? 'border-green-500/30 bg-green-500/5'
                          : 'border-slate-700 bg-slate-800/30'
                      }`}
                    >
                      {/* Drill header row */}
                      <div className="flex items-start gap-3 mb-3">
                        {/* Completion checkbox */}
                        <button
                          type="button"
                          onClick={() => updateLog(i, 'completed', !log.completed)}
                          className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center border shrink-0 transition-colors ${
                            log.completed
                              ? 'bg-green-500 border-green-500 text-white'
                              : 'border-slate-600 hover:border-green-500'
                          }`}
                        >
                          {log.completed && (
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>

                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-semibold ${log.completed ? 'text-green-400' : 'text-white'}`}>
                            {drill.drill_name}
                          </p>
                          <p className="text-xs text-slate-500">{capitalize(drill.skill_type)}</p>
                        </div>

                        {/* Target prescription */}
                        <div className="text-right text-xs text-slate-600 shrink-0">
                          {drill.target_sets && <span>{drill.target_sets}×</span>}
                          {drill.target_reps && <span>{drill.target_reps}</span>}
                          {drill.target_duration_seconds && !drill.target_reps && (
                            <span>{drill.target_duration_seconds}s</span>
                          )}
                        </div>
                      </div>

                      {/* Input row */}
                      <div className="grid grid-cols-3 gap-2 mb-2">
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">Sets done</label>
                          <input
                            type="number"
                            min="0"
                            className="input w-full text-sm py-1.5 px-2"
                            value={log.sets_completed}
                            onChange={(e) => updateLog(i, 'sets_completed', e.target.value)}
                            placeholder={drill.target_sets ? String(drill.target_sets) : '—'}
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">Reps done</label>
                          <input
                            type="number"
                            min="0"
                            className="input w-full text-sm py-1.5 px-2"
                            value={log.reps_completed}
                            onChange={(e) => updateLog(i, 'reps_completed', e.target.value)}
                            placeholder={drill.target_reps ? String(drill.target_reps) : '—'}
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">Duration (s)</label>
                          <input
                            type="number"
                            min="0"
                            className="input w-full text-sm py-1.5 px-2"
                            value={log.duration_seconds}
                            onChange={(e) => updateLog(i, 'duration_seconds', e.target.value)}
                            placeholder={drill.target_duration_seconds ? String(drill.target_duration_seconds) : '—'}
                          />
                        </div>
                      </div>

                      {/* Notes */}
                      <input
                        className="input w-full text-xs py-1.5"
                        value={log.notes}
                        onChange={(e) => updateLog(i, 'notes', e.target.value)}
                        placeholder="Coaching observation for this drill…"
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-5 border-t border-slate-800 flex gap-3 shrink-0">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving
                ? 'Saving…'
                : `Save Session${completedCount > 0 ? ` · ${completedCount} drill${completedCount !== 1 ? 's' : ''} done` : ''}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
