import type { ReadinessScore, ReadinessComponents } from '@volleyball/types';
import { LoadRisk } from '@volleyball/types';

/**
 * Readiness Score (0–100)
 *
 * Weighted composite:
 *   HRV trend     30%
 *   Sleep hours   25%
 *   Sleep quality 15%
 *   Soreness      20%
 *   ACWR penalty  10%
 */

const WEIGHTS = {
  hrv: 0.30,
  sleepHours: 0.25,
  sleepQuality: 0.15,
  soreness: 0.20,
  acwr: 0.10,
} as const;

// HRV: compare today vs athlete's 7-day average baseline
export function normalizeHrvScore(todayHrv: number, baselineHrv: number): number {
  if (baselineHrv === 0) return 70; // no baseline → neutral
  const ratio = todayHrv / baselineHrv;
  // 1.0 = 100, 0.85 = ~50, < 0.7 = 0
  return Math.max(0, Math.min(100, (ratio - 0.7) / 0.3 * 100));
}

// Sleep hours: 9h = 100, 8h = 90, 6h = 50, <5h = 0
export function normalizeSleepHours(hours: number): number {
  if (hours >= 9) return 100;
  if (hours >= 8) return 90;
  if (hours >= 7) return 75;
  if (hours >= 6) return 55;
  if (hours >= 5) return 30;
  return 0;
}

// Sleep quality 1–5 → 0–100
export function normalizeSleepQuality(quality: number): number {
  return Math.max(0, Math.min(100, ((quality - 1) / 4) * 100));
}

// Soreness 1–10 (inverted): 1 = 100, 5 = 55, 10 = 0
export function normalizeSoreness(soreness: number): number {
  return Math.max(0, Math.min(100, ((10 - soreness) / 9) * 100));
}

// ACWR penalty: optimal = 100, high = 0
export function normalizeAcwrScore(acwrRisk: LoadRisk): number {
  switch (acwrRisk) {
    case LoadRisk.Low: return 60;
    case LoadRisk.Optimal: return 100;
    case LoadRisk.Caution: return 50;
    case LoadRisk.High: return 0;
  }
}

export function computeReadinessScore(
  athleteId: string,
  date: string,
  inputs: {
    todayHrv?: number;
    baselineHrv?: number;
    sleepHours?: number;
    sleepQuality?: number; // 1–5
    soreness?: number; // 1–10
    acwrRisk?: LoadRisk;
  },
): ReadinessScore {
  const hrvScore = inputs.todayHrv != null && inputs.baselineHrv != null
    ? normalizeHrvScore(inputs.todayHrv, inputs.baselineHrv)
    : 70;

  const sleepScore = inputs.sleepHours != null
    ? normalizeSleepHours(inputs.sleepHours)
    : 70;

  const sleepQualityScore = inputs.sleepQuality != null
    ? normalizeSleepQuality(inputs.sleepQuality)
    : 70;

  const sorenessScore = inputs.soreness != null
    ? normalizeSoreness(inputs.soreness)
    : 70;

  const acwrScore = inputs.acwrRisk != null
    ? normalizeAcwrScore(inputs.acwrRisk)
    : 100;

  const components: ReadinessComponents = {
    hrvScore,
    sleepScore,
    sleepQualityScore,
    sorenessScore,
    acwrScore,
  };

  const score = Math.round(
    hrvScore * WEIGHTS.hrv +
    sleepScore * WEIGHTS.sleepHours +
    sleepQualityScore * WEIGHTS.sleepQuality +
    sorenessScore * WEIGHTS.soreness +
    acwrScore * WEIGHTS.acwr,
  );

  let recommendation: ReadinessScore['recommendation'];
  if (score >= 80) recommendation = 'train_hard';
  else if (score >= 65) recommendation = 'train_normal';
  else if (score >= 45) recommendation = 'train_light';
  else recommendation = 'rest';

  return { athleteId, date, score, components, recommendation };
}
