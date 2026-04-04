export default function DrillLibraryPage() {
  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-white">Drill Library</h1>
          <p className="text-slate-400 mt-1">
            8 system drills available · Add custom drills for your team
          </p>
        </div>
        <button className="btn-primary">+ Add Drill</button>
      </div>

      {/* Search */}
      <div className="flex gap-4 mb-6">
        <input
          type="text"
          placeholder="Search drills..."
          className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2
                     text-white placeholder:text-slate-500 text-sm focus:outline-none
                     focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
        />
        <select className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300">
          <option value="">All Skills</option>
          <option value="serving">Serving</option>
          <option value="passing">Passing</option>
          <option value="setting">Setting</option>
          <option value="attacking">Attacking</option>
          <option value="blocking">Blocking</option>
          <option value="defense">Defense</option>
          <option value="strength">Strength</option>
          <option value="mobility">Mobility</option>
        </select>
        <select className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300">
          <option value="">All Levels</option>
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
          <option value="elite">Elite</option>
        </select>
      </div>

      {/* System drills list (populated from seed) */}
      <div className="space-y-3">
        {[
          { name: 'Serving Zone Target', skill: 'Serving', difficulty: 'Intermediate', video: false },
          { name: 'Pass-Set-Hit (3-Touch)', skill: 'Passing', difficulty: 'Intermediate', video: false },
          { name: 'Approach Jump Training', skill: 'Attacking', difficulty: 'Advanced', video: false },
          { name: 'Block Footwork — Lateral Shuffle', skill: 'Blocking', difficulty: 'Advanced', video: false },
          { name: 'Libero Defensive Sprawl', skill: 'Defense', difficulty: 'Elite', video: false },
          { name: 'Jump Squat (Power Development)', skill: 'Strength', difficulty: 'Advanced', video: false },
          { name: 'Setter Decision Training (Live Ball)', skill: 'Setting', difficulty: 'Elite', video: false },
          { name: 'Hip Mobility Circuit', skill: 'Mobility', difficulty: 'Beginner', video: false },
        ].map((drill) => (
          <div
            key={drill.name}
            className="card p-4 flex items-center gap-4 hover:bg-slate-800/50 cursor-pointer transition-colors"
          >
            <div className="flex-1">
              <h3 className="font-semibold text-white">{drill.name}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-slate-400">{drill.skill}</span>
                <span className="text-slate-600">·</span>
                <span
                  className={`text-xs font-semibold ${
                    drill.difficulty === 'Elite'
                      ? 'text-purple-400'
                      : drill.difficulty === 'Advanced'
                      ? 'text-red-400'
                      : drill.difficulty === 'Intermediate'
                      ? 'text-yellow-400'
                      : 'text-green-400'
                  }`}
                >
                  {drill.difficulty}
                </span>
              </div>
            </div>
            <span className="text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded">
              System
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
