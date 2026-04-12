'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import DrillPicker from './DrillPicker';

interface Program {
  id: string;
  name: string;
  description: string | null;
  phase: string;
  duration_weeks: number;
  sessions_per_week: number;
  target_positions: string[];
  is_template: boolean;
}

interface Props {
  program: Program | null;
  organizationId: string;
  onClose: () => void;
  onSaved: () => void;
}

const PHASES = [
  'general', 'hypertrophy', 'strength', 'power',
  'peaking', 'competition_maintenance', 'deload',
];

const POSITIONS = [
  'setter', 'libero', 'outside_hitter', 'opposite',
  'middle_blocker', 'defensive_specialist',
];

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ');
}

export default function ProgramModal({ program, organizationId, onClose, onSaved }: Props) {
  const isEdit = !!program;
  const [form, setForm] = useState({
    name: program?.name ?? '',
    description: program?.description ?? '',
    phase: program?.phase ?? 'general',
    duration_weeks: program?.duration_weeks ?? 8,
    sessions_per_week: program?.sessions_per_week ?? 3,
    target_positions: program?.target_positions ?? [] as string[],
    is_template: program?.is_template ?? false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showDrillPicker, setShowDrillPicker] = useState(false);
  const [selectedDrills, setSelectedDrills] = useState<{ id: string; name: string; skill_type: string }[]>([]);

  // Load existing drills if editing
  useEffect(() => {
    if (!program) return;
    async function loadDrills() {
      const { data } = await supabase
        .from('program_session_drills')
        .select('drills(id, name, skill_type)')
        .eq('program_sessions.program_weeks.program_id', program!.id);
      // Simplified: fetch drills linked to this program via the session chain
      // We'll handle this via a simpler direct query
    }
    loadDrills();
  }, [program]);

  const handleBackdrop = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => { if (e.target === e.currentTarget) onClose(); },
    [onClose],
  );

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [onClose]);

  function togglePosition(pos: string) {
    setForm((f) => ({
      ...f,
      target_positions: f.target_positions.includes(pos)
        ? f.target_positions.filter((p) => p !== pos)
        : [...f.target_positions, pos],
    }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError('Not authenticated'); setSaving(false); return; }

    const payload = {
      ...form,
      organization_id: organizationId,
      created_by: user.id,
    };

    let programId = program?.id;
    if (isEdit) {
      const { error } = await supabase
        .from('training_programs')
        .update(payload)
        .eq('id', program!.id);
      if (error) { setError(error.message); setSaving(false); return; }
    } else {
      const { data, error } = await supabase
        .from('training_programs')
        .insert(payload)
        .select('id')
        .single();
      if (error || !data) { setError(error?.message ?? 'Failed to create'); setSaving(false); return; }
      programId = data.id;
    }

    // If drills selected and new program, create a default week + session + link drills
    if (!isEdit && selectedDrills.length > 0 && programId) {
      const { data: week } = await supabase
        .from('program_weeks')
        .insert({ program_id: programId, week_number: 1 })
        .select('id')
        .single();

      if (week) {
        const { data: session } = await supabase
          .from('program_sessions')
          .insert({
            program_week_id: week.id,
            day_of_week: 1,
            session_type: 'technical',
            name: 'Session 1',
            estimated_duration_minutes: 60,
          })
          .select('id')
          .single();

        if (session) {
          await supabase.from('program_session_drills').insert(
            selectedDrills.map((d, i) => ({
              program_session_id: session.id,
              drill_id: d.id,
              sequence_order: i,
            })),
          );
        }
      }
    }

    setSaving(false);
    onSaved();
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.75)' }}
      onClick={handleBackdrop}
    >
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <h2 className="text-lg font-black text-white">
            {isEdit ? 'Edit Program' : 'New Training Program'}
          </h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white text-2xl leading-none">×</button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-5">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Program Name *</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Pre-Season Power Block"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm
                         placeholder:text-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={2}
              placeholder="What is this program for?"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm
                         placeholder:text-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 resize-none"
            />
          </div>

          {/* Phase + Duration row */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Phase</label>
              <select
                value={form.phase}
                onChange={(e) => setForm((f) => ({ ...f, phase: e.target.value }))}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500"
              >
                {PHASES.map((p) => <option key={p} value={p}>{capitalize(p)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Weeks</label>
              <input
                type="number" min={1} max={52}
                value={form.duration_weeks}
                onChange={(e) => setForm((f) => ({ ...f, duration_weeks: Number(e.target.value) }))}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Sessions/wk</label>
              <input
                type="number" min={1} max={14}
                value={form.sessions_per_week}
                onChange={(e) => setForm((f) => ({ ...f, sessions_per_week: Number(e.target.value) }))}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          {/* Target positions */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Target Positions</label>
            <div className="flex flex-wrap gap-2">
              {POSITIONS.map((pos) => (
                <button
                  key={pos}
                  type="button"
                  onClick={() => togglePosition(pos)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                    form.target_positions.includes(pos)
                      ? 'bg-brand-500/20 border-brand-500 text-brand-400'
                      : 'border-slate-700 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  {capitalize(pos)}
                </button>
              ))}
            </div>
          </div>

          {/* Drill picker */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-slate-300">Drills in Program</label>
              <button
                type="button"
                onClick={() => setShowDrillPicker(true)}
                className="text-xs text-brand-400 hover:text-brand-300"
              >
                + Add Drills
              </button>
            </div>
            {selectedDrills.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No drills added yet.</p>
            ) : (
              <ul className="space-y-1.5">
                {selectedDrills.map((d) => (
                  <li key={d.id} className="flex items-center justify-between bg-slate-800 rounded-lg px-3 py-2">
                    <span className="text-sm text-white">{d.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-500">{capitalize(d.skill_type)}</span>
                      <button
                        type="button"
                        onClick={() => setSelectedDrills((ds) => ds.filter((x) => x.id !== d.id))}
                        className="text-slate-600 hover:text-red-400 text-xs"
                      >
                        ×
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Template toggle */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="is_template"
              checked={form.is_template}
              onChange={(e) => setForm((f) => ({ ...f, is_template: e.target.checked }))}
              className="w-4 h-4 rounded border-slate-600 bg-slate-800 accent-brand-500"
            />
            <label htmlFor="is_template" className="text-sm text-slate-300">
              Save as reusable template
            </label>
          </div>

          {error && (
            <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-ghost flex-1 text-sm">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 text-sm">
              {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Program'}
            </button>
          </div>
        </form>
      </div>

      {showDrillPicker && (
        <DrillPicker
          selectedIds={selectedDrills.map((d) => d.id)}
          onSelect={(drill) => {
            setSelectedDrills((ds) =>
              ds.find((d) => d.id === drill.id) ? ds : [...ds, drill],
            );
          }}
          onClose={() => setShowDrillPicker(false)}
        />
      )}
    </div>
  );
}
