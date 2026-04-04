import { describe, it, expect } from 'vitest';
import { calculateACWR, classifyLoadRisk, calculateSessionLoad } from './acwr.js';
import { LoadRisk } from '@volleyball/types';

describe('calculateSessionLoad', () => {
  it('multiplies RPE by duration', () => {
    expect(calculateSessionLoad(7, 60)).toBe(420);
    expect(calculateSessionLoad(5, 45)).toBe(225);
  });
});

describe('calculateACWR', () => {
  it('returns 1.0 when no chronic load', () => {
    expect(calculateACWR([])).toBe(1.0);
  });

  it('returns optimal ACWR for consistent training', () => {
    // Simulate 4 weeks of consistent ~400 load/day
    const sessions = [];
    const now = new Date();
    for (let d = 27; d >= 0; d--) {
      if (d % 2 === 0) {
        const date = new Date(now);
        date.setDate(now.getDate() - d);
        sessions.push({ date: date.toISOString().split('T')[0], load: 400 });
      }
    }
    const acwr = calculateACWR(sessions, now);
    // Consistent load → ACWR ≈ 1.0
    expect(acwr).toBeGreaterThan(0.8);
    expect(acwr).toBeLessThan(1.3);
  });
});

describe('classifyLoadRisk', () => {
  it('classifies low ACWR as Low risk', () => {
    expect(classifyLoadRisk(0.5)).toBe(LoadRisk.Low);
  });
  it('classifies optimal ACWR', () => {
    expect(classifyLoadRisk(1.0)).toBe(LoadRisk.Optimal);
    expect(classifyLoadRisk(1.3)).toBe(LoadRisk.Optimal);
  });
  it('classifies caution zone', () => {
    expect(classifyLoadRisk(1.4)).toBe(LoadRisk.Caution);
  });
  it('classifies high risk', () => {
    expect(classifyLoadRisk(1.6)).toBe(LoadRisk.High);
  });
});
