import type { SessionUser } from '../types/auth';
import { CURRENT_USER_ID } from '../types/task';

export const DEMO_CREDENTIALS = {
  email: 'user@sprintboard.com',
  password: 'user1234',
} as const;

export const DEMO_USER: SessionUser = {
  id: CURRENT_USER_ID,
  name: 'Alex Morgan',
  email: DEMO_CREDENTIALS.email,
};
