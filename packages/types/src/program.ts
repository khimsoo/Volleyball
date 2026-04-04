import { Position, TrainingPhase, SessionType, ProgramAssignmentStatus } from './enums.js';

export interface TrainingProgram {
  id: string;
  organizationId: string;
  createdBy: string;
  name: string;
  description: string;
  targetPositions: Position[];
  phase: TrainingPhase;
  durationWeeks: number;
  sessionsPerWeek: number;
  isTemplate: boolean;
  publishedAt?: string;
  weeks?: ProgramWeek[];
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface ProgramWeek {
  id: string;
  programId: string;
  weekNumber: number;
  volumeModifier: number; // 1.0 = baseline, 0.6 = deload
  intensityModifier: number;
  notes?: string;
  sessions?: ProgramSession[];
}

export interface ProgramSession {
  id: string;
  programWeekId: string;
  dayOfWeek: number; // 0=Monday … 6=Sunday
  sessionType: SessionType;
  name: string;
  estimatedDurationMinutes: number;
  sessionRpeTarget?: number; // 1–10
  drills?: ProgramSessionDrill[];
}

export interface ProgramSessionDrill {
  id: string;
  programSessionId: string;
  drillId: string;
  sequenceOrder: number;
  sets?: number;
  reps?: number;
  durationSeconds?: number;
  restSeconds?: number;
  intensityNotes?: string;
}

export interface AthleteProgramAssignment {
  id: string;
  athleteId: string;
  programId: string;
  assignedBy: string;
  startDate: string;
  endDate: string;
  status: ProgramAssignmentStatus;
  createdAt: string;
  updatedAt: string;
}

// ─── Periodization ───────────────────────────────────────────────────────────

export interface PeriodizationPlan {
  id: string;
  organizationId: string;
  season: string; // e.g. "2025-2026"
  startDate: string;
  endDate: string;
  phases: PeriodizationPhaseBlock[];
  competitionDates: CompetitionDate[];
}

export interface PeriodizationPhaseBlock {
  phase: TrainingPhase;
  startDate: string;
  endDate: string;
  targetPositions: Position[];
  notes?: string;
}

export interface CompetitionDate {
  date: string;
  name: string;
  level: string;
  taperDaysBeforeMatch: number; // default 3–5
}
