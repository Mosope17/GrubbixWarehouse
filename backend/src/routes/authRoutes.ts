import { Router } from 'express';
import { getMe, postLogin, postRefresh } from '../controllers/authController';
import { requireAdmin } from '../middleware/auth';
import { loginRateLimiter } from '../middleware/rateLimit';

const router = Router();

router.post('/login', loginRateLimiter, postLogin);
router.post('/refresh', postRefresh);
router.get('/me', requireAdmin, getMe);

export default router;
