'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

const ALL_MONTHS = ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];

const COLOR_OPTIONS = [
  { label: 'Purple', value: 'bg-purple-500/30 text-purple-300' },
  { label: 'Orange', value: 'bg-orange-500/30 text-orange-300' },
  { label: 'Blue', value: 'bg-blue-500/30 text-blue-300' },
  { label: 'Green', value: 'bg-green-500/30 text-green-300' },
  { label: 'Red', value: 'bg-red-500/30 text-red-300' },
  { label: 'Slate', value: 'bg-slate-600/30 text-slate-400' },
  { label: 'Yellow', value: 'bg-yellow-500/30 text-yellow-300' },
  { label: 'Pink', value: 'bg-pink-500/30 text-pink-300' },
];

export interface Phase {
  label: string;
  months: string[];
  color: string;
}

interface PlanData {
  id?: string;
  season: string;
  phases: Phase[];
}

interface Props {
  organizationId: string;
  userId: string;
  existing: PlanData | null;
  onClose: () => void;
  onSaved: (plan: PlanData & { id: string }) => void;
}

export default function EditPlanModal({ organizationId, userId, existing, onClose, onSaved }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [season, setSeason] = useState(existing?.season ?? '2025/2026');
  const [phases, setPhases] = useState<Phase[]>(
    existing?.phases ?? [
      { label: 'Off-Season', months: ['Jul', 'Aug'], color: 'bg-purple-500/30 text-purple-300' },
      { label: 'Pre-Season', months: ['Sep', 'Oct'], color: 'bg-orange-500/30 text-orange-300' },
      { label: 'Early Season', months: ['Nov', 'Dec'], color: 'bg-blue-500/30 text-blue-300' },
      { label: 'Mid Season', months: ['Jan', 'Feb', 'Mar'], color: 'bg-green-500/30 text-green-300' },
      { label: 'Playoffs / Cup', months: ['Apr', 'May'], color: 'bg-red-500/30 text-red-300' },
      { label: 'Active Rest', months: ['Jun'], color: 'bg-slate-600/30 text-slate-400' },
    ],
  );

  function updatePhase(i: number, field: keyof Phase, value: string | string[]) {
    setPhases((prev) => prev.map((p, idx) => (idx === i ? { ...p, [field]: value } : p)));
  }

  function toggleMonth(phaseIdx: number, month: string) {
    setPhases((prev) =>
      prev.map((p, i) => {
        if (i !== phaseIdx) return p;
        const has = p.months.includes(month);
        return { ...p, months: has ? p.months.filter((m) => m !== month) : [...p.months, month] };
      }),
    );
  }

  function addPhase() {
    setPhases((prev) => [...prev, { label: 'New Phase', months: [], color: 'bg-blue-500/30 text-blue-300' }]);
  }

  function removePhase(i: number) {
    setPhases((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!season.trim()) { setError('Season label is required.'); return; }
    setLoading(true);
    setError('');

    // Use approximate dates derived from months for start/end
    const allUsedMonths = phases.flatMap((p) => p.months);
    const julyDate = `${season.split('/')[0]}-07-01`;
    const juneDate = `${season.split('/')[1] ?? parseInt(season.split('/')[0]) + 1}-06-30`;

    let result;
    if (existing?.id) {
      result = await supabase
        .from('periodization_plans')
        .update({ season, phases, start_date: julyDate, end_date: juneDate })
        .eq('id', existing.id)
        .select('id, season, phases')
        .single();
    } else {
      result = await supabase
        .from('periodization_plans')
        .insert({
          organization_id: organizationId,
          created_by: userId,
          season,
          phases,
          start_date: julyDate,
          end_date: juneDate,
        })
        .select('id, season, phases')
        .single();
    }

    setLoading(false);
    if (result.error) {
      setError(result.error.message);
    } else {
      onSaved(result.data as PlanData & { id: string });
      onClose();
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-2xl w-full max-w-2xl border border-slate-700 shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <h2 className="text-lg font-bold text-white">{existing ? 'Edit Plan' : 'Create Annual Plan'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl leading-none">×</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto max-h-[75vh]">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg p-3">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Season *</label>
            <input
              className="input w-48"
              value={season}
              onChange={(e) => setSeason(e.target.value)}
              placeholder="2025/2026"
              required
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Phases</h3>
              <button type="button" onClick={addPhase} className="text-xs btn-secondary px-3 py-1">
                + Add Phase
              </button>
            </div>

            {phases.map((phase, i) => (
              <div key={i} className="border border-slate-700 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <input
                    className="input flex-1"
                    value={phase.label}
                    onChange={(e) => updatePhase(i, 'label', e.target.value)}
                    placeholder="Phase name"
                  />
                  <select
                    className="input w-32"
                    value={phase.color}
                    onChange={(e) => updatePhase(i, 'color', e.target.value)}
                  >
                    {COLOR_OPTIONS.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => removePhase(i)}
                    className="text-slate-500 hover:text-red-400 text-lg leading-none"
                  >
                    ×
                  </button>
                </div>

                <div>
                  <p className="text-xs text-slate-500 mb-2">Months</p>
                  <div className="flex flex-wrap gap-1.5">
                    {ALL_MONTHS.map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => toggleMonth(i, m)}
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${
                          phase.months.includes(m)
                            ? phase.color
                            : 'bg-slate-800 text-slate-500 hover:text-slate-300'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Saving…' : existing ? 'Save Plan' : 'Create Plan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
