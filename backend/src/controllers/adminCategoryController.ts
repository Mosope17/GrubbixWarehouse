import type { Request, Response } from 'express';
import {
  createCategory,
  deleteCategory,
  listAdminCategories,
  updateCategory,
} from '../services/categoryService';
import { asyncHandler } from '../utils/asyncHandler';
import { createCategorySchema, updateCategorySchema } from '../validators/category';

export const getCategories = asyncHandler(async (_req: Request, res: Response) => {
  const categories = await listAdminCategories();
  res.json({ categories });
});

export const postCategory = asyncHandler(async (req: Request, res: Response) => {
  const input = createCategorySchema.parse(req.body);
  const category = await createCategory(input);
  res.status(201).json({ category });
});

export const patchCategory = asyncHandler(async (req: Request, res: Response) => {
  const input = updateCategorySchema.parse(req.body);
  const category = await updateCategory(req.params.id, input);
  res.json({ category });
});

export const deleteCategoryHandler = asyncHandler(async (req: Request, res: Response) => {
  await deleteCategory(req.params.id);
  res.status(204).send();
});
