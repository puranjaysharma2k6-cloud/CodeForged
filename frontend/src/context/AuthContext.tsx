import React, {createContext,useCallback,useContext,useEffect, useState} from 'react';

const TOKEN_KEY    = 'token';
const REFRESH_KEY  = 'refreshToken';

// Module-level helpers — safe to call from loaders and non-React code


/**
 * Read the current access token without going through a hook.
 * Loaders, interceptors, and other non-component code should use this
 * instead of touching localStorage directly.  Because AuthContext is the
 * only writer, this is always in sync with the React state.
 */

export function getAccessToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * if fetchwithAuth force a logout 
 */

let _triggerLogout: (() => void) | null = null;

export function triggerLogout(): void {
  _triggerLogout?.();
}

// Context

interface AuthContextType {
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  login: (accessToken: string, refreshToken: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Lazy initialize — read localstor once on mount so React state and storage are in sync from the very first render. 

  const [accessToken,  setAccessToken]  = useState<string | null>(
    () => localStorage.getItem(TOKEN_KEY)
  );
  const [refreshToken, setRefreshToken] = useState<string | null>(
    () => localStorage.getItem(REFRESH_KEY)
  );

  // useCallback keeps the reference stable so the effect below only runs once. simply means that logout function will not change on every render
  const logout = useCallback(() => { 
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    setAccessToken(null);
    setRefreshToken(null);
  }, []);

  // Register logout so fetchwithAuth can call it without a DOM event.
  useEffect(() => {
    _triggerLogout = logout;
    return () => { _triggerLogout = null; };
  }, [logout]);

  function login(newAccessToken: string, newRefreshToken: string) {
    localStorage.setItem(TOKEN_KEY,   newAccessToken);
    localStorage.setItem(REFRESH_KEY, newRefreshToken);
    setAccessToken(newAccessToken);
    setRefreshToken(newRefreshToken);
  }

  return (
    <AuthContext.Provider value={{
      accessToken,
      refreshToken,
      isAuthenticated: !!accessToken,
      login,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}