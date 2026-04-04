import type { AthleteMatchStats, MatchEvent, CourtZoneData } from '@volleyball/types';
import { MatchEventType } from '@volleyball/types';

/**
 * Compute per-athlete match stats from raw events.
 */
export function computeAthleteMatchStats(
  athleteId: string,
  matchId: string,
  events: MatchEvent[],
): AthleteMatchStats {
  const mine = events.filter((e) => e.athleteId === athleteId);

  const count = (type: MatchEventType) =>
    mine.filter((e) => e.eventType === type).length;

  const attackAttempts = count(MatchEventType.AttackAttempt);
  const attackKills = count(MatchEventType.AttackKill);
  const attackErrors = count(MatchEventType.AttackError);
  const attackBlocked = count(MatchEventType.AttackBlocked);

  const serveAttempts = count(MatchEventType.ServeAttempt);
  const serveAces = count(MatchEventType.ServeAce);
  const serveErrors = count(MatchEventType.ServeError);
  const serveIn = count(MatchEventType.ServeIn);

  const receptions =
    count(MatchEventType.Reception0) +
    count(MatchEventType.Reception1) +
    count(MatchEventType.Reception2) +
    count(MatchEventType.Reception3);
  const receptionPerfect = count(MatchEventType.Reception3);
  const receptionPositive =
    count(MatchEventType.Reception2) + count(MatchEventType.Reception3);

  const digs = count(MatchEventType.DigSuccess);
  const digErrors = count(MatchEventType.DigError);
  const blockTouches = count(MatchEventType.BlockTouch);
  const blockKills = count(MatchEventType.BlockKill);
  const setAssists = count(MatchEventType.SetAssist);

  const killPercent = attackAttempts > 0 ? attackKills / attackAttempts : 0;
  const errorPercent = attackAttempts > 0 ? attackErrors / attackAttempts : 0;
  const attackEfficiency =
    attackAttempts > 0
      ? (attackKills - attackErrors - attackBlocked) / attackAttempts
      : 0;

  const serveEfficiency =
    serveAttempts > 0 ? (serveAces - serveErrors) / serveAttempts : 0;

  const receptionEfficiency =
    receptions > 0 ? receptionPositive / receptions : 0;

  return {
    athleteId,
    matchId,
    attackAttempts,
    attackKills,
    attackErrors,
    attackBlocked,
    killPercent,
    errorPercent,
    attackEfficiency,
    serveAttempts,
    serveAces,
    serveErrors,
    serveIn,
    serveEfficiency,
    receptions,
    receptionPerfect,
    receptionPositive,
    receptionEfficiency,
    digs,
    digErrors,
    blockTouches,
    blockKills,
    setAssists,
  };
}

/**
 * Build court zone heatmap data for attack events.
 */
export function buildCourtZoneData(events: MatchEvent[]): CourtZoneData[] {
  const attackEvents = events.filter(
    (e) =>
      e.eventType === MatchEventType.AttackAttempt ||
      e.eventType === MatchEventType.AttackKill ||
      e.eventType === MatchEventType.AttackError,
  );

  const zones = new Map<number, CourtZoneData>();
  for (let z = 1; z <= 9; z++) {
    zones.set(z, {
      zone: z,
      attackAttempts: 0,
      attackKills: 0,
      attackErrors: 0,
      efficiency: 0,
    });
  }

  for (const event of attackEvents) {
    const zone = zones.get(event.courtZone);
    if (!zone) continue;
    if (event.eventType === MatchEventType.AttackAttempt) zone.attackAttempts++;
    if (event.eventType === MatchEventType.AttackKill) zone.attackKills++;
    if (event.eventType === MatchEventType.AttackError) zone.attackErrors++;
  }

  for (const zone of zones.values()) {
    zone.efficiency =
      zone.attackAttempts > 0
        ? (zone.attackKills - zone.attackErrors) / zone.attackAttempts
        : 0;
  }

  return Array.from(zones.values());
}

/**
 * Detect statistically significant metric drops (> 1 std dev below 6-week mean).
 */
export function detectMetricDrop(values: number[]): {
  isSignificantDrop: boolean;
  mean: number;
  stdDev: number;
  latest: number;
} {
  if (values.length < 3) {
    return { isSignificantDrop: false, mean: 0, stdDev: 0, latest: values[values.length - 1] ?? 0 };
  }

  const latest = values[values.length - 1];
  const history = values.slice(0, -1);
  const mean = history.reduce((sum, v) => sum + v, 0) / history.length;
  const variance = history.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / history.length;
  const stdDev = Math.sqrt(variance);

  return {
    isSignificantDrop: latest < mean - stdDev,
    mean,
    stdDev,
    latest,
  };
}
