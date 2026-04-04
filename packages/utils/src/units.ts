// ─── Length ──────────────────────────────────────────────────────────────────

export const cmToInches = (cm: number): number => cm / 2.54;
export const inchesToCm = (inches: number): number => inches * 2.54;
export const cmToFeetInches = (cm: number): string => {
  const totalInches = cmToInches(cm);
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches % 12);
  return `${feet}'${inches}"`;
};
export const mToCm = (m: number): number => m * 100;
export const cmToM = (cm: number): number => cm / 100;

// ─── Weight ──────────────────────────────────────────────────────────────────

export const kgToLbs = (kg: number): number => kg * 2.20462;
export const lbsToKg = (lbs: number): number => lbs / 2.20462;

// ─── Speed ───────────────────────────────────────────────────────────────────

export const msToKmh = (ms: number): number => ms * 3.6;
export const kmhToMs = (kmh: number): number => kmh / 3.6;
export const msToMph = (ms: number): number => ms * 2.23694;

// ─── Display formatting ──────────────────────────────────────────────────────

export type DisplayUnit = 'metric' | 'imperial';

export function formatHeight(cm: number, unit: DisplayUnit): string {
  if (unit === 'imperial') return cmToFeetInches(cm);
  return `${cm} cm`;
}

export function formatWeight(kg: number, unit: DisplayUnit): string {
  if (unit === 'imperial') return `${Math.round(kgToLbs(kg))} lbs`;
  return `${kg} kg`;
}

export function formatDistance(m: number, unit: DisplayUnit): string {
  if (unit === 'imperial') return `${(m * 3.28084).toFixed(1)} ft`;
  return m >= 1 ? `${m.toFixed(1)} m` : `${Math.round(m * 100)} cm`;
}

// ─── Nutrition ────────────────────────────────────────────────────────────────

/**
 * Estimate daily calorie target based on training load.
 * Uses a simplified Harris-Benedict + activity multiplier approach.
 *
 * @param weightKg  Athlete body weight
 * @param heightCm  Athlete height
 * @param ageYears  Athlete age
 * @param sex       'male' | 'female'
 * @param sessionLoad  Today's session load (RPE × minutes). 0 = rest day.
 */
export function estimateDailyCalories(
  weightKg: number,
  heightCm: number,
  ageYears: number,
  sex: 'male' | 'female',
  sessionLoad: number,
): { calories: number; proteinG: number; carbsG: number; fatG: number } {
  // Mifflin-St Jeor BMR
  const bmr =
    sex === 'male'
      ? 10 * weightKg + 6.25 * heightCm - 5 * ageYears + 5
      : 10 * weightKg + 6.25 * heightCm - 5 * ageYears - 161;

  // Activity multiplier based on session load
  let activityMultiplier: number;
  if (sessionLoad === 0) activityMultiplier = 1.4; // rest day
  else if (sessionLoad < 300) activityMultiplier = 1.6; // light session
  else if (sessionLoad < 600) activityMultiplier = 1.8; // moderate session
  else activityMultiplier = 2.0; // heavy session

  const calories = Math.round(bmr * activityMultiplier);
  const proteinG = Math.round(weightKg * 2.0); // 2g/kg for athletes
  const fatG = Math.round((calories * 0.25) / 9);
  const carbsG = Math.round((calories - proteinG * 4 - fatG * 9) / 4);

  return { calories, proteinG, carbsG, fatG };
}
