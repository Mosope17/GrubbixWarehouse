import { Router } from 'express';
import adminRoutes from './adminRoutes';
import authRoutes from './authRoutes';
import publicRoutes from './publicRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use(publicRoutes);

export default router;
