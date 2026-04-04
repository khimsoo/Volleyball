export default function MatchesPage() {
  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-white">Match Analytics</h1>
          <p className="text-slate-400 mt-1">Track match results and player statistics</p>
        </div>
        <button className="btn-primary">+ Log Match</button>
      </div>

      {/* Season summary */}
      <div className="grid grid-cols-5 gap-4 mb-8">
        {[
          { label: 'Matches Played', value: '—' },
          { label: 'Wins', value: '—', color: 'text-green-400' },
          { label: 'Losses', value: '—', color: 'text-red-400' },
          { label: 'Sets Won%', value: '—' },
          { label: 'Attack Efficiency', value: '—' },
        ].map((stat) => (
          <div key={stat.label} className="card p-4">
            <p className="text-xs text-slate-400 mb-1">{stat.label}</p>
            <p className={`text-2xl font-black ${stat.color ?? 'text-white'}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Empty state */}
      <div className="card p-12 text-center">
        <div className="text-5xl mb-4">🏆</div>
        <h3 className="text-lg font-bold text-white mb-2">No matches logged</h3>
        <p className="text-slate-400 text-sm max-w-sm mx-auto mb-6">
          Log your first match to start tracking kill%, reception efficiency, serve stats, and
          court zone heatmaps.
        </p>
        <button className="btn-primary">Log First Match</button>
      </div>

      {/* Stats explanation */}
      <div className="mt-8 grid grid-cols-3 gap-4">
        {[
          {
            label: 'Attack Efficiency',
            formula: '(Kills − Errors − Blocked) ÷ Attempts',
            target: '> 0.280',
          },
          {
            label: 'Reception Efficiency',
            formula: 'Positive Receptions ÷ Total Receptions',
            target: '> 65%',
          },
          {
            label: 'Side-Out %',
            formula: 'Points won on reception ÷ Total receptions',
            target: '> 58%',
          },
        ].map((s) => (
          <div key={s.label} className="card p-4">
            <p className="text-sm font-bold text-white mb-1">{s.label}</p>
            <p className="text-xs text-slate-400 mb-2 font-mono">{s.formula}</p>
            <p className="text-xs text-green-400">Pro target: {s.target}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
