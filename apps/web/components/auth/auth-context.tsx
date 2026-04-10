'use client';

import * as React from 'react';
import type { AuthUser, TokenResponse } from '@workspace/contracts/auth';

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
}

interface AuthContextValue extends AuthState {
  signIn: (response: TokenResponse) => void;
  signOut: () => void;
}

const AuthContext = React.createContext<AuthContextValue | null>(null);

const AUTH_STORAGE_KEY = 'library-auth-state';

function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<AuthState>(() => {
    if (typeof window === 'undefined') {
      return { user: null, accessToken: null, refreshToken: null, isAuthenticated: false };
    }
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as AuthState;
        return { ...parsed, isAuthenticated: !!parsed.accessToken };
      }
    } catch {
      // ignore parse errors
    }
    return { user: null, accessToken: null, refreshToken: null, isAuthenticated: false };
  });

  const signIn = React.useCallback((response: TokenResponse) => {
    const newState: AuthState = {
      user: response.user,
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
      isAuthenticated: true,
    };
    setState(newState);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newState));
  }, []);

  const signOut = React.useCallback(() => {
    const empty: AuthState = {
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
    };
    setState(empty);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

function useAuth(): AuthContextValue {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export { AuthProvider, useAuth };
