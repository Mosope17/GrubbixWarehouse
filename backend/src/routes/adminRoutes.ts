import { Router } from 'express';
import {
  getCategories,
  deleteCategoryHandler,
  patchCategory,
  postCategory,
} from '../controllers/adminCategoryController';
import {
  deleteImageHandler,
  deleteProductHandler,
  getProduct,
  getProducts,
  patchInventory,
  patchProduct,
  postImages,
  postProduct,
} from '../controllers/adminProductController';
import { getAdminSettings, getStats, putSettings } from '../controllers/adminSettingsController';
import { requireAdmin } from '../middleware/auth';
import { uploadProductImages } from '../middleware/upload';

const router = Router();

// Every route below requires a valid Supabase token AND an admin_roles entry.
router.use(requireAdmin);

router.get('/stats', getStats);

router.get('/products', getProducts);
router.post('/products', postProduct);
router.get('/products/:id', getProduct);
router.patch('/products/:id', patchProduct);
router.delete('/products/:id', deleteProductHandler);
router.patch('/products/:id/inventory', patchInventory);
router.post('/products/:id/images', uploadProductImages, postImages);
router.delete('/products/:id/images/:imageId', deleteImageHandler);

router.get('/categories', getCategories);
router.post('/categories', postCategory);
router.patch('/categories/:id', patchCategory);
router.delete('/categories/:id', deleteCategoryHandler);

router.get('/settings', getAdminSettings);
router.put('/settings', putSettings);

export default router;
