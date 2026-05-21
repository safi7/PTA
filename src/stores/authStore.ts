'use client';

import { create } from 'zustand';
import type { User } from '@/lib/types';

interface AuthState {
  user: Omit<User, 'password_hash' | 'updated_at'> | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: AuthState['user']) => void;
  clearAuth: () => void;
  fetchMe: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  setUser: (user) => set({ user, isAuthenticated: !!user, isLoading: false }),

  clearAuth: () => set({ user: null, isAuthenticated: false, isLoading: false }),

  fetchMe: async () => {
    try {
      set({ isLoading: true });
      const res = await fetch('/api/auth/me');
      if (!res.ok) throw new Error('Unauthorized');
      const { data } = await res.json();
      set({ user: data, isAuthenticated: true, isLoading: false });
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
