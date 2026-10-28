import { z } from 'zod';

export const loginCredentialsSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address.'),
  password: z.string().min(1, 'Enter your password.'),
});

export const loginSchema = loginCredentialsSchema.extend({
  rememberMe: z.boolean(),
});

export const sessionUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type LoginCredentials = z.infer<typeof loginCredentialsSchema>;
export type SessionUser = z.infer<typeof sessionUserSchema>;
