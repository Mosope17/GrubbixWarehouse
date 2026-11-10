import { z } from 'zod';

export const inviteAdminSchema = z.object({
  email: z.string().trim().email('Enter a valid email address.').max(200),
});

export const adminAccountIdSchema = z.object({
  id: z.string().uuid('Invalid administrator account id.'),
});
