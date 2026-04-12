import { describe, it, expect } from 'vitest';

// ─── Drill filtering helpers (pure functions mirroring the UI logic) ──────────

function matchesDrillSearch(drillName: string, search: string): boolean {
  if (!search) return true;
  return drillName.toLowerCase().includes(search.toLowerCase());
}

function matchesDrillSkill(drillSkillType: string, filter: string): boolean {
  if (!filter) return true;
  return drillSkillType === filter;
}

function matchesDrillDifficulty(drillDifficulty: string, filter: string): boolean {
  if (!filter) return true;
  return drillDifficulty === filter;
}

function filterDrills(
  drills: { name: string; skill_type: string; difficulty: string }[],
  opts: { search?: string; skill?: string; difficulty?: string },
) {
  return drills.filter(
    (d) =>
      matchesDrillSearch(d.name, opts.search ?? '') &&
      matchesDrillSkill(d.skill_type, opts.skill ?? '') &&
      matchesDrillDifficulty(d.difficulty, opts.difficulty ?? ''),
  );
}

// ─── Program validation helpers ───────────────────────────────────────────────

function validateProgramForm(form: {
  name: string;
  duration_weeks: number;
  sessions_per_week: number;
}): string[] {
  const errors: string[] = [];
  if (!form.name.trim()) errors.push('Name is required');
  if (form.duration_weeks < 1 || form.duration_weeks > 52)
    errors.push('Duration must be 1–52 weeks');
  if (form.sessions_per_week < 1 || form.sessions_per_week > 14)
    errors.push('Sessions per week must be 1–14');
  return errors;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

const SAMPLE_DRILLS = [
  { name: 'Serving Target Practice', skill_type: 'serving', difficulty: 'beginner' },
  { name: 'Pepper Drill', skill_type: 'passing', difficulty: 'beginner' },
  { name: 'Float Serve Technique', skill_type: 'serving', difficulty: 'intermediate' },
  { name: 'Approach Jump Training', skill_type: 'attacking', difficulty: 'advanced' },
  { name: 'Block Footwork Shuffle', skill_type: 'blocking', difficulty: 'advanced' },
];

describe('filterDrills', () => {
  it('returns all drills when no filters applied', () => {
    expect(filterDrills(SAMPLE_DRILLS, {})).toHaveLength(5);
  });

  it('filters by search term (case-insensitive)', () => {
    expect(filterDrills(SAMPLE_DRILLS, { search: 'serve' })).toHaveLength(1);
    expect(filterDrills(SAMPLE_DRILLS, { search: 'PEPPER' })).toHaveLength(1);
  });

  it('filters by skill type', () => {
    expect(filterDrills(SAMPLE_DRILLS, { skill: 'serving' })).toHaveLength(2);
    expect(filterDrills(SAMPLE_DRILLS, { skill: 'blocking' })).toHaveLength(1);
    expect(filterDrills(SAMPLE_DRILLS, { skill: 'setting' })).toHaveLength(0);
  });

  it('filters by difficulty', () => {
    expect(filterDrills(SAMPLE_DRILLS, { difficulty: 'beginner' })).toHaveLength(2);
    expect(filterDrills(SAMPLE_DRILLS, { difficulty: 'advanced' })).toHaveLength(2);
    expect(filterDrills(SAMPLE_DRILLS, { difficulty: 'elite' })).toHaveLength(0);
  });

  it('combines search + skill + difficulty filters', () => {
    const result = filterDrills(SAMPLE_DRILLS, { skill: 'serving', difficulty: 'intermediate' });
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Float Serve Technique');
  });

  it('returns empty when no matches', () => {
    expect(filterDrills(SAMPLE_DRILLS, { search: 'zzz' })).toHaveLength(0);
  });
});

describe('validateProgramForm', () => {
  it('returns no errors for valid form', () => {
    expect(validateProgramForm({ name: 'Pre-Season', duration_weeks: 8, sessions_per_week: 3 })).toHaveLength(0);
  });

  it('requires name', () => {
    const errs = validateProgramForm({ name: '  ', duration_weeks: 8, sessions_per_week: 3 });
    expect(errs).toContain('Name is required');
  });

  it('validates duration range', () => {
    expect(validateProgramForm({ name: 'X', duration_weeks: 0, sessions_per_week: 3 }))
      .toContain('Duration must be 1–52 weeks');
    expect(validateProgramForm({ name: 'X', duration_weeks: 53, sessions_per_week: 3 }))
      .toContain('Duration must be 1–52 weeks');
  });

  it('validates sessions per week range', () => {
    expect(validateProgramForm({ name: 'X', duration_weeks: 8, sessions_per_week: 0 }))
      .toContain('Sessions per week must be 1–14');
    expect(validateProgramForm({ name: 'X', duration_weeks: 8, sessions_per_week: 15 }))
      .toContain('Sessions per week must be 1–14');
  });

  it('can return multiple errors', () => {
    const errs = validateProgramForm({ name: '', duration_weeks: 0, sessions_per_week: 0 });
    expect(errs.length).toBeGreaterThanOrEqual(2);
  });
});
