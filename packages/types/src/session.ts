import { SessionType, TestType, DeviceSource, RTPStage, RecoveryModality } from './enums.js';

// ─── Performance Tests ───────────────────────────────────────────────────────

export interface PerformanceTest {
  id: string;
  athleteId: string;
  organizationId: string;
  testedBy: string;
  testDate: string;
  testType: TestType;
  value: number;
  unit: string;
  notes?: string;
  deviceSource: DeviceSource;
  rawData?: Record<string, unknown>;
  createdAt: string;
}

export interface PerformanceTestTrend {
  testType: TestType;
  tests: PerformanceTest[];
  latestValue: number;
  changePercent: number; // vs 6 weeks ago
  isSignificantDrop: boolean; // >1 std dev below 6-week average
}

// ─── Training Sessions ───────────────────────────────────────────────────────

export interface TrainingSession {
  id: string;
  athleteId: string;
  organizationId: string;
  programSessionId?: string;
  scheduledDate: string;
  startedAt?: string;
  completedAt?: string;
  sessionType: SessionType;
  location?: string;
  preSessionSleepHours?: number;
  preSessionSleepQuality?: number; // 1–5
  preSessionSoreness?: number; // 1–10
  preSessionHrv?: number; // ms
  preSessionReadinessScore?: number; // 0–100
  sessionRpe?: number; // 1–10
  coachNotes?: string;
  athleteNotes?: string;
  totalVolumeLoad?: number; // sets × reps × kg
  drillLogs?: SessionDrillLog[];
  createdAt: string;
  updatedAt: string;
}

export interface SessionDrillLog {
  id: string;
  trainingSessionId: string;
  drillId: string;
  sequenceOrder: number;
  setsCompleted?: number;
  repsCompleted?: number;
  durationCompletedSeconds?: number;
  loadKg?: number;
  distanceM?: number;
  notes?: string;
  completedAt?: string;
}

// ─── Pre-session readiness check-in ─────────────────────────────────────────

export interface ReadinessCheckin {
  sleepHours: number;
  sleepQuality: number; // 1–5
  soreness: number; // 1–10
  hrvMs?: number;
  mood?: number; // 1–5 optional
}

// ─── Injury ───────────────────────────────────────────────────────────────────

export interface Injury {
  id: string;
  athleteId: string;
  organizationId: string;
  reportedBy: string;
  injuryDate: string;
  bodyPart: string;
  bodySide: string;
  mechanism: string;
  severity: string;
  diagnosis?: string;
  returnToPlayDate?: string;
  actualReturnDate?: string;
  clearanceBy?: string;
  currentStage: RTPStage;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Recovery ────────────────────────────────────────────────────────────────

export interface RecoveryLog {
  id: string;
  athleteId: string;
  logDate: string;
  sleepHours?: number;
  sleepQuality?: number; // 1–5
  hrvMs?: number;
  restingHr?: number;
  sorenessOverall?: number; // 1–10
  sorenessZones?: Partial<Record<string, number>>;
  modalities?: RecoveryEntry[];
  bodyWeightKg?: number;
  createdAt: string;
}

export interface RecoveryEntry {
  type: RecoveryModality;
  durationMin: number;
  notes?: string;
}

// ─── Nutrition ────────────────────────────────────────────────────────────────

export interface NutritionLog {
  id: string;
  athleteId: string;
  logDate: string;
  mealEntries: MealEntry[];
  totalCalories?: number;
  totalProteinG?: number;
  totalCarbsG?: number;
  totalFatG?: number;
  waterMl?: number;
  supplementEntries?: SupplementEntry[];
  dailyTargetCalories?: number;
  dailyTargetProteinG?: number;
  createdAt: string;
}

export interface MealEntry {
  mealName: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  time: string; // ISO time string
}

export interface SupplementEntry {
  name: string;
  doseMg: number;
  time: string;
}
