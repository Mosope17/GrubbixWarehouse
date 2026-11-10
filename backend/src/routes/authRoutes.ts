import { Router } from 'express';
import {
  getMe,
  postAdminInviteAcceptance,
  postLogin,
  postPasswordResetConfirmation,
  postPasswordResetRequest,
  postRefresh,
} from '../controllers/authController';
import { requireAdmin } from '../middleware/auth';
import { loginRateLimiter, passwordResetRateLimiter } from '../middleware/rateLimit';

const router = Router();

router.post('/login', loginRateLimiter, postLogin);
router.post('/refresh', postRefresh);
router.post('/password-reset', passwordResetRateLimiter, postPasswordResetRequest);
router.post('/password-reset/confirm', passwordResetRateLimiter, postPasswordResetConfirmation);
router.post('/invite/accept', passwordResetRateLimiter, postAdminInviteAcceptance);
router.get('/me', requireAdmin, getMe);

export default router;
