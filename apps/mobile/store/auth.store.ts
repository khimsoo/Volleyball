import { create } from 'zustand';
import type { User, AthleteProfile } from '@volleyball/types';

interface AuthState {
  user: User | null;
  athlete: AthleteProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  setAuth: (user: User, athlete: AthleteProfile | null, token: string) => void;
  clearAuth: () => void;
  setAthlete: (athlete: AthleteProfile) => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  athlete: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,

  setAuth: (user, athlete, token) =>
    set({ user, athlete, token, isAuthenticated: true, isLoading: false }),

  clearAuth: () =>
    set({ user: null, athlete: null, token: null, isAuthenticated: false, isLoading: false }),

  setAthlete: (athlete) => set({ athlete }),

  setLoading: (isLoading) => set({ isLoading }),
}));
