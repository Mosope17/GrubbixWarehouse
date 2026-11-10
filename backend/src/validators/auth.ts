import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().trim().email('Enter a valid email address.').max(200),
  password: z.string().min(1, 'Password is required.').max(200),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required.').max(4000),
});

export const requestPasswordResetSchema = z.object({
  email: z.string().trim().email('Enter a valid email address.').max(200),
});

export const confirmPasswordResetSchema = z.object({
  accessToken: z.string().min(1, 'Reset token is required.').max(8192),
  refreshToken: z.string().min(1, 'Reset token is required.').max(8192),
  password: z.string().min(8, 'Password must be at least 8 characters.').max(200),
});

export const acceptAdminInviteSchema = confirmPasswordResetSchema;
