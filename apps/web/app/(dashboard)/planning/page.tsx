export default function PlanningPage() {
  const months = [
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  ];

  const phases = [
    { label: 'Off-Season', months: ['Jul', 'Aug'], color: 'bg-purple-500/30 text-purple-300' },
    { label: 'Pre-Season', months: ['Sep', 'Oct'], color: 'bg-orange-500/30 text-orange-300' },
    { label: 'Early Season', months: ['Nov', 'Dec'], color: 'bg-blue-500/30 text-blue-300' },
    { label: 'Mid Season', months: ['Jan', 'Feb', 'Mar'], color: 'bg-green-500/30 text-green-300' },
    { label: 'Playoffs / Cup', months: ['Apr', 'May'], color: 'bg-red-500/30 text-red-300' },
    { label: 'Active Rest', months: ['Jun'], color: 'bg-slate-600/30 text-slate-400' },
  ];

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-white">Annual Planning</h1>
          <p className="text-slate-400 mt-1">Periodization calendar — Season 2025/2026</p>
        </div>
        <button className="btn-primary">Edit Plan</button>
      </div>

      {/* Annual calendar grid */}
      <div className="card p-6 mb-8">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
          Macro Cycle Overview
        </h2>

        {/* Month headers */}
        <div className="grid grid-cols-12 gap-1 mb-2">
          {months.map((m) => (
            <div key={m} className="text-center text-xs text-slate-500 font-mono">
              {m}
            </div>
          ))}
        </div>

        {/* Phase blocks */}
        {phases.map((phase) => (
          <div key={phase.label} className="grid grid-cols-12 gap-1 mb-1">
            {months.map((m) => (
              <div
                key={m}
                className={`h-8 rounded text-xs flex items-center justify-center font-semibold
                            ${phase.months.includes(m) ? phase.color : 'bg-slate-800/30'}`}
              >
                {phase.months.includes(m) && phase.months[0] === m ? (
                  <span className="truncate px-1">{phase.label}</span>
                ) : null}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Training load targets by phase */}
      <div>
        <h2 className="text-lg font-bold text-white mb-4">Phase Training Targets</h2>
        <div className="grid grid-cols-2 gap-4">
          {[
            {
              phase: 'Hypertrophy Block',
              color: 'border-purple-500',
              sessions: '4–5 / week',
              intensity: '60–75% 1RM',
              focus: 'Volume accumulation, muscle development',
              rpe: '6–7',
            },
            {
              phase: 'Strength Block',
              color: 'border-blue-500',
              sessions: '4 / week',
              intensity: '80–90% 1RM',
              focus: 'Max strength, force production',
              rpe: '7–8',
            },
            {
              phase: 'Power Block',
              color: 'border-orange-500',
              sessions: '3–4 / week',
              intensity: '30–60% 1RM (explosive)',
              focus: 'Rate of force development, jump mechanics',
              rpe: '7–9',
            },
            {
              phase: 'Competition',
              color: 'border-green-500',
              sessions: '2–3 / week (gym)',
              intensity: '70–80% 1RM maintenance',
              focus: 'Maintain strength, technical prep, taper before matches',
              rpe: '5–7',
            },
          ].map((block) => (
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
    </div>
  );
}
