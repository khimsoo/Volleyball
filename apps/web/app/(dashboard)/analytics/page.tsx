export default function AnalyticsPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white">Team Analytics</h1>
        <p className="text-slate-400 mt-1">Aggregate performance data across your roster</p>
      </div>

      {/* ACWR Overview */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="card p-5">
          <p className="text-xs text-slate-400 uppercase tracking-wider mb-3">Load Distribution</p>
          <div className="space-y-2">
            {[
              { label: 'Optimal (0.8–1.3)', color: 'bg-green-500', pct: '0%' },
              { label: 'Low (<0.8)', color: 'bg-slate-500', pct: '0%' },
              { label: 'Caution (1.3–1.5)', color: 'bg-yellow-500', pct: '0%' },
              { label: 'High Risk (>1.5)', color: 'bg-red-500', pct: '0%' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <div className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                <span className="flex-1 text-xs text-slate-400">{item.label}</span>
                <span className="text-xs font-mono text-white">{item.pct}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <p className="text-xs text-slate-400 uppercase tracking-wider mb-3">
            Session Compliance (7d)
          </p>
          <p className="text-4xl font-black text-white">—%</p>
          <p className="text-xs text-slate-500 mt-1">of scheduled sessions completed</p>
        </div>

        <div className="card p-5">
          <p className="text-xs text-slate-400 uppercase tracking-wider mb-3">Active Injuries</p>
          <p className="text-4xl font-black text-white">0</p>
          <p className="text-xs text-green-400 mt-1">Full squad available</p>
        </div>
      </div>

      {/* Position benchmarks */}
      <div>
        <h2 className="text-lg font-bold text-white mb-4">Position Benchmarks</h2>
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left px-4 py-3 text-slate-400 font-semibold">Position</th>
                <th className="text-left px-4 py-3 text-slate-400 font-semibold">Metric</th>
                <th className="text-left px-4 py-3 text-slate-400 font-semibold">Pro Min</th>
                <th className="text-left px-4 py-3 text-slate-400 font-semibold">Elite</th>
                <th className="text-left px-4 py-3 text-slate-400 font-semibold">Team Avg</th>
              </tr>
            </thead>
            <tbody>
              {[
                {
                  position: 'Outside Hitter',
                  metric: 'Attack Height',
                  min: '320 cm',
                  elite: '345 cm',
                },
                {
                  position: 'Opposite',
                  metric: 'Attack Height',
                  min: '325 cm',
                  elite: '350 cm',
                },
                {
                  position: 'Middle Blocker',
                  metric: 'Block Height',
                  min: '330 cm',
                  elite: '355 cm',
                },
                {
                  position: 'Setter',
                  metric: 'Standing Vertical',
                  min: '55 cm',
                  elite: '70 cm',
                },
                {
                  position: 'Libero',
                  metric: '5-0-5 Agility',
                  min: '2.5 s',
                  elite: '2.2 s',
                },
              ].map((row, i) => (
                <tr
                  key={i}
                  className="border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors"
                >
                  <td className="px-4 py-3 text-white font-medium">{row.position}</td>
                  <td className="px-4 py-3 text-slate-400">{row.metric}</td>
                  <td className="px-4 py-3 text-yellow-400 font-mono">{row.min}</td>
                  <td className="px-4 py-3 text-green-400 font-mono">{row.elite}</td>
                  <td className="px-4 py-3 text-slate-500">—</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
