import type { Request, Response } from 'express';
import {
  acceptAdminInvite,
  completePasswordReset,
  login,
  refresh,
  requestPasswordReset,
} from '../services/authService';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/errors';
import {
  confirmPasswordResetSchema,
  acceptAdminInviteSchema,
  loginSchema,
  refreshSchema,
  requestPasswordResetSchema,
} from '../validators/auth';

export const postLogin = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = loginSchema.parse(req.body);
  const session = await login(email, password);
  res.json(session);
});

export const postRefresh = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = refreshSchema.parse(req.body);
  const session = await refresh(refreshToken);
  res.json(session);
});

export const postPasswordResetRequest = asyncHandler(async (req: Request, res: Response) => {
  const { email } = requestPasswordResetSchema.parse(req.body);
  await requestPasswordReset(email);
  res.json({
    message: 'If an account exists for that email, a password reset link has been sent.',
  });
});

export const postPasswordResetConfirmation = asyncHandler(async (req: Request, res: Response) => {
  const { accessToken, refreshToken, password } = confirmPasswordResetSchema.parse(req.body);
  await completePasswordReset(accessToken, refreshToken, password);
  res.json({ message: 'Your password has been updated. You can now sign in.' });
});

export const postAdminInviteAcceptance = asyncHandler(async (req: Request, res: Response) => {
  const { accessToken, refreshToken, password } = acceptAdminInviteSchema.parse(req.body);
  await acceptAdminInvite(accessToken, refreshToken, password);
  res.json({ message: 'Your administrator account is ready. You can now sign in.' });
});

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  if (!req.admin) throw ApiError.unauthorized();
  res.json({ admin: req.admin });
});
