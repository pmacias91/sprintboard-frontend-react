import { useCallback, useSyncExternalStore, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { authService } from '../../services/auth-service';
import { sessionStore } from '../../lib/session';
import type { LoginInput } from '../../types/auth';
import { AuthContext } from './auth-context';

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const subscribe = useCallback(
    (onChange: () => void) => {
      let userId = sessionStore.getSnapshot()?.id;

      return sessionStore.subscribe(() => {
        const nextUserId = sessionStore.getSnapshot()?.id;

        if (nextUserId !== userId) {
          queryClient.clear();
          userId = nextUserId;
        }

        onChange();
      });
    },
    [queryClient],
  );
  const user = useSyncExternalStore(subscribe, sessionStore.getSnapshot, () => null);

  async function signIn(input: LoginInput): Promise<void> {
    const { rememberMe, ...credentials } = input;
    const authenticatedUser = await authService.signIn(credentials);

    try {
      sessionStore.save(authenticatedUser, rememberMe);
    } catch {
      throw new Error(
        'Your browser couldn’t save this demo session. Allow browser storage and try again.',
      );
    }
  }

  function signOut(): void {
    sessionStore.clear();
  }

  return (
    <AuthContext.Provider value={{ user, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
