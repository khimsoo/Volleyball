'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import EditPlanModal, { type Phase } from '@/components/planning/EditPlanModal';

interface Plan {
  id: string;
  season: string;
  phases: Phase[];
}

const MONTHS = ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];

const DEFAULT_BLOCKS = [
  { phase: 'Hypertrophy Block', color: 'border-purple-500', sessions: '4–5 / week', intensity: '60–75% 1RM', focus: 'Volume accumulation, muscle development', rpe: '6–7' },
  { phase: 'Strength Block', color: 'border-blue-500', sessions: '4 / week', intensity: '80–90% 1RM', focus: 'Max strength, force production', rpe: '7–8' },
  { phase: 'Power Block', color: 'border-orange-500', sessions: '3–4 / week', intensity: '30–60% 1RM (explosive)', focus: 'Rate of force development, jump mechanics', rpe: '7–9' },
  { phase: 'Competition', color: 'border-green-500', sessions: '2–3 / week (gym)', intensity: '70–80% 1RM maintenance', focus: 'Maintain strength, technical prep, taper before matches', rpe: '5–7' },
];

export default function PlanningPage() {
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  async function loadData() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);

    const { data: profile } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (!profile) return;
    setOrgId(profile.organization_id);

    const { data } = await supabase
      .from('periodization_plans')
      .select('id, season, phases')
      .eq('organization_id', profile.organization_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    setPlan(data ?? null);
    setLoading(false);
  }

  useEffect(() => { loadData(); }, []);

  const phases: Phase[] = plan?.phases ?? [];

  return (
    <div className="p-4 sm:p-8">
      <div className="flex items-center justify-between mb-6 sm:mb-8 gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">Annual Planning</h1>
          <p className="text-slate-400 mt-1 text-sm sm:text-base">
            {plan ? `Periodization calendar — Season ${plan.season}` : 'No plan created yet'}
          </p>
        </div>
        <button className="btn-primary shrink-0" onClick={() => setShowModal(true)}>
          {plan ? 'Edit Plan' : 'Create Plan'}
        </button>
      </div>

      {loading ? (
        <div className="card p-6 h-40 animate-pulse mb-8" />
      ) : !plan ? (
        <div className="card p-12 text-center mb-8">
          <div className="text-5xl mb-4">📅</div>
          <h3 className="text-lg font-bold text-white mb-2">No annual plan yet</h3>
          <p className="text-slate-400 text-sm max-w-sm mx-auto mb-6">
            Create a periodization plan to map your season phases across the year.
          </p>
          <button className="btn-primary" onClick={() => setShowModal(true)}>Create Plan</button>
        </div>
      ) : (
        <div className="card p-4 sm:p-6 mb-6 sm:mb-8">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
            Macro Cycle Overview — {plan.season}
          </h2>

          {/* Scrollable calendar on mobile */}
          <div className="overflow-x-auto">
            <div className="min-w-[480px]">
              {/* Month headers */}
              <div className="grid grid-cols-12 gap-1 mb-2">
                {MONTHS.map((m) => (
                  <div key={m} className="text-center text-xs text-slate-500 font-mono">{m}</div>
                ))}
              </div>

              {/* Phase rows */}
              {phases.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">No phases defined. Click Edit Plan to add phases.</p>
              ) : (
                phases.map((phase) => (
                  <div key={phase.label} className="grid grid-cols-12 gap-1 mb-1">
                    {MONTHS.map((m) => (
                      <div
                        key={m}
                        className={`h-8 rounded text-xs flex items-center justify-center font-semibold ${
                          phase.months.includes(m) ? phase.color : 'bg-slate-800/30'
                        }`}
                      >
                        {phase.months.includes(m) && phase.months[0] === m ? (
                          <span className="truncate px-1">{phase.label}</span>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Training load targets */}
      <div>
        <h2 className="text-lg font-bold text-white mb-4">Phase Training Targets</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {DEFAULT_BLOCKS.map((block) => (
            <div key={block.phase} className={`card p-5 border-l-4 ${block.color}`}>
              <h3 className="font-bold text-white mb-3">{block.phase}</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Sessions</span>
                  <span className="text-white font-mono">{block.sessions}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Intensity</span>
                  <span className="text-white font-mono">{block.intensity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Target RPE</span>
                  <span className="text-white font-mono">{block.rpe}</span>
                </div>
                <p className="text-slate-400 text-xs pt-1">{block.focus}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showModal && orgId && userId && (
        <EditPlanModal
          organizationId={orgId}
          userId={userId}
          existing={plan}
          onClose={() => setShowModal(false)}
          onSaved={(saved) => {
            setPlan(saved);
          }}
        />
      )}
    </div>
  );
}
