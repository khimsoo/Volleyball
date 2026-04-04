import { SkillType, DrillDifficulty, TrainingPhase, Position } from './enums.js';

export interface CoachingCue {
  timestampSeconds: number;
  cueText: string;
  cueType: 'technical' | 'tactical' | 'physical' | 'mental';
}

export interface Drill {
  id: string;
  organizationId?: string; // null = system/global drill
  createdBy?: string;
  name: string;
  description: string;
  instructions: string;
  skillType: SkillType;
  positionsRelevant: Position[];
  difficulty: DrillDifficulty;
  trainingPhaseTags: TrainingPhase[];
  equipmentRequired: string[];
  videoUrl?: string;
  videoThumbnailUrl?: string;
  videoDurationSeconds?: number;
  coachingCues: CoachingCue[];
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface DrillFilters {
  skillType?: SkillType;
  position?: Position;
  difficulty?: DrillDifficulty;
  trainingPhase?: TrainingPhase;
  search?: string;
}
