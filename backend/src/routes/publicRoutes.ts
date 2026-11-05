import { Router } from 'express';
import {
  getCategories,
  getFeaturedProducts,
  getProductBySlug,
  getProducts,
  getPublicSettings,
} from '../controllers/publicController';

const router = Router();

router.get('/categories', getCategories);
router.get('/products', getProducts);
router.get('/products/featured', getFeaturedProducts);
router.get('/products/:slug', getProductBySlug);
router.get('/settings', getPublicSettings);

export default router;
