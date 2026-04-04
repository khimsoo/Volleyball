import Link from 'next/link';
import type { Metadata } from 'next';
import { AthleteMetricTrend } from '../../../../components/analytics/AthleteMetricTrend';

export const metadata: Metadata = { title: 'Athlete Profile — VolleyTrainer' };

export default async function AthleteProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="p-8">
      {/* Back link */}
      <Link
        href="/roster"
        className="text-sm text-slate-400 hover:text-white mb-6 inline-flex items-center gap-1"
      >
        ← Back to Roster
      </Link>

      {/* Header skeleton — replace with real data */}
      <div className="flex items-start gap-6 mb-8">
        <div className="w-20 h-20 bg-brand-500 rounded-full flex items-center justify-center text-3xl font-black">
          A
        </div>
        <div>
          <h1 className="text-3xl font-black text-white">Athlete {id.slice(0, 8)}</h1>
          <div className="flex items-center gap-3 mt-2">
            <span className="bg-blue-500/20 text-blue-400 text-xs font-semibold px-3 py-1 rounded-full">
              Outside Hitter
            </span>
            <span className="text-slate-400 text-sm">#7</span>
            <span className="badge-green">Active</span>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatCard label="Readiness Today" value="—" sub="No check-in" />
        <StatCard label="ACWR" value="—" sub="28-day average" />
        <StatCard label="Sessions (30d)" value="—" sub="completed" />
        <StatCard label="Attack Height" value="—" sub="latest test" />
      </div>

      {/* Performance Trend Charts */}
      <div className="mb-8">
        <h2 className="text-lg font-bold text-white mb-4">Performance Trends</h2>
        <div className="grid grid-cols-2 gap-4">
          <AthleteMetricTrend
            athleteId={id}
            testType="vertical_jump_approach"
            label="Approach Jump (cm)"
          />
          <AthleteMetricTrend
            athleteId={id}
            testType="squat_1rm"
            label="Back Squat 1RM (kg)"
          />
        </div>
      </div>

      {/* Recent Sessions */}
      <div>
        <h2 className="text-lg font-bold text-white mb-4">Recent Sessions</h2>
        <div className="card p-6 text-slate-500 text-sm">
          No sessions logged yet for this athlete.
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="card p-5">
      <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">{label}</p>
      <p className="text-2xl font-black text-white">{value}</p>
      <p className="text-xs text-slate-500 mt-1">{sub}</p>
    </div>
  );
}
