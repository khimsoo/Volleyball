import { Suspense } from 'react';
import { TeamReadinessGrid } from '../../../components/roster/TeamReadinessGrid';
import { ACWRFlagPanel } from '../../../components/analytics/ACWRFlagPanel';

export default function DashboardPage() {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="p-8">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white">Team Overview</h1>
        <p className="text-slate-400 mt-1">{today}</p>
      </div>

      {/* Summary KPI row */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <KPICard label="Athletes Ready" value="—" color="green" />
        <KPICard label="Caution Zone" value="—" color="yellow" />
        <KPICard label="Active Injuries" value="—" color="red" />
        <KPICard label="Sessions Today" value="—" color="blue" />
      </div>

      {/* Roster readiness grid */}
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <h2 className="text-lg font-bold text-white mb-4">Athlete Readiness</h2>
          <Suspense fallback={<div className="card p-6 text-slate-500 text-sm">Loading roster...</div>}>
            <TeamReadinessGrid />
          </Suspense>
        </div>

        <div>
          <h2 className="text-lg font-bold text-white mb-4">Load Alerts</h2>
          <Suspense fallback={<div className="card p-4 text-slate-500 text-sm">Loading...</div>}>
            <ACWRFlagPanel />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

function KPICard({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: 'green' | 'yellow' | 'red' | 'blue';
}) {
  const colorMap = {
    green: 'text-green-400',
    yellow: 'text-yellow-400',
    red: 'text-red-400',
    blue: 'text-brand-500',
  };

  return (
    <div className="card p-5">
      <p className="text-sm text-slate-400 mb-1">{label}</p>
      <p className={`text-3xl font-black ${colorMap[color]}`}>{value}</p>
    </div>
  );
}
