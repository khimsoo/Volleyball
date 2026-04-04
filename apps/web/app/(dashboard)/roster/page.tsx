import Link from 'next/link';

// Position color mapping
const POSITION_COLORS: Record<string, string> = {
  setter: 'bg-purple-500/20 text-purple-400',
  libero: 'bg-yellow-500/20 text-yellow-400',
  outside_hitter: 'bg-blue-500/20 text-blue-400',
  opposite: 'bg-orange-500/20 text-orange-400',
  middle_blocker: 'bg-green-500/20 text-green-400',
  defensive_specialist: 'bg-pink-500/20 text-pink-400',
};

export default function RosterPage() {
  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-white">Roster</h1>
          <p className="text-slate-400 mt-1">Manage your team athletes and profiles</p>
        </div>
        <button className="btn-primary">+ Add Athlete</button>
      </div>

      {/* Position filter tabs */}
      <div className="flex gap-2 mb-6">
        {['All', 'Setter', 'Libero', 'Outside Hitter', 'Middle Blocker', 'Opposite', 'DS'].map(
          (pos) => (
            <button
              key={pos}
              className="px-4 py-1.5 rounded-full text-sm font-medium bg-slate-800 text-slate-400
                         hover:text-white hover:bg-slate-700 transition-colors"
            >
              {pos}
            </button>
          ),
        )}
      </div>

      {/* Empty state */}
      <div className="card p-12 text-center">
        <div className="text-5xl mb-4">🏐</div>
        <h3 className="text-lg font-bold text-white mb-2">No athletes yet</h3>
        <p className="text-slate-400 text-sm max-w-sm mx-auto mb-6">
          Add athletes to your roster to start tracking their performance, training load, and
          readiness.
        </p>
        <button className="btn-primary">Add First Athlete</button>
      </div>

      {/* Position legend */}
      <div className="mt-8 flex flex-wrap gap-3">
        {Object.entries(POSITION_COLORS).map(([pos, cls]) => (
          <span key={pos} className={`text-xs font-semibold px-3 py-1 rounded-full ${cls}`}>
            {pos.replace(/_/g, ' ')}
          </span>
        ))}
      </div>
    </div>
  );
}
