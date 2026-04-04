'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface DataPoint {
  date: string;
  value: number;
}

export function AthleteMetricTrend({
  athleteId: _athleteId,
  testType: _testType,
  label,
  data = [],
}: {
  athleteId: string;
  testType: string;
  label: string;
  data?: DataPoint[];
}) {
  // In production: fetch via TanStack Query using athleteId + testType
  const hasData = data.length > 0;

  return (
    <div className="card p-5">
      <h3 className="text-sm font-semibold text-slate-300 mb-4">{label}</h3>

      {hasData ? (
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
            <XAxis
              dataKey="date"
              tick={{ fill: '#6B7280', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fill: '#6B7280', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              domain={['auto', 'auto']}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1E293B',
                border: '1px solid #374151',
                borderRadius: 8,
                fontSize: 12,
              }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#0EA5E9"
              strokeWidth={2}
              dot={{ r: 3, fill: '#0EA5E9' }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-40 flex items-center justify-center">
          <p className="text-slate-600 text-sm">No data yet</p>
        </div>
      )}
    </div>
  );
}
