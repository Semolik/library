'use client';

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { AuthUser, TokenResponse } from '@workspace/contracts/auth';

export interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
}

interface AuthContextValue extends AuthState {
  signIn: (payload: TokenResponse) => void;
  signOut: () => void;
}

const AUTH_STORAGE_KEY = 'library-auth-state';

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function loadInitialState(): AuthState {
  if (typeof window === 'undefined') {
    return {
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
    };
  }

  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) {
      return {
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
      };
    }

    const parsed = JSON.parse(raw) as Partial<AuthState>;
    return {
      user: parsed.user ?? null,
      accessToken: parsed.accessToken ?? null,
      refreshToken: parsed.refreshToken ?? null,
      isAuthenticated: Boolean(parsed.accessToken && parsed.user),
    };
  } catch {
    return {
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
    };
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>(loadInitialState);

  const persistState = useCallback((nextState: AuthState) => {
    setState(nextState);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextState));
    }
  }, []);

  const signIn = useCallback((payload: TokenResponse) => {
    persistState({
      user: payload.user,
      accessToken: payload.accessToken,
      refreshToken: payload.refreshToken,
      isAuthenticated: true,
    });
  }, [persistState]);

  const signOut = useCallback(() => {
    const nextState: AuthState = {
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
    };
    persistState(nextState);
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }, [persistState]);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      signIn,
      signOut,
    }),
    [signIn, signOut, state],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}

