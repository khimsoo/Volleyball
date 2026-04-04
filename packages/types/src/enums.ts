// ─── Player Position ────────────────────────────────────────────────────────

export enum Position {
  Setter = 'setter',
  Libero = 'libero',
  OutsideHitter = 'outside_hitter',
  Opposite = 'opposite',
  MiddleBlocker = 'middle_blocker',
  DefensiveSpecialist = 'defensive_specialist',
}

// ─── Experience & Roles ─────────────────────────────────────────────────────

export enum ExperienceTier {
  Developmental = 'developmental',
  Collegiate = 'collegiate',
  National = 'national',
  Professional = 'professional',
}

export enum UserRole {
  Athlete = 'athlete',
  Coach = 'coach',
  Physiotherapist = 'physiotherapist',
  Nutritionist = 'nutritionist',
  Admin = 'admin',
}

export enum SubscriptionTier {
  Trial = 'trial',
  Professional = 'professional',
  Enterprise = 'enterprise',
}

// ─── Training ────────────────────────────────────────────────────────────────

export enum TrainingPhase {
  Hypertrophy = 'hypertrophy',
  Strength = 'strength',
  Power = 'power',
  Peaking = 'peaking',
  CompetitionMaintenance = 'competition_maintenance',
  Deload = 'deload',
  General = 'general',
}

export enum SessionType {
  Strength = 'strength',
  Power = 'power',
  Technical = 'technical',
  Conditioning = 'conditioning',
  Recovery = 'recovery',
  Match = 'match',
}

export enum ProgramAssignmentStatus {
  Active = 'active',
  Paused = 'paused',
  Completed = 'completed',
  Cancelled = 'cancelled',
}

// ─── Drills ──────────────────────────────────────────────────────────────────

export enum SkillType {
  Serving = 'serving',
  Passing = 'passing',
  Setting = 'setting',
  Attacking = 'attacking',
  Blocking = 'blocking',
  Defense = 'defense',
  Conditioning = 'conditioning',
  Strength = 'strength',
  Mobility = 'mobility',
}

export enum DrillDifficulty {
  Beginner = 'beginner',
  Intermediate = 'intermediate',
  Advanced = 'advanced',
  Elite = 'elite',
}

// ─── Performance Tests ───────────────────────────────────────────────────────

export enum TestType {
  VerticalJumpStanding = 'vertical_jump_standing',
  VerticalJumpApproach = 'vertical_jump_approach',
  BlockJump = 'block_jump',
  Sprint505 = 'sprint_505',
  Shuttle535 = 'shuttle_535',
  Squat1RM = 'squat_1rm',
  HangClean1RM = 'hang_clean_1rm',
  RDL1RM = 'rdl_1rm',
  Bench1RM = 'bench_1rm',
  OverheadPress1RM = 'overhead_press_1rm',
  RSI = 'rsi',
  RFD = 'rfd',
  ServeVelocity = 'serve_velocity',
  Custom = 'custom',
}

export enum DeviceSource {
  Manual = 'manual',
  ForcePlate = 'force_plate',
  GpsVest = 'gps_vest',
  PhoneAccel = 'phone_accel',
  RadarGun = 'radar_gun',
}

// ─── Match ────────────────────────────────────────────────────────────────────

export enum CompetitionLevel {
  Practice = 'practice',
  Scrimmage = 'scrimmage',
  League = 'league',
  Cup = 'cup',
  National = 'national',
  International = 'international',
}

export enum MatchResult {
  Win = 'win',
  Loss = 'loss',
  Draw = 'draw',
}

export enum HomeAway {
  Home = 'home',
  Away = 'away',
  Neutral = 'neutral',
}

export enum MatchEventType {
  AttackAttempt = 'attack_attempt',
  AttackKill = 'attack_kill',
  AttackError = 'attack_error',
  AttackBlocked = 'attack_blocked',
  ServeAttempt = 'serve_attempt',
  ServeAce = 'serve_ace',
  ServeError = 'serve_error',
  ServeIn = 'serve_in',
  Reception0 = 'reception_0',
  Reception1 = 'reception_1',
  Reception2 = 'reception_2',
  Reception3 = 'reception_3',
  DigSuccess = 'dig_success',
  DigError = 'dig_error',
  BlockTouch = 'block_touch',
  BlockKill = 'block_kill',
  BlockError = 'block_error',
  SetAssist = 'set_assist',
}

// ─── Injury ───────────────────────────────────────────────────────────────────

export enum BodyPart {
  Ankle = 'ankle',
  Knee = 'knee',
  Shoulder = 'shoulder',
  Back = 'back',
  Hip = 'hip',
  Wrist = 'wrist',
  Finger = 'finger',
  Hamstring = 'hamstring',
  Calf = 'calf',
  Other = 'other',
}

export enum BodySide {
  Left = 'left',
  Right = 'right',
  Bilateral = 'bilateral',
}

export enum InjuryMechanism {
  Overuse = 'overuse',
  AcuteContact = 'acute_contact',
  AcuteNonContact = 'acute_non_contact',
  Unknown = 'unknown',
}

export enum InjurySeverity {
  Minor = 'minor',
  Moderate = 'moderate',
  Severe = 'severe',
}

export enum RTPStage {
  Acute = 'acute',
  Subacute = 'subacute',
  FunctionalRehab = 'functional_rehab',
  SportSpecific = 'sport_specific',
  FullClearance = 'full_clearance',
}

// ─── Recovery ────────────────────────────────────────────────────────────────

export enum RecoveryModality {
  IceBath = 'ice_bath',
  Compression = 'compression',
  Massage = 'massage',
  Stretching = 'stretching',
  Sauna = 'sauna',
  Contrast = 'contrast',
  NormothermalBath = 'normothermal_bath',
  ActiveRecovery = 'active_recovery',
}

// ─── Load Risk ────────────────────────────────────────────────────────────────

export enum LoadRisk {
  Low = 'low',
  Optimal = 'optimal',
  Caution = 'caution',
  High = 'high',
}
