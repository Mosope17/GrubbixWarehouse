import { z } from 'zod';

export const publicProductQuerySchema = z.object({
  search: z.string().trim().max(120).optional(),
  category: z.string().trim().max(120).optional(),
  sort: z.enum(['newest', 'price_asc', 'price_desc']).default('newest'),
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  limit: z.coerce.number().int().min(1).max(48).default(12),
});

const priceKobo = z
  .number()
  .int('Price must be a whole number of kobo.')
  .min(0)
  .max(1_000_000_000_00);

const name = z.string().trim().min(2, 'Product name is too short.').max(160);
const description = z.string().max(4000);
const categoryId = z.string().uuid('Select a valid category.').nullable();
const specifications = z.record(
  z.string().trim().min(1).max(80),
  z.string().trim().max(300),
);
const stockQuantity = z.number().int().min(0).max(1_000_000);

export const createProductSchema = z.object({
  name,
  description: description.default(''),
  categoryId: categoryId.default(null),
  priceKobo,
  specifications: specifications.default({}),
  stockQuantity: stockQuantity.default(0),
  isAvailable: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
});

export const updateProductSchema = z.object({
  name: name.optional(),
  description: description.optional(),
  categoryId: categoryId.optional(),
  priceKobo: priceKobo.optional(),
  specifications: specifications.optional(),
  stockQuantity: stockQuantity.optional(),
  isAvailable: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
});

export const inventorySchema = z.object({
  stockQuantity,
  isAvailable: z.boolean(),
});

export const adminProductQuerySchema = z.object({
  search: z.string().trim().max(120).optional(),
  categoryId: z.string().uuid().optional(),
  status: z.enum(['all', 'available', 'out_of_stock']).default('all'),
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const uploadImagesMetaSchema = z.object({
  altText: z.string().trim().max(200).optional(),
});
