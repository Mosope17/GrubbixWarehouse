import type { Request, Response } from 'express';
import { getSettings, updateSettings } from '../services/settingsService';
import { getDashboardStats } from '../services/statsService';
import { asyncHandler } from '../utils/asyncHandler';
import { updateSettingsSchema } from '../validators/settings';

export const getStats = asyncHandler(async (_req: Request, res: Response) => {
  const stats = await getDashboardStats();
  res.json({ stats });
});

export const getAdminSettings = asyncHandler(async (_req: Request, res: Response) => {
  const settings = await getSettings();
  res.json({ settings });
});

export const putSettings = asyncHandler(async (req: Request, res: Response) => {
  const input = updateSettingsSchema.parse(req.body);
  const settings = await updateSettings(input);
  res.json({ settings });
});
