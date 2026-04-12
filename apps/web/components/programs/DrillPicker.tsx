'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

interface Drill {
  id: string;
  name: string;
  skill_type: string;
  difficulty: string;
}

interface Props {
  selectedIds: string[];
  onSelect: (drill: Drill) => void;
  onClose: () => void;
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ');
}

const DIFF_COLOR: Record<string, string> = {
  beginner: 'text-green-400',
  intermediate: 'text-yellow-400',
  advanced: 'text-red-400',
  elite: 'text-purple-400',
};

export default function DrillPicker({ selectedIds, onSelect, onClose }: Props) {
  const [drills, setDrills] = useState<Drill[]>([]);
  const [search, setSearch] = useState('');
  const [skillFilter, setSkillFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      let q = supabase.from('drills').select('id, name, skill_type, difficulty').is('deleted_at', null).order('name');
      if (skillFilter) q = q.eq('skill_type', skillFilter);
      if (search) q = q.ilike('name', `%${search}%`);
      const { data } = await q;
      setDrills(data ?? []);
      setLoading(false);
    }
    load();
  }, [search, skillFilter]);

  const handleBackdrop = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => { if (e.target === e.currentTarget) onClose(); },
    [onClose],
  );

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
      onClick={handleBackdrop}
    >
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg max-h-[80vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <h3 className="text-base font-bold text-white">Select Drills</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white text-2xl leading-none">×</button>
        </div>

        <div className="p-4 border-b border-slate-800 flex gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search drills…"
            className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm
                       placeholder:text-slate-500 focus:outline-none focus:border-brand-500"
          />
          <select
            value={skillFilter}
            onChange={(e) => setSkillFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300"
          >
            <option value="">All Skills</option>
            {['serving','passing','setting','attacking','blocking','defense','conditioning','strength','mobility'].map((s) => (
              <option key={s} value={s}>{capitalize(s)}</option>
            ))}
          </select>
        </div>

        <div className="overflow-y-auto flex-1">
          {loading ? (
            <div className="p-6 text-center text-slate-500 text-sm">Loading drills…</div>
          ) : drills.length === 0 ? (
            <div className="p-6 text-center text-slate-500 text-sm">No drills found.</div>
          ) : (
            <ul className="divide-y divide-slate-800">
              {drills.map((drill) => {
                const isSelected = selectedIds.includes(drill.id);
                return (
                  <li key={drill.id}>
                    <button
                      type="button"
                      onClick={() => onSelect(drill)}
                      className={`w-full flex items-center gap-4 px-5 py-3 text-left transition-colors ${
                        isSelected ? 'bg-brand-500/10' : 'hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{drill.name}</p>
                        <p className="text-xs text-slate-400">{capitalize(drill.skill_type)}</p>
                      </div>
                      <span className={`text-xs font-semibold ${DIFF_COLOR[drill.difficulty] ?? 'text-slate-400'}`}>
                        {capitalize(drill.difficulty)}
                      </span>
                      {isSelected && (
                        <span className="text-brand-400 text-sm">✓</span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="p-4 border-t border-slate-800">
          <button onClick={onClose} className="btn-primary w-full text-sm py-2.5">
            Done ({selectedIds.length} selected)
          </button>
        </div>
      </div>
    </div>
  );
}
