'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import ProgramModal from '@/components/programs/ProgramModal';

interface Program {
  id: string;
  name: string;
  description: string | null;
  phase: string;
  duration_weeks: number;
  sessions_per_week: number;
  target_positions: string[];
  is_template: boolean;
  published_at: string | null;
  created_at: string;
}

const PHASE_STYLES: Record<string, string> = {
  hypertrophy: 'bg-purple-500/20 text-purple-400',
  strength: 'bg-blue-500/20 text-blue-400',
  power: 'bg-orange-500/20 text-orange-400',
  peaking: 'bg-red-500/20 text-red-400',
  competition_maintenance: 'bg-green-500/20 text-green-400',
  deload: 'bg-slate-500/20 text-slate-400',
  general: 'bg-sky-500/20 text-sky-400',
};

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ');
}

export default function ProgramsPage() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [organizationId, setOrganizationId] = useState<string | null>(null);

  async function loadData() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (profile) {
      setOrganizationId(profile.organization_id);
      const { data } = await supabase
        .from('training_programs')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });
      setPrograms(data ?? []);
    }
    setLoading(false);
  }

  useEffect(() => { loadData(); }, []);

  async function handleDelete(id: string) {
    if (!confirm('Delete this program?')) return;
    await supabase
      .from('training_programs')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);
    loadData();
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-white">Training Programs</h1>
          <p className="text-slate-400 mt-1">
            {loading
              ? 'Loading…'
              : `${programs.length} program${programs.length !== 1 ? 's' : ''} · Build periodized plans and assign drills`}
          </p>
        </div>
        <button
          onClick={() => { setSelectedProgram(null); setShowModal(true); }}
          className="btn-primary"
        >
          + New Program
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[0,1,2].map((i) => (
            <div key={i} className="card p-5 h-20 animate-pulse bg-slate-800" />
          ))}
        </div>
      ) : programs.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-5xl mb-4">📋</div>
          <h3 className="text-lg font-bold text-white mb-2">No programs yet</h3>
          <p className="text-slate-400 text-sm max-w-md mx-auto mb-6">
            Create your first training program with drills, sessions and weekly structure.
          </p>
          <button
            onClick={() => { setSelectedProgram(null); setShowModal(true); }}
            className="btn-primary"
          >
            Create Program
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {programs.map((p) => (
            <div key={p.id} className="card p-5 flex items-center gap-5 hover:bg-slate-800/50 transition-colors">
              <div className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${PHASE_STYLES[p.phase] ?? 'bg-slate-700 text-slate-300'}`}>
                {capitalize(p.phase)}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-white">{p.name}</h3>
                <p className="text-xs text-slate-400 mt-0.5 truncate">
                  {p.duration_weeks}w · {p.sessions_per_week}×/week
                  {p.target_positions.length > 0 && ` · ${p.target_positions.map(capitalize).join(', ')}`}
                  {p.description && ` · ${p.description}`}
                </p>
              </div>
              {p.is_template && (
                <span className="text-xs bg-brand-500/20 text-brand-400 px-2 py-0.5 rounded-full shrink-0">Template</span>
              )}
              {p.published_at
                ? <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full shrink-0">Published</span>
                : <span className="text-xs bg-slate-700 text-slate-400 px-2 py-0.5 rounded-full shrink-0">Draft</span>
              }
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => { setSelectedProgram(p); setShowModal(true); }}
                  className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded hover:bg-slate-700 transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(p.id)}
                  className="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded hover:bg-red-500/10 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && organizationId && (
        <ProgramModal
          program={selectedProgram}
          organizationId={organizationId}
          onClose={() => setShowModal(false)}
          onSaved={loadData}
        />
      )}
    </div>
  );
}
