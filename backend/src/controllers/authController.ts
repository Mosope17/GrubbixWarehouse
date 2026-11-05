import type { Request, Response } from 'express';
import { login, refresh } from '../services/authService';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/errors';
import { loginSchema, refreshSchema } from '../validators/auth';

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

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  if (!req.admin) throw ApiError.unauthorized();
  res.json({ admin: req.admin });
});
