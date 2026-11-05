import type { Request, Response } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../utils/asyncHandler';
import { listPublicCategories } from '../services/categoryService';
import {
  getPublicProductBySlug,
  listFeaturedProducts,
  listPublicProducts,
} from '../services/productService';
import { getSettings } from '../services/settingsService';
import { publicProductQuerySchema } from '../validators/product';

const slugSchema = z.string().trim().min(1).max(200);

export const getCategories = asyncHandler(async (_req: Request, res: Response) => {
  const categories = await listPublicCategories();
  res.json({ categories });
});

export const getProducts = asyncHandler(async (req: Request, res: Response) => {
  const query = publicProductQuerySchema.parse(req.query);
  const result = await listPublicProducts(query);
  res.json(result);
});

export const getFeaturedProducts = asyncHandler(async (_req: Request, res: Response) => {
  const products = await listFeaturedProducts(8);
  res.json({ products });
});

export const getProductBySlug = asyncHandler(async (req: Request, res: Response) => {
  const slug = slugSchema.parse(req.params.slug);
  const product = await getPublicProductBySlug(slug);
  res.json({ product });
});

export const getPublicSettings = asyncHandler(async (_req: Request, res: Response) => {
  const settings = await getSettings();
  res.json({ settings });
});
