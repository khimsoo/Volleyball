'use client';

import type { AthleteReadinessSummary } from '@volleyball/types';
import { LoadRisk } from '@volleyball/types';

export function ACWRFlagPanel({
  flaggedAthletes = [],
}: {
  flaggedAthletes?: AthleteReadinessSummary[];
}) {
  if (flaggedAthletes.length === 0) {
    return (
      <div className="card p-6">
        <div className="flex items-center gap-2 text-green-400">
          <span className="text-xl">✓</span>
          <p className="text-sm font-semibold">All athletes in optimal load range</p>
        </div>
        <p className="text-slate-500 text-xs mt-2">
          ACWR between 0.8–1.3 for all active athletes.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {flaggedAthletes.map((athlete) => (
        <div
          key={athlete.athleteId}
          className={`card p-4 border-l-4 ${
            athlete.acwrRisk === LoadRisk.High
              ? 'border-l-red-500 bg-red-500/5'
              : athlete.hasActiveInjury
              ? 'border-l-red-500 bg-red-500/5'
              : 'border-l-yellow-500 bg-yellow-500/5'
          }`}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="font-semibold text-white text-sm">{athlete.fullName}</p>
              <p className="text-xs text-slate-400 capitalize">
                {athlete.position.replace(/_/g, ' ')}
              </p>
            </div>
            <div className="text-right">
              {athlete.acwr != null && (
                <p
                  className={`text-lg font-black font-mono ${
                    athlete.acwrRisk === LoadRisk.High ? 'text-red-400' : 'text-yellow-400'
                  }`}
                >
                  {athlete.acwr.toFixed(2)}
                </p>
              )}
              {athlete.hasActiveInjury && (
                <span className="badge-red mt-1">Injured</span>
              )}
            </div>
          </div>

          {athlete.acwrRisk === LoadRisk.High && (
            <p className="text-xs text-red-300 mt-2">
              ⚠ Load exceeds 1.5 — consider reducing session volume
            </p>
          )}
          {athlete.acwrRisk === LoadRisk.Caution && (
            <p className="text-xs text-yellow-300 mt-2">
              Monitor closely — ACWR approaching elevated range
            </p>
          )}
          {athlete.readinessStatus === 'red' && (
            <p className="text-xs text-red-300 mt-1">
              Low readiness score — recommend rest or light session
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
