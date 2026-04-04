import type { ACWRData, WeeklyLoad } from '@volleyball/types';
import { LoadRisk } from '@volleyball/types';

/**
 * Session Load Unit (SLU) = Session RPE × Duration in minutes
 * Based on Foster et al. (2001) session RPE method.
 */
export function calculateSessionLoad(rpe: number, durationMinutes: number): number {
  return rpe * durationMinutes;
}

/**
 * Acute:Chronic Workload Ratio
 *
 * ACWR = 7-day rolling average / 28-day rolling average
 *
 * Interpretation (Hulin et al., 2016):
 *   < 0.8  — Under-prepared / detraining risk
 *   0.8–1.3 — Optimal (sweet spot)
 *   1.3–1.5 — Caution zone
 *   > 1.5  — High injury risk
 */
export function calculateACWR(
  sessions: Array<{ date: string; load: number }>,
  referenceDate: Date = new Date(),
): number {
  const refMs = referenceDate.getTime();
  const msPerDay = 86_400_000;

  const recentSessions = sessions.filter((s) => {
    const ageMs = refMs - new Date(s.date).getTime();
    return ageMs >= 0 && ageMs < 28 * msPerDay;
  });

  const acuteSessions = recentSessions.filter((s) => {
    const ageMs = refMs - new Date(s.date).getTime();
    return ageMs < 7 * msPerDay;
  });

  const acuteTotal = acuteSessions.reduce((sum, s) => sum + s.load, 0);
  const chronicTotal = recentSessions.reduce((sum, s) => sum + s.load, 0);

  const acuteAvg = acuteTotal / 7;
  const chronicAvg = chronicTotal / 28;

  if (chronicAvg === 0) return 1.0; // no chronic load → assume optimal

  return acuteAvg / chronicAvg;
}

export function classifyLoadRisk(acwr: number): LoadRisk {
  if (acwr < 0.8) return LoadRisk.Low;
  if (acwr <= 1.3) return LoadRisk.Optimal;
  if (acwr <= 1.5) return LoadRisk.Caution;
  return LoadRisk.High;
}

export function buildWeeklyLoads(
  sessions: Array<{ date: string; load: number; rpe: number }>,
  weeksBack = 12,
): WeeklyLoad[] {
  const weeks: WeeklyLoad[] = [];
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  for (let w = weeksBack - 1; w >= 0; w--) {
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - w * 7 - now.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);

    const weekSessions = sessions.filter((s) => {
      const d = new Date(s.date);
      return d >= weekStart && d < weekEnd;
    });

    const totalLoad = weekSessions.reduce((sum, s) => sum + s.load, 0);
    const avgRpe =
      weekSessions.length > 0
        ? weekSessions.reduce((sum, s) => sum + s.rpe, 0) / weekSessions.length
        : 0;

    weeks.push({
      weekStart: weekStart.toISOString().split('T')[0],
      totalLoad,
      sessionCount: weekSessions.length,
      avgRpe,
    });
  }

  return weeks;
}

export function buildACWRData(
  athleteId: string,
  sessions: Array<{ date: string; load: number; rpe: number }>,
): ACWRData {
  const acwr = calculateACWR(sessions);
  const risk = classifyLoadRisk(acwr);
  const weeklyLoadHistory = buildWeeklyLoads(sessions);

  const msPerDay = 86_400_000;
  const now = Date.now();

  const acuteSessions = sessions.filter(
    (s) => now - new Date(s.date).getTime() < 7 * msPerDay,
  );
  const chronicSessions = sessions.filter(
    (s) => now - new Date(s.date).getTime() < 28 * msPerDay,
  );

  const acuteLoad =
    acuteSessions.reduce((sum, s) => sum + s.load, 0) / 7;
  const chronicLoad =
    chronicSessions.reduce((sum, s) => sum + s.load, 0) / 28;

  return {
    athleteId,
    calculatedAt: new Date().toISOString(),
    acuteLoad,
    chronicLoad,
    acwr,
    risk,
    weeklyLoadHistory,
  };
}
