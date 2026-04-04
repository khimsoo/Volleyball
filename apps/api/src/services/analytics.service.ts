import type { Pool } from 'pg';
import {
  buildACWRData,
  calculateSessionLoad,
  computeReadinessScore,
} from '@volleyball/utils';
import { LoadRisk } from '@volleyball/types';
import type {
  ACWRData,
  ReadinessScore,
  TeamReadinessOverview,
  AthleteReadinessSummary,
  PerformanceAlert,
} from '@volleyball/types';
import { detectMetricDrop } from '@volleyball/utils';

export class AnalyticsService {
  constructor(private readonly db: Pool) {}

  async getAthleteACWR(athleteId: string): Promise<ACWRData> {
    const result = await this.db.query<{
      scheduled_date: string;
      session_rpe: number;
      completed_at: string | null;
    }>(
      `SELECT scheduled_date, session_rpe, completed_at
       FROM training_sessions
       WHERE athlete_id = $1
         AND completed_at IS NOT NULL
         AND scheduled_date >= NOW() - INTERVAL '28 days'
       ORDER BY scheduled_date DESC`,
      [athleteId],
    );

    const sessions = result.rows
      .filter((r) => r.session_rpe != null && r.completed_at != null)
      .map((r) => {
        // Estimate duration from started_at/completed_at if available, default 60 min
        const load = calculateSessionLoad(r.session_rpe, 60);
        return {
          date: r.scheduled_date,
          load,
          rpe: r.session_rpe,
        };
      });

    return buildACWRData(athleteId, sessions);
  }

  async getAthleteReadinessScore(
    athleteId: string,
    date: string,
  ): Promise<ReadinessScore> {
    // Get today's recovery log
    const recoveryResult = await this.db.query<{
      sleep_hours: number;
      sleep_quality: number;
      hrv_ms: number;
      soreness_overall: number;
    }>(
      `SELECT sleep_hours, sleep_quality, hrv_ms, soreness_overall
       FROM recovery_logs
       WHERE athlete_id = $1 AND log_date = $2`,
      [athleteId, date],
    );

    // Get 7-day HRV baseline
    const hrvResult = await this.db.query<{ avg_hrv: number }>(
      `SELECT AVG(hrv_ms) AS avg_hrv
       FROM recovery_logs
       WHERE athlete_id = $1
         AND log_date BETWEEN $2::date - INTERVAL '7 days' AND $2::date - INTERVAL '1 day'
         AND hrv_ms IS NOT NULL`,
      [athleteId, date],
    );

    const acwrData = await this.getAthleteACWR(athleteId);
    const recovery = recoveryResult.rows[0];
    const baselineHrv = hrvResult.rows[0]?.avg_hrv;

    return computeReadinessScore(athleteId, date, {
      todayHrv: recovery?.hrv_ms,
      baselineHrv,
      sleepHours: recovery?.sleep_hours,
      sleepQuality: recovery?.sleep_quality,
      soreness: recovery?.soreness_overall,
      acwrRisk: acwrData.risk,
    });
  }

  async getTeamReadinessOverview(
    organizationId: string,
    date: string,
  ): Promise<TeamReadinessOverview> {
    const athleteResult = await this.db.query<{
      id: string;
      first_name: string;
      last_name: string;
      primary_position: string;
      jersey_number: number;
    }>(
      `SELECT ap.id, u.first_name, u.last_name, ap.primary_position, ap.jersey_number
       FROM athlete_profiles ap
       JOIN users u ON u.id = ap.user_id
       WHERE ap.organization_id = $1 AND ap.deleted_at IS NULL
       ORDER BY ap.jersey_number`,
      [organizationId],
    );

    const summaries: AthleteReadinessSummary[] = await Promise.all(
      athleteResult.rows.map(async (athlete) => {
        let readinessScore: number | undefined;
        let acwr: number | undefined;
        let acwrRisk: LoadRisk = LoadRisk.Optimal;

        try {
          const readiness = await this.getAthleteReadinessScore(athlete.id, date);
          readinessScore = readiness.score;
        } catch {
          // No data yet — that's OK
        }

        try {
          const acwrData = await this.getAthleteACWR(athlete.id);
          acwr = acwrData.acwr;
          acwrRisk = acwrData.risk;
        } catch {
          // No data yet
        }

        // Check active injuries
        const injuryResult = await this.db.query<{ count: string }>(
          `SELECT COUNT(*) FROM injuries
           WHERE athlete_id = $1 AND actual_return_date IS NULL`,
          [athlete.id],
        );
        const hasActiveInjury = parseInt(injuryResult.rows[0].count) > 0;

        // Check session completion today
        const sessionResult = await this.db.query<{ count: string }>(
          `SELECT COUNT(*) FROM training_sessions
           WHERE athlete_id = $1 AND scheduled_date = $2 AND completed_at IS NOT NULL`,
          [athlete.id, date],
        );
        const sessionCompletedToday = parseInt(sessionResult.rows[0].count) > 0;

        let readinessStatus: 'green' | 'yellow' | 'red' | 'unknown' = 'unknown';
        if (readinessScore != null) {
          if (readinessScore >= 70) readinessStatus = 'green';
          else if (readinessScore >= 45) readinessStatus = 'yellow';
          else readinessStatus = 'red';
        }
        if (acwrRisk === LoadRisk.High) readinessStatus = 'red';
        else if (acwrRisk === LoadRisk.Caution && readinessStatus === 'green') {
          readinessStatus = 'yellow';
        }

        return {
          athleteId: athlete.id,
          fullName: `${athlete.first_name} ${athlete.last_name}`,
          position: athlete.primary_position,
          jerseyNumber: athlete.jersey_number,
          readinessScore,
          readinessStatus,
          acwr,
          acwrRisk,
          hasActiveInjury,
          sessionCompletedToday,
        };
      }),
    );

    const flaggedAthletes = summaries.filter(
      (s) => s.readinessStatus === 'red' || s.readinessStatus === 'yellow' || s.hasActiveInjury,
    );

    return {
      organizationId,
      date,
      athletes: summaries,
      flaggedAthletes,
    };
  }

  async getPerformanceAlerts(athleteId: string): Promise<PerformanceAlert[]> {
    const alerts: PerformanceAlert[] = [];

    // Fetch last 6 weeks of each test type
    const testResult = await this.db.query<{
      test_type: string;
      value: number;
      test_date: string;
    }>(
      `SELECT test_type, value, test_date
       FROM performance_tests
       WHERE athlete_id = $1
         AND test_date >= NOW() - INTERVAL '42 days'
       ORDER BY test_type, test_date`,
      [athleteId],
    );

    // Group by test type and detect drops
    const byType = new Map<string, number[]>();
    for (const row of testResult.rows) {
      const vals = byType.get(row.test_type) ?? [];
      vals.push(Number(row.value));
      byType.set(row.test_type, vals);
    }

    for (const [testType, values] of byType) {
      if (values.length < 3) continue;
      const { isSignificantDrop, mean, latest } = detectMetricDrop(values);
      if (isSignificantDrop) {
        const changePercent = ((latest - mean) / mean) * 100;
        alerts.push({
          athleteId,
          alertType: 'metric_drop',
          metric: testType,
          currentValue: latest,
          baselineValue: mean,
          changePercent,
          message: `${testType.replace(/_/g, ' ')} has declined ${Math.abs(changePercent).toFixed(1)}% below 6-week average. Consider assessment.`,
          severity: Math.abs(changePercent) > 10 ? 'critical' : 'warning',
          createdAt: new Date().toISOString(),
        });
      }
    }

    return alerts;
  }
}
