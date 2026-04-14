'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

interface Props {
  athlete: null;
  organizationId: string;
  onClose: () => void;
  onSaved: () => void;
}

const POSITIONS = [
  'setter', 'libero', 'outside_hitter', 'opposite',
  'middle_blocker', 'defensive_specialist',
];

const EXPERIENCE_TIERS = ['developmental', 'collegiate', 'national', 'professional'];

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ');
}

export default function AthleteModal({ athlete, organizationId, onClose, onSaved }: Props) {
  const isEdit = !!athlete;
  const [form, setForm] = useState({
    firstName: athlete?.firstName ?? '',
    lastName: athlete?.lastName ?? '',
    email: athlete?.email ?? '',
    primaryPosition: athlete?.primaryPosition ?? 'libero',
    jerseyNumber: athlete?.jerseyNumber ?? undefined as number | undefined,
    heightCm: athlete?.heightCm ?? undefined as number | undefined,
    weightKg: athlete?.weightKg ?? undefined as number | undefined,
    experienceTier: athlete?.experienceTier ?? 'developmental',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleBackdrop = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => { if (e.target === e.currentTarget) onClose(); },
    [onClose],
  );

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [onClose]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError('Not authenticated'); setSaving(false); return; }

    if (!form.email.includes('@')) {
      setError('Invalid email address');
      setSaving(false);
      return;
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const endpoint = isEdit ? `${apiUrl}/athletes/${athlete.id}` : `${apiUrl}/athletes`;
    const method = isEdit ? 'PATCH' : 'POST';

    try {
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          primaryPosition: form.primaryPosition,
          jerseyNumber: form.jerseyNumber || null,
          heightCm: form.heightCm || null,
          weightKg: form.weightKg || null,
          experienceTier: form.experienceTier,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        setError(errData.error || 'Failed to save athlete');
        setSaving(false);
        return;
      }

      setSaving(false);
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setSaving(false);
    }
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
            {isEdit ? 'Edit Athlete' : 'Add Athlete'}
          </h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white text-2xl leading-none">×</button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">First Name *</label>
              <input
                required
                value={form.firstName}
                onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                placeholder="John"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm
                           placeholder:text-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Last Name *</label>
              <input
                required
                value={form.lastName}
                onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                placeholder="Doe"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm
                           placeholder:text-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Email *</label>
            <input
              required
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="john@school.edu"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm
                         placeholder:text-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Position *</label>
              <select
                value={form.primaryPosition}
                onChange={(e) => setForm((f) => ({ ...f, primaryPosition: e.target.value }))}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500"
              >
                {POSITIONS.map((p) => (
                  <option key={p} value={p}>{capitalize(p)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Jersey #</label>
              <input
                type="number"
                min={1}
                max={99}
                value={form.jerseyNumber ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, jerseyNumber: e.target.value ? Number(e.target.value) : undefined }))}
                placeholder="12"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm
                           placeholder:text-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Height (cm)</label>
              <input
                type="number"
                min={100}
                max={250}
                step={0.5}
                value={form.heightCm ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, heightCm: e.target.value ? Number(e.target.value) : undefined }))}
                placeholder="185"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm
                           placeholder:text-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Weight (kg)</label>
              <input
                type="number"
                min={30}
                max={200}
                step={0.5}
                value={form.weightKg ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, weightKg: e.target.value ? Number(e.target.value) : undefined }))}
                placeholder="78"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm
                           placeholder:text-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Experience Tier</label>
            <select
              value={form.experienceTier}
              onChange={(e) => setForm((f) => ({ ...f, experienceTier: e.target.value }))}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500"
            >
              {EXPERIENCE_TIERS.map((t) => (
                <option key={t} value={t}>{capitalize(t)}</option>
              ))}
            </select>
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
              {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Athlete'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
