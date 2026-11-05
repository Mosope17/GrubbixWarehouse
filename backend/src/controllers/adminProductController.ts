import type { Request, Response } from 'express';
import {
  addProductImages,
  createProduct,
  deleteProduct,
  deleteProductImage,
  getAdminProduct,
  listAdminProducts,
  updateInventory,
  updateProduct,
} from '../services/productService';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/errors';
import { detectImage } from '../utils/images';
import {
  adminProductQuerySchema,
  createProductSchema,
  inventorySchema,
  updateProductSchema,
} from '../validators/product';

export const getProducts = asyncHandler(async (req: Request, res: Response) => {
  const query = adminProductQuerySchema.parse(req.query);
  const result = await listAdminProducts(query);
  res.json(result);
});

export const getProduct = asyncHandler(async (req: Request, res: Response) => {
  const product = await getAdminProduct(req.params.id);
  res.json({ product });
});

export const postProduct = asyncHandler(async (req: Request, res: Response) => {
  const input = createProductSchema.parse(req.body);
  const product = await createProduct(input);
  res.status(201).json({ product });
});

export const patchProduct = asyncHandler(async (req: Request, res: Response) => {
  const input = updateProductSchema.parse(req.body);
  const product = await updateProduct(req.params.id, input);
  res.json({ product });
});

export const deleteProductHandler = asyncHandler(async (req: Request, res: Response) => {
  await deleteProduct(req.params.id);
  res.status(204).send();
});

export const patchInventory = asyncHandler(async (req: Request, res: Response) => {
  const input = inventorySchema.parse(req.body);
  const product = await updateInventory(req.params.id, input);
  res.json({ product });
});

export const postImages = asyncHandler(async (req: Request, res: Response) => {
  const files = (req.files ?? []) as Express.Multer.File[];
  if (files.length === 0) {
    throw new ApiError(400, 'NO_FILES', 'Select at least one image to upload.');
  }

  const altText = typeof req.body?.altText === 'string' ? req.body.altText.trim().slice(0, 200) : '';

  const prepared = files.map((file) => {
    const detected = detectImage(file.buffer);
    if (!detected) {
      throw new ApiError(
        415,
        'UNSUPPORTED_IMAGE',
        'Only JPEG, PNG, WebP or AVIF images are allowed.',
      );
    }
    return {
      buffer: file.buffer,
      contentType: detected.contentType,
      extension: detected.extension,
      altText,
    };
  });

  const images = await addProductImages(req.params.id, prepared);
  res.status(201).json({ images });
});

export const deleteImageHandler = asyncHandler(async (req: Request, res: Response) => {
  await deleteProductImage(req.params.id, req.params.imageId);
  res.status(204).send();
});
