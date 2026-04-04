'use client';

import Link from 'next/link';
import type { AthleteReadinessSummary } from '@volleyball/types';
import { LoadRisk } from '@volleyball/types';

function ReadinessBadge({ status }: { status: AthleteReadinessSummary['readinessStatus'] }) {
  if (status === 'green') return <span className="badge-green">Ready</span>;
  if (status === 'yellow') return <span className="badge-yellow">Caution</span>;
  if (status === 'red') return <span className="badge-red">Rest</span>;
  return <span className="badge-gray">No Data</span>;
}

function ACWRBadge({ risk }: { risk: LoadRisk }) {
  if (risk === LoadRisk.Optimal) return <span className="badge-green">Optimal</span>;
  if (risk === LoadRisk.Low) return <span className="badge-gray">Low</span>;
  if (risk === LoadRisk.Caution) return <span className="badge-yellow">Caution</span>;
  return <span className="badge-red">High</span>;
}

// Server component — in production, fetch via Supabase directly
export function TeamReadinessGrid({
  athletes = [],
}: {
  athletes?: AthleteReadinessSummary[];
}) {
  if (athletes.length === 0) {
    return (
      <div className="card p-8 text-center">
        <p className="text-slate-500 text-sm">
          No athletes found. Add athletes to your roster to see readiness data.
        </p>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-800">
            <th className="text-left px-4 py-3 text-slate-400 font-semibold">#</th>
            <th className="text-left px-4 py-3 text-slate-400 font-semibold">Athlete</th>
            <th className="text-left px-4 py-3 text-slate-400 font-semibold">Position</th>
            <th className="text-left px-4 py-3 text-slate-400 font-semibold">Readiness</th>
            <th className="text-left px-4 py-3 text-slate-400 font-semibold">ACWR</th>
            <th className="text-left px-4 py-3 text-slate-400 font-semibold">Session</th>
            <th className="text-left px-4 py-3 text-slate-400 font-semibold">Injury</th>
          </tr>
        </thead>
        <tbody>
          {athletes.map((athlete, i) => (
            <tr
              key={athlete.athleteId}
              className={`border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors
                          ${i === athletes.length - 1 ? 'border-b-0' : ''}`}
            >
              <td className="px-4 py-3 text-slate-500 font-mono text-xs">
                {athlete.jerseyNumber ?? '—'}
              </td>
              <td className="px-4 py-3">
                <Link
                  href={`/roster/${athlete.athleteId}`}
                  className="text-white font-semibold hover:text-brand-500 transition-colors"
                >
                  {athlete.fullName}
                </Link>
              </td>
              <td className="px-4 py-3 text-slate-400 capitalize">
                {athlete.position.replace(/_/g, ' ')}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <ReadinessBadge status={athlete.readinessStatus} />
                  {athlete.readinessScore != null && (
                    <span className="text-slate-500 text-xs">{athlete.readinessScore}</span>
                  )}
                </div>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <ACWRBadge risk={athlete.acwrRisk} />
                  {athlete.acwr != null && (
                    <span className="text-slate-500 text-xs font-mono">
                      {athlete.acwr.toFixed(2)}
                    </span>
                  )}
                </div>
              </td>
              <td className="px-4 py-3">
                {athlete.sessionCompletedToday ? (
                  <span className="text-green-400">✓</span>
                ) : (
                  <span className="text-slate-600">—</span>
                )}
              </td>
              <td className="px-4 py-3">
                {athlete.hasActiveInjury ? (
                  <span className="badge-red">⚠ Injured</span>
                ) : (
                  <span className="text-slate-600">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
