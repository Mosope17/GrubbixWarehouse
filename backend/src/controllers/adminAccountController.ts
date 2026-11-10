import type { Request, Response } from 'express';
import { deleteAdminAccount, inviteAdmin, listAdminAccounts } from '../services/adminAccountService';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/errors';
import { adminAccountIdSchema, inviteAdminSchema } from '../validators/adminAccount';

export const getAdminAccounts = asyncHandler(async (_req: Request, res: Response) => {
  res.json({ accounts: await listAdminAccounts() });
});

export const postAdminInvite = asyncHandler(async (req: Request, res: Response) => {
  const { email } = inviteAdminSchema.parse(req.body);
  await inviteAdmin(email);
  res.status(202).json({ message: 'Administrator invitation sent.' });
});

export const deleteAdminAccountHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.admin) throw ApiError.unauthorized();
  const { id } = adminAccountIdSchema.parse(req.params);
  await deleteAdminAccount(req.admin.id, id);
  res.status(204).end();
});
