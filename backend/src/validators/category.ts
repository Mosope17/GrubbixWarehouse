import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string().trim().min(2, 'Category name is too short.').max(80),
  description: z.string().trim().max(500).default(''),
  sortOrder: z.number().int().min(0).max(9999).default(0),
});

export const updateCategorySchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  description: z.string().trim().max(500).optional(),
  sortOrder: z.number().int().min(0).max(9999).optional(),
});
