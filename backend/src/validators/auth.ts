import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().trim().email('Enter a valid email address.').max(200),
  password: z.string().min(1, 'Password is required.').max(200),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required.').max(4000),
});
