import { createContext, useContext } from 'react';
import type { LoginInput, SessionUser } from '../../types/auth';

interface AuthContextValue {
  user: SessionUser | null;
  signIn: (input: LoginInput) => Promise<void>;
  signOut: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider.');
  }

  return context;
}
