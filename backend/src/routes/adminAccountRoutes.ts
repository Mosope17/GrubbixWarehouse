import { Router } from 'express';
import {
  deleteAdminAccountHandler,
  getAdminAccounts,
  postAdminInvite,
} from '../controllers/adminAccountController';
import { requireOwner } from '../middleware/auth';
import { adminInviteRateLimiter } from '../middleware/rateLimit';

const router = Router();

router.use(requireOwner);
router.get('/', getAdminAccounts);
router.post('/invites', adminInviteRateLimiter, postAdminInvite);
router.delete('/:id', deleteAdminAccountHandler);

export default router;
