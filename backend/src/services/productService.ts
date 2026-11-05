import { randomUUID } from 'node:crypto';
import { supabaseAdmin, supabasePublic } from '../config/supabase';
import type { Paginated, ProductDto, ProductImageDto, ProductRow } from '../types/api';
import { ApiError } from '../utils/errors';
import { escapeLike, slugify } from '../utils/text';
import type { createProductSchema, updateProductSchema } from '../validators/product';
import type { z } from 'zod';
import { findCategoryBySlug } from './categoryService';
import { publicImageUrl, removeObjects, uploadObject } from './storageService';

type CreateProductInput = z.infer<typeof createProductSchema>;
type UpdateProductInput = z.infer<typeof updateProductSchema>;

const PRODUCT_SELECT =
  'id, name, slug, description, price_kobo, specifications, stock_quantity, is_available, is_featured, created_at, updated_at, category:categories ( id, name, slug ), images:product_images ( id, storage_path, alt_text, sort_order )';

export function toProductDto(row: ProductRow): ProductDto {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description ?? '',
    priceKobo: Number(row.price_kobo),
    specifications: row.specifications ?? {},
    stockQuantity: row.stock_quantity,
    isAvailable: row.is_available,
    isFeatured: row.is_featured,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    category: row.category ?? null,
    images: [...(row.images ?? [])]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((image) => ({
        id: image.id,
        url: publicImageUrl(image.storage_path),
        altText: image.alt_text,
        sortOrder: image.sort_order,
      })),
  };
}

function toPage(items: ProductDto[], total: number, page: number, pageSize: number): Paginated<ProductDto> {
  return {
    items,
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
  };
}

async function uniqueProductSlug(name: string, excludeId?: string): Promise<string> {
  const base = slugify(name) || 'product';

  for (let attempt = 1; attempt <= 50; attempt += 1) {
    const candidate = attempt === 1 ? base : `${base}-${attempt}`;
    const { data, error } = await supabaseAdmin
      .from('products')
      .select('id')
      .eq('slug', candidate)
      .maybeSingle();

    if (error) throw new ApiError(502, 'DATABASE_ERROR', 'Could not check product slug.');
    if (!data || data.id === excludeId) return candidate;
  }

  throw new ApiError(409, 'SLUG_CONFLICT', 'Could not generate a unique product slug.');
}

export async function listPublicProducts(params: {
  search?: string;
  category?: string;
  sort: 'newest' | 'price_asc' | 'price_desc';
  page: number;
  limit: number;
}): Promise<Paginated<ProductDto>> {
  const pageSize = params.limit;
  const offset = (params.page - 1) * pageSize;

  let query = supabasePublic
    .from('products')
    .select(PRODUCT_SELECT, { count: 'exact' })
    .eq('is_available', true)
    .gt('stock_quantity', 0);

  if (params.search) {
    query = query.ilike('name', `%${escapeLike(params.search)}%`);
  }

  if (params.category) {
    const category = await findCategoryBySlug(params.category);
    if (!category) return toPage([], 0, params.page, pageSize);
    query = query.eq('category_id', category.id);
  }

  if (params.sort === 'price_asc') {
    query = query.order('price_kobo', { ascending: true });
  } else if (params.sort === 'price_desc') {
    query = query.order('price_kobo', { ascending: false });
  }

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (error) throw new ApiError(502, 'DATABASE_ERROR', 'Could not load products.');

  const rows = (data ?? []) as unknown as ProductRow[];
  return toPage(rows.map(toProductDto), count ?? rows.length, params.page, pageSize);
}

export async function getPublicProductBySlug(slug: string): Promise<ProductDto> {
  const { data, error } = await supabasePublic
    .from('products')
    .select(PRODUCT_SELECT)
    .eq('slug', slug)
    .maybeSingle();

  if (error) throw new ApiError(502, 'DATABASE_ERROR', 'Could not load product.');
  if (!data) throw ApiError.notFound('Product not found.');
  return toProductDto(data as unknown as ProductRow);
}

export async function listFeaturedProducts(limit = 8): Promise<ProductDto[]> {
  const { data, error } = await supabasePublic
    .from('products')
    .select(PRODUCT_SELECT)
    .eq('is_featured', true)
    .eq('is_available', true)
    .gt('stock_quantity', 0)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw new ApiError(502, 'DATABASE_ERROR', 'Could not load featured products.');
  return ((data ?? []) as unknown as ProductRow[]).map(toProductDto);
}

export async function listAdminProducts(params: {
  search?: string;
  categoryId?: string;
  status: 'all' | 'available' | 'out_of_stock';
  page: number;
  limit: number;
}): Promise<Paginated<ProductDto>> {
  const pageSize = params.limit;
  const offset = (params.page - 1) * pageSize;

  let query = supabaseAdmin.from('products').select(PRODUCT_SELECT, { count: 'exact' });

  if (params.search) {
    query = query.ilike('name', `%${escapeLike(params.search)}%`);
  }
  if (params.categoryId) {
    query = query.eq('category_id', params.categoryId);
  }
  if (params.status === 'available') {
    query = query.eq('is_available', true).gt('stock_quantity', 0);
  } else if (params.status === 'out_of_stock') {
    query = query.or('is_available.eq.false,stock_quantity.eq.0');
  }

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (error) throw new ApiError(502, 'DATABASE_ERROR', 'Could not load products.');

  const rows = (data ?? []) as unknown as ProductRow[];
  return toPage(rows.map(toProductDto), count ?? rows.length, params.page, pageSize);
}

export async function getAdminProduct(id: string): Promise<ProductDto> {
  const { data, error } = await supabaseAdmin
    .from('products')
    .select(PRODUCT_SELECT)
    .eq('id', id)
    .maybeSingle();

  if (error) throw new ApiError(502, 'DATABASE_ERROR', 'Could not load product.');
  if (!data) throw ApiError.notFound('Product not found.');
  return toProductDto(data as unknown as ProductRow);
}

export async function createProduct(input: CreateProductInput): Promise<ProductDto> {
  const slug = await uniqueProductSlug(input.name);

  const { data, error } = await supabaseAdmin
    .from('products')
    .insert({
      name: input.name,
      slug,
      description: input.description,
      category_id: input.categoryId,
      price_kobo: input.priceKobo,
      specifications: input.specifications,
      stock_quantity: input.stockQuantity,
      is_available: input.isAvailable,
      is_featured: input.isFeatured,
    })
    .select(PRODUCT_SELECT)
    .single();

  if (error) {
    if (error.code === '23503') {
      throw new ApiError(400, 'INVALID_CATEGORY', 'The selected category does not exist.');
    }
    throw new ApiError(502, 'DATABASE_ERROR', 'Could not create product.');
  }

  return toProductDto(data as unknown as ProductRow);
}

export async function updateProduct(id: string, input: UpdateProductInput): Promise<ProductDto> {
  const { data: existing, error: lookupError } = await supabaseAdmin
    .from('products')
    .select('id, name')
    .eq('id', id)
    .maybeSingle();

  if (lookupError) throw new ApiError(502, 'DATABASE_ERROR', 'Could not load product.');
  if (!existing) throw ApiError.notFound('Product not found.');

  const patch: Record<string, unknown> = {};

  if (input.name !== undefined) {
    patch.name = input.name;
    if (input.name !== existing.name) {
      patch.slug = await uniqueProductSlug(input.name, id);
    }
  }
  if (input.description !== undefined) patch.description = input.description;
  if (input.categoryId !== undefined) patch.category_id = input.categoryId;
  if (input.priceKobo !== undefined) patch.price_kobo = input.priceKobo;
  if (input.specifications !== undefined) patch.specifications = input.specifications;
  if (input.stockQuantity !== undefined) patch.stock_quantity = input.stockQuantity;
  if (input.isAvailable !== undefined) patch.is_available = input.isAvailable;
  if (input.isFeatured !== undefined) patch.is_featured = input.isFeatured;

  if (Object.keys(patch).length === 0) return getAdminProduct(id);

  const { data, error } = await supabaseAdmin
    .from('products')
    .update(patch)
    .eq('id', id)
    .select(PRODUCT_SELECT)
    .single();

  if (error) {
    if (error.code === '23503') {
      throw new ApiError(400, 'INVALID_CATEGORY', 'The selected category does not exist.');
    }
    throw new ApiError(502, 'DATABASE_ERROR', 'Could not update product.');
  }

  return toProductDto(data as unknown as ProductRow);
}

export async function deleteProduct(id: string): Promise<void> {
  const { data: product, error: lookupError } = await supabaseAdmin
    .from('products')
    .select('id')
    .eq('id', id)
    .maybeSingle();

  if (lookupError) throw new ApiError(502, 'DATABASE_ERROR', 'Could not load product.');
  if (!product) throw ApiError.notFound('Product not found.');

  const { data: images } = await supabaseAdmin
    .from('product_images')
    .select('storage_path')
    .eq('product_id', id);

  const paths = (images ?? []).map((image) => image.storage_path as string);
  await removeObjects(paths);

  const { error } = await supabaseAdmin.from('products').delete().eq('id', id);
  if (error) throw new ApiError(502, 'DATABASE_ERROR', 'Could not delete product.');
}

export async function updateInventory(
  id: string,
  input: { stockQuantity: number; isAvailable: boolean },
): Promise<ProductDto> {
  return updateProduct(id, {
    stockQuantity: input.stockQuantity,
    isAvailable: input.isAvailable,
  });
}

export async function addProductImages(
  productId: string,
  files: Array<{ buffer: Buffer; contentType: string; extension: string; altText: string }>,
): Promise<ProductImageDto[]> {
  await getAdminProduct(productId);

  const { data: lastImage } = await supabaseAdmin
    .from('product_images')
    .select('sort_order')
    .eq('product_id', productId)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle();

  let nextSortOrder = (lastImage?.sort_order ?? -1) + 1;
  const uploadedPaths: string[] = [];

  try {
    const rows: Array<Record<string, unknown>> = [];

    for (const file of files) {
      const path = `${productId}/${Date.now()}-${randomUUID()}.${file.extension}`;
      await uploadObject(path, file.buffer, file.contentType);
      uploadedPaths.push(path);

      rows.push({
        product_id: productId,
        storage_path: path,
        alt_text: file.altText,
        sort_order: nextSortOrder,
      });
      nextSortOrder += 1;
    }

    const { data, error } = await supabaseAdmin
      .from('product_images')
      .insert(rows)
      .select('id, storage_path, alt_text, sort_order');

    if (error) throw new ApiError(502, 'DATABASE_ERROR', 'Could not save image details.');

    return (data ?? []).map((image) => ({
      id: image.id as string,
      url: publicImageUrl(image.storage_path as string),
      altText: image.alt_text as string,
      sortOrder: image.sort_order as number,
    }));
  } catch (error) {
    // Roll back any objects uploaded during this request.
    if (uploadedPaths.length > 0) await removeObjects(uploadedPaths);
    throw error;
  }
}

export async function deleteProductImage(productId: string, imageId: string): Promise<void> {
  const { data: image, error: lookupError } = await supabaseAdmin
    .from('product_images')
    .select('id, storage_path')
    .eq('id', imageId)
    .eq('product_id', productId)
    .maybeSingle();

  if (lookupError) throw new ApiError(502, 'DATABASE_ERROR', 'Could not load image.');
  if (!image) throw ApiError.notFound('Image not found.');

  await removeObjects([image.storage_path as string]);

  const { error } = await supabaseAdmin
    .from('product_images')
    .delete()
    .eq('id', imageId)
    .eq('product_id', productId);

  if (error) throw new ApiError(502, 'DATABASE_ERROR', 'Could not delete image.');
}
