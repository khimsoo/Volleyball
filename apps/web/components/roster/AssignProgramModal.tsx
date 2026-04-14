'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface Program {
  id: string;
  name: string;
  phase: string;
  duration_weeks: number;
  sessions_per_week: number;
}

interface Props {
  athleteId: string;
  organizationId: string;
  onClose: () => void;
  onSaved: () => void;
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ');
}

export default function AssignProgramModal({ athleteId, organizationId, onClose, onSaved }: Props) {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [selectedProgramId, setSelectedProgramId] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    async function fetchPrograms() {
      const { data } = await supabase
        .from('training_programs')
        .select('id, name, phase, duration_weeks, sessions_per_week')
        .eq('organization_id', organizationId)
        .is('deleted_at', null)
        .order('name');
      setPrograms(data ?? []);
      if (data?.length) setSelectedProgramId(data[0].id);
      setLoading(false);
    }
    fetchPrograms();
  }, [organizationId]);

  // Auto-calculate end date when program or start date changes
  useEffect(() => {
    const prog = programs.find((p) => p.id === selectedProgramId);
    if (prog && startDate) {
      const end = new Date(startDate);
      end.setDate(end.getDate() + prog.duration_weeks * 7);
      setEndDate(end.toISOString().split('T')[0]);
    }
  }, [selectedProgramId, startDate, programs]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedProgramId) { setError('Please select a program.'); return; }
    setSaving(true);
    setError('');

    const { data: { user } } = await supabase.auth.getUser();

    const { error: err } = await supabase.from('athlete_program_assignments').insert({
      athlete_id: athleteId,
      program_id: selectedProgramId,
      assigned_by: user?.id,
      start_date: startDate,
      end_date: endDate || null,
      status: 'active',
    });

    setSaving(false);
    if (err) {
      setError(err.message);
    } else {
      onSaved();
      onClose();
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-slate-900 rounded-t-2xl sm:rounded-2xl w-full max-w-md border border-slate-700 shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <h2 className="text-lg font-bold text-white">Assign Program</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl leading-none">×</button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg p-3">
              {error}
            </div>
          )}

          {loading ? (
            <div className="h-20 bg-slate-800 animate-pulse rounded-lg" />
          ) : programs.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-slate-400 text-sm">No programs available.</p>
              <p className="text-slate-500 text-xs mt-1">Create a training program first under Programs.</p>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Program *</label>
                <select
                  className="input w-full"
                  value={selectedProgramId}
                  onChange={(e) => setSelectedProgramId(e.target.value)}
                  required
                >
                  {programs.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — {capitalize(p.phase)} ({p.duration_weeks}w · {p.sessions_per_week}×/wk)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Start Date *</label>
                  <input
                    type="date"
                    className="input w-full"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">End Date</label>
                  <input
                    type="date"
                    className="input w-full"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                  <p className="text-xs text-slate-600 mt-0.5">Auto-set from program duration</p>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1">
                  {saving ? 'Assigning…' : 'Assign Program'}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
