import {
  CompetitionLevel,
  MatchResult,
  HomeAway,
  MatchEventType,
} from './enums.js';

export interface Match {
  id: string;
  organizationId: string;
  matchDate: string;
  opponent: string;
  competitionName: string;
  competitionLevel: CompetitionLevel;
  venue?: string;
  homeAway: HomeAway;
  setsWon: number;
  setsLost: number;
  result: MatchResult;
  notes?: string;
  events?: MatchEvent[];
  createdAt: string;
  updatedAt: string;
}

export interface MatchEvent {
  id: string;
  matchId: string;
  athleteId: string;
  eventType: MatchEventType;
  setNumber: number;
  rotationPosition: number; // 1–6
  courtZone: number; // FIVB zone 1–9
  timestampInSet?: number; // seconds from set start
  createdAt: string;
}

// ─── Computed statistics ─────────────────────────────────────────────────────

export interface AthleteMatchStats {
  athleteId: string;
  matchId: string;
  attackAttempts: number;
  attackKills: number;
  attackErrors: number;
  attackBlocked: number;
  killPercent: number;
  errorPercent: number;
  attackEfficiency: number; // (kills - errors - blocked) / attempts
  serveAttempts: number;
  serveAces: number;
  serveErrors: number;
  serveIn: number;
  serveEfficiency: number;
  receptions: number;
  receptionPerfect: number; // grade 3
  receptionPositive: number; // grade 2-3
  receptionEfficiency: number;
  digs: number;
  digErrors: number;
  blockTouches: number;
  blockKills: number;
  setAssists: number;
}

export interface TeamMatchStats {
  matchId: string;
  perAthleteStats: AthleteMatchStats[];
  attackEfficiency: number;
  receptionEfficiency: number;
  serveEfficiency: number;
  sideOutPercent: number;
}

// ─── Zone heatmap ────────────────────────────────────────────────────────────

export interface CourtZoneData {
  zone: number; // FIVB 1–9
  attackAttempts: number;
  attackKills: number;
  attackErrors: number;
  efficiency: number;
}
