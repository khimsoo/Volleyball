import { create } from 'zustand';
import type { TrainingSession, SessionDrillLog } from '@volleyball/types';

interface ActiveSession {
  sessionId: string;
  session: TrainingSession;
  drillLogs: SessionDrillLog[];
  startedAt: Date;
  elapsedSeconds: number;
}

interface SessionState {
  activeSession: ActiveSession | null;
  currentRpe: number;

  startSession: (sessionId: string, session: TrainingSession) => void;
  addDrillLog: (log: SessionDrillLog) => void;
  setRpe: (rpe: number) => void;
  tickElapsed: () => void;
  endSession: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  activeSession: null,
  currentRpe: 5,

  startSession: (sessionId, session) =>
    set({
      activeSession: {
        sessionId,
        session,
        drillLogs: [],
        startedAt: new Date(),
        elapsedSeconds: 0,
      },
      currentRpe: 5,
    }),

  addDrillLog: (log) =>
    set((state) => ({
      activeSession: state.activeSession
        ? {
            ...state.activeSession,
            drillLogs: [...state.activeSession.drillLogs, log],
          }
        : null,
    })),

  setRpe: (rpe) => set({ currentRpe: rpe }),

  tickElapsed: () =>
    set((state) => ({
      activeSession: state.activeSession
        ? {
            ...state.activeSession,
            elapsedSeconds: state.activeSession.elapsedSeconds + 1,
          }
        : null,
    })),

  endSession: () => set({ activeSession: null, currentRpe: 5 }),
}));
