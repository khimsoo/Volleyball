import { LoadRisk } from './enums.js';

// ─── ACWR ────────────────────────────────────────────────────────────────────

export interface ACWRData {
  athleteId: string;
  calculatedAt: string;
  acuteLoad: number; // 7-day average
  chronicLoad: number; // 28-day average
  acwr: number; // ratio
  risk: LoadRisk;
  weeklyLoadHistory: WeeklyLoad[];
}

export interface WeeklyLoad {
  weekStart: string;
  totalLoad: number;
  sessionCount: number;
  avgRpe: number;
}

// ─── Readiness ────────────────────────────────────────────────────────────────

export interface ReadinessScore {
  athleteId: string;
  date: string;
  score: number; // 0–100
  components: ReadinessComponents;
  recommendation: 'train_hard' | 'train_normal' | 'train_light' | 'rest';
}

export interface ReadinessComponents {
  hrvScore: number; // 0–100 normalized
  sleepScore: number; // 0–100
  sleepQualityScore: number; // 0–100
  sorenessScore: number; // 0–100 (inverted soreness)
  acwrScore: number; // 0–100 penalty if ACWR > 1.3
}

// ─── Team dashboard ──────────────────────────────────────────────────────────

export interface TeamReadinessOverview {
  organizationId: string;
  date: string;
  athletes: AthleteReadinessSummary[];
  flaggedAthletes: AthleteReadinessSummary[]; // ACWR caution/high or low readiness
}

export interface AthleteReadinessSummary {
  athleteId: string;
  fullName: string;
  position: string;
  jerseyNumber?: number;
  readinessScore?: number;
  readinessStatus: 'green' | 'yellow' | 'red' | 'unknown';
  acwr?: number;
  acwrRisk: LoadRisk;
  hasActiveInjury: boolean;
  sessionCompletedToday: boolean;
}

// ─── Trend alerts ────────────────────────────────────────────────────────────

export interface PerformanceAlert {
  athleteId: string;
  alertType: 'metric_drop' | 'high_acwr' | 'injury_risk' | 'low_readiness';
  metric?: string;
  currentValue?: number;
  baselineValue?: number;
  changePercent?: number;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  createdAt: string;
}
