import React, { createContext, useContext, useState } from 'react';

interface AuthContextType {
  accessToken: string | null;
    refreshToken: string | null;
  isAuthenticated: boolean;
  login: (accessToken: string, refreshToken: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {

  const [accessToken, setAccessToken]   = useState<string | null>(null);
   const [refreshToken, setRefreshToken] = useState<string | null>(null);


    function login(newAccessToken: string, newRefreshToken: string) {
    setAccessToken(newAccessToken)
    setRefreshToken(newRefreshToken)
  }

  // Step 3c — logout wipes both
  function logout() {
    setAccessToken(null)
    setRefreshToken(null)
  }


  return (
    // .Provider method provides the children the values that can be used
    <AuthContext.Provider value={{
      accessToken,
      refreshToken,
      isAuthenticated: !!accessToken,   // converts token to boolean
      login,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// custom hook — any component calls useAuth() to read/update auth state
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}