import Link from 'next/link';

const PHASE_COLORS: Record<string, string> = {
  hypertrophy: 'bg-purple-500/20 text-purple-400',
  strength: 'bg-blue-500/20 text-blue-400',
  power: 'bg-orange-500/20 text-orange-400',
  peaking: 'bg-red-500/20 text-red-400',
  competition_maintenance: 'bg-green-500/20 text-green-400',
  deload: 'bg-slate-500/20 text-slate-400',
  general: 'bg-sky-500/20 text-sky-400',
};

export default function ProgramsPage() {
  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-white">Training Programs</h1>
          <p className="text-slate-400 mt-1">
            Build and manage periodized programs for your athletes
          </p>
        </div>
        <div className="flex gap-3">
          <button className="btn-ghost text-sm">Import Template</button>
          <button className="btn-primary">+ New Program</button>
        </div>
      </div>

      {/* Phase legend */}
      <div className="flex flex-wrap gap-2 mb-6">
        {Object.entries(PHASE_COLORS).map(([phase, cls]) => (
          <span key={phase} className={`text-xs font-semibold px-3 py-1 rounded-full ${cls}`}>
            {phase.replace(/_/g, ' ')}
          </span>
        ))}
      </div>

      {/* Empty state */}
      <div className="card p-12 text-center">
        <div className="text-5xl mb-4">📋</div>
        <h3 className="text-lg font-bold text-white mb-2">No programs yet</h3>
        <p className="text-slate-400 text-sm max-w-md mx-auto mb-6">
          Create your first training program. You can build from scratch or start with a
          position-specific template designed for professional volleyball.
        </p>
        <div className="flex gap-3 justify-center">
          <button className="btn-ghost">Browse Templates</button>
          <button className="btn-primary">Create Program</button>
        </div>
      </div>

      {/* Program phase guide */}
      <div className="mt-10">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
          Recommended Annual Structure
        </h2>
        <div className="grid grid-cols-7 gap-1">
          {[
            { phase: 'Hypertrophy', weeks: '4–6w', color: 'bg-purple-500/20' },
            { phase: 'Strength', weeks: '4–6w', color: 'bg-blue-500/20' },
            { phase: 'Power', weeks: '3–4w', color: 'bg-orange-500/20' },
            { phase: 'Peaking', weeks: '2–3w', color: 'bg-red-500/20' },
            { phase: 'Competition', weeks: '20–24w', color: 'bg-green-500/20' },
            { phase: 'Deload', weeks: '1w', color: 'bg-slate-600/20' },
            { phase: 'Active Rest', weeks: '2–4w', color: 'bg-slate-700/20' },
          ].map((p) => (
            <div key={p.phase} className={`${p.color} rounded-lg p-3 text-center`}>
              <p className="text-xs font-bold text-white">{p.phase}</p>
              <p className="text-xs text-slate-400 mt-1">{p.weeks}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
