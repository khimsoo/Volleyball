'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

const COMPETITION_LEVELS = [
  { value: 'practice', label: 'Practice' },
  { value: 'scrimmage', label: 'Scrimmage' },
  { value: 'league', label: 'League' },
  { value: 'cup', label: 'Cup' },
  { value: 'national', label: 'National' },
  { value: 'international', label: 'International' },
];

interface Props {
  organizationId: string;
  onClose: () => void;
  onSaved: () => void;
}

export default function AddMatchModal({ organizationId, onClose, onSaved }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    match_date: new Date().toISOString().split('T')[0],
    opponent: '',
    competition_name: '',
    competition_level: 'league',
    venue: '',
    home_away: 'home',
    sets_won: '0',
    sets_lost: '0',
    notes: '',
  });

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function computeResult(won: number, lost: number): 'win' | 'loss' | 'draw' | null {
    if (won === 0 && lost === 0) return null;
    if (won > lost) return 'win';
    if (lost > won) return 'loss';
    return 'draw';
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.opponent.trim() || !form.competition_name.trim()) {
      setError('Opponent and competition name are required.');
      return;
    }
    setLoading(true);
    setError('');

    const setsWon = parseInt(form.sets_won) || 0;
    const setsLost = parseInt(form.sets_lost) || 0;
    const result = computeResult(setsWon, setsLost);

    const { error: err } = await supabase.from('matches').insert({
      organization_id: organizationId,
      match_date: form.match_date,
      opponent: form.opponent.trim(),
      competition_name: form.competition_name.trim(),
      competition_level: form.competition_level,
      venue: form.venue.trim() || null,
      home_away: form.home_away,
      sets_won: setsWon,
      sets_lost: setsLost,
      result,
      notes: form.notes.trim() || null,
    });

    setLoading(false);
    if (err) {
      setError(err.message);
    } else {
      onSaved();
      onClose();
    }
  }

  const setsWon = parseInt(form.sets_won) || 0;
  const setsLost = parseInt(form.sets_lost) || 0;
  const preview = computeResult(setsWon, setsLost);

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-2xl w-full max-w-lg border border-slate-700 shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <h2 className="text-lg font-bold text-white">Log Match</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl leading-none">×</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg p-3">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Match Date *</label>
              <input
                type="date"
                className="input w-full"
                value={form.match_date}
                onChange={(e) => set('match_date', e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Home / Away</label>
              <select
                className="input w-full"
                value={form.home_away}
                onChange={(e) => set('home_away', e.target.value)}
              >
                <option value="home">Home</option>
                <option value="away">Away</option>
                <option value="neutral">Neutral</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Opponent *</label>
            <input
              className="input w-full"
              value={form.opponent}
              onChange={(e) => set('opponent', e.target.value)}
              placeholder="Rival FC"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Competition Name *</label>
              <input
                className="input w-full"
                value={form.competition_name}
                onChange={(e) => set('competition_name', e.target.value)}
                placeholder="National League 2025"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Level</label>
              <select
                className="input w-full"
                value={form.competition_level}
                onChange={(e) => set('competition_level', e.target.value)}
              >
                {COMPETITION_LEVELS.map((l) => (
                  <option key={l.value} value={l.value}>{l.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Venue</label>
            <input
              className="input w-full"
              value={form.venue}
              onChange={(e) => set('venue', e.target.value)}
              placeholder="City Sports Hall"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-2">Sets Score</label>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="block text-xs text-slate-500 mb-1">Your Sets Won</label>
                <input
                  type="number"
                  min="0"
                  max="5"
                  className="input w-full text-center text-2xl font-black"
                  value={form.sets_won}
                  onChange={(e) => set('sets_won', e.target.value)}
                />
              </div>
              <span className="text-slate-500 text-2xl font-black mt-4">–</span>
              <div className="flex-1">
                <label className="block text-xs text-slate-500 mb-1">Opponent Sets Won</label>
                <input
                  type="number"
                  min="0"
                  max="5"
                  className="input w-full text-center text-2xl font-black"
                  value={form.sets_lost}
                  onChange={(e) => set('sets_lost', e.target.value)}
                />
              </div>
              {preview && (
                <div className={`mt-4 px-3 py-1 rounded-full text-sm font-bold ${
                  preview === 'win' ? 'bg-green-500/20 text-green-400' :
                  preview === 'loss' ? 'bg-red-500/20 text-red-400' :
                  'bg-slate-500/20 text-slate-400'
                }`}>
                  {preview.toUpperCase()}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Notes</label>
            <textarea
              className="input w-full"
              rows={2}
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              placeholder="Key observations, injuries, lineup notes…"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Saving…' : 'Log Match'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
