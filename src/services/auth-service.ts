import { httpClient } from '../api/client';
import type { LoginCredentials, SessionUser } from '../types/auth';

export const authService = {
  signIn(input: LoginCredentials): Promise<SessionUser> {
    return httpClient.post<SessionUser>('/login', input);
  },
};
