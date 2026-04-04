import { describe, it, expect } from 'vitest';
import {
  computeReadinessScore,
  normalizeHrvScore,
  normalizeSleepHours,
  normalizeSoreness,
} from './readiness.js';
import { LoadRisk } from '@volleyball/types';

describe('normalizeHrvScore', () => {
  it('returns 100 when HRV matches baseline', () => {
    expect(normalizeHrvScore(60, 60)).toBeCloseTo(100);
  });
  it('returns 0 when HRV is 70% of baseline or lower', () => {
    expect(normalizeHrvScore(42, 60)).toBe(0);
  });
  it('returns 70 with no baseline (0)', () => {
    expect(normalizeHrvScore(60, 0)).toBe(70);
  });
});

describe('normalizeSleepHours', () => {
  it('returns 100 for 9+ hours', () => {
    expect(normalizeSleepHours(9)).toBe(100);
    expect(normalizeSleepHours(10)).toBe(100);
  });
  it('returns 0 for < 5 hours', () => {
    expect(normalizeSleepHours(4)).toBe(0);
  });
});

describe('normalizeSoreness', () => {
  it('returns 100 for soreness of 1', () => {
    expect(normalizeSoreness(1)).toBeCloseTo(100);
  });
  it('returns 0 for soreness of 10', () => {
    expect(normalizeSoreness(10)).toBe(0);
  });
});

describe('computeReadinessScore', () => {
  it('returns high score for well-recovered athlete', () => {
    const result = computeReadinessScore('athlete-1', '2025-01-01', {
      todayHrv: 65,
      baselineHrv: 60,
      sleepHours: 9,
      sleepQuality: 5,
      soreness: 1,
      acwrRisk: LoadRisk.Optimal,
    });
    expect(result.score).toBeGreaterThan(85);
    expect(result.recommendation).toBe('train_hard');
  });

  it('returns low score for poorly recovered athlete', () => {
    const result = computeReadinessScore('athlete-1', '2025-01-01', {
      todayHrv: 40,
      baselineHrv: 65,
      sleepHours: 4,
      sleepQuality: 1,
      soreness: 9,
      acwrRisk: LoadRisk.High,
    });
    expect(result.score).toBeLessThan(45);
    expect(result.recommendation).toBe('rest');
  });

  it('uses neutral defaults when inputs are missing', () => {
    const result = computeReadinessScore('athlete-1', '2025-01-01', {});
    expect(result.score).toBeGreaterThan(0);
    expect(result.score).toBeLessThan(100);
  });
});
