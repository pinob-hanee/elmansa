import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface UserProfile {
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  grade?: string;
  school?: string;
  city?: string;
  language: string;
  darkMode: boolean;
  xp?: number;
  level?: number;
  currentStreak?: number;
}

export interface AuthUser {
  id: string;
  email: string;
  role: 'SUPER_ADMIN' | 'TEACHER' | 'STUDENT' | 'MODERATOR';
  isEmailVerified: boolean;
  profile?: UserProfile;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  setAccessToken: (token: string) => void;
  setUser: (user: AuthUser) => void;
  login: (user: AuthUser, accessToken: string) => void;
  logout: () => void;
  updateProfile: (profile: Partial<UserProfile>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,

      setAccessToken: (token) => set({ accessToken: token }),
      setUser: (user) => set({ user, isAuthenticated: true }),

      login: (user, accessToken) =>
        set({ user, accessToken, isAuthenticated: true }),

      logout: () =>
        set({ user: null, accessToken: null, isAuthenticated: false }),

      updateProfile: (profile) => {
        const current = get().user;
        if (!current) return;
        set({
          user: {
            ...current,
            profile: { ...current.profile, ...profile } as UserProfile,
          },
        });
      },
    }),
    {
      name: 'elmansa-auth',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({ 
        user: state.user, 
        isAuthenticated: state.isAuthenticated,
        accessToken: state.accessToken 
      }),
    }
  )
);
