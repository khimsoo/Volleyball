'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

const POSITIONS = [
  { value: 'setter', label: 'Setter' },
  { value: 'libero', label: 'Libero' },
  { value: 'outside_hitter', label: 'Outside Hitter' },
  { value: 'opposite', label: 'Opposite' },
  { value: 'middle_blocker', label: 'Middle Blocker' },
  { value: 'defensive_specialist', label: 'Defensive Specialist' },
];

const EXPERIENCE_TIERS = [
  { value: 'developmental', label: 'Developmental' },
  { value: 'collegiate', label: 'Collegiate' },
  { value: 'national', label: 'National' },
  { value: 'professional', label: 'Professional' },
];

interface Props {
  organizationId: string;
  onClose: () => void;
  onSaved: () => void;
}

export default function AddAthleteModal({ organizationId, onClose, onSaved }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    primary_position: 'setter',
    jersey_number: '',
    date_of_birth: '',
    experience_tier: 'developmental',
    height_cm: '',
    weight_kg: '',
  });

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.first_name.trim() || !form.last_name.trim()) {
      setError('First name and last name are required.');
      return;
    }
    setLoading(true);
    setError('');

    const { error: err } = await supabase.from('athlete_profiles').insert({
      organization_id: organizationId,
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      email: form.email.trim() || null,
      primary_position: form.primary_position,
      jersey_number: form.jersey_number ? parseInt(form.jersey_number) : null,
      date_of_birth: form.date_of_birth || null,
      experience_tier: form.experience_tier,
      height_cm: form.height_cm ? parseFloat(form.height_cm) : null,
      weight_kg: form.weight_kg ? parseFloat(form.weight_kg) : null,
    });

    setLoading(false);
    if (err) {
      setError(err.message);
    } else {
      onSaved();
      onClose();
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-slate-900 rounded-t-2xl sm:rounded-2xl w-full max-w-lg border border-slate-700 shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <h2 className="text-lg font-bold text-white">Add Athlete</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl leading-none">×</button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto max-h-[85dvh]">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg p-3">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">First Name *</label>
              <input
                className="input w-full"
                value={form.first_name}
                onChange={(e) => set('first_name', e.target.value)}
                placeholder="Jane"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Last Name *</label>
              <input
                className="input w-full"
                value={form.last_name}
                onChange={(e) => set('last_name', e.target.value)}
                placeholder="Smith"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Email (optional)</label>
            <input
              type="email"
              className="input w-full"
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
              placeholder="athlete@example.com"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Primary Position *</label>
              <select
                className="input w-full"
                value={form.primary_position}
                onChange={(e) => set('primary_position', e.target.value)}
              >
                {POSITIONS.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Jersey # (1–99)</label>
              <input
                type="number"
                min="1"
                max="99"
                className="input w-full"
                value={form.jersey_number}
                onChange={(e) => set('jersey_number', e.target.value)}
                placeholder="12"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Date of Birth</label>
              <input
                type="date"
                className="input w-full"
                value={form.date_of_birth}
                onChange={(e) => set('date_of_birth', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Experience Tier</label>
              <select
                className="input w-full"
                value={form.experience_tier}
                onChange={(e) => set('experience_tier', e.target.value)}
              >
                {EXPERIENCE_TIERS.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Height (cm)</label>
              <input
                type="number"
                className="input w-full"
                value={form.height_cm}
                onChange={(e) => set('height_cm', e.target.value)}
                placeholder="185"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Weight (kg)</label>
              <input
                type="number"
                className="input w-full"
                value={form.weight_kg}
                onChange={(e) => set('weight_kg', e.target.value)}
                placeholder="78"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Saving…' : 'Add Athlete'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
