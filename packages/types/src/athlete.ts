import {
  Position,
  ExperienceTier,
  UserRole,
  SubscriptionTier,
} from './enums.js';

export interface Organization {
  id: string;
  name: string;
  subscriptionTier: SubscriptionTier;
  settings: OrganizationSettings;
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationSettings {
  timezone: string;
  displayUnits: 'metric' | 'imperial';
  features: {
    matchAnalytics: boolean;
    nutritionTracking: boolean;
    wearableIntegration: boolean;
    videoLibrary: boolean;
  };
}

export interface User {
  id: string;
  organizationId: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AthleteProfile {
  id: string;
  userId: string;
  organizationId: string;
  primaryPosition: Position;
  secondaryPositions: Position[];
  jerseyNumber?: number;
  heightCm?: number;
  weightKg?: number;
  wingspanCm?: number;
  standingReachCm?: number;
  dominantHand: 'left' | 'right';
  trainingAgeYears?: number;
  experienceTier: ExperienceTier;
  dateOfBirth?: string;
  nationality?: string;
  onboardingCompletedAt?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface AthleteWithUser extends AthleteProfile {
  user: User;
}

// ─── Benchmarks by position ──────────────────────────────────────────────────

export interface PositionBenchmark {
  position: Position;
  testType: string;
  professionalMin: number;
  professionalElite: number;
  unit: string;
  description: string;
}

export const POSITION_BENCHMARKS: PositionBenchmark[] = [
  // Attack height benchmarks (standing reach + vertical jump approach)
  {
    position: Position.OutsideHitter,
    testType: 'attack_height',
    professionalMin: 320,
    professionalElite: 345,
    unit: 'cm',
    description: 'Attack height (reach + approach jump)',
  },
  {
    position: Position.Opposite,
    testType: 'attack_height',
    professionalMin: 325,
    professionalElite: 350,
    unit: 'cm',
    description: 'Attack height (reach + approach jump)',
  },
  {
    position: Position.MiddleBlocker,
    testType: 'block_height',
    professionalMin: 330,
    professionalElite: 355,
    unit: 'cm',
    description: 'Block height (reach + block jump)',
  },
  {
    position: Position.Setter,
    testType: 'vertical_jump_standing',
    professionalMin: 55,
    professionalElite: 70,
    unit: 'cm',
    description: 'Standing vertical jump',
  },
  {
    position: Position.Libero,
    testType: 'sprint_505',
    professionalMin: 2.5,
    professionalElite: 2.2,
    unit: 's',
    description: '5-0-5 agility test',
  },
];
