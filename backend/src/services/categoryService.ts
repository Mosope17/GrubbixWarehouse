import { supabaseAdmin, supabasePublic } from '../config/supabase';
import type { CategoryDto, CategoryRow } from '../types/api';
import { ApiError } from '../utils/errors';
import { slugify } from '../utils/text';

const CATEGORY_SELECT = 'id, name, slug, description, sort_order, products(count)';

function toDto(row: CategoryRow): CategoryDto {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description ?? '',
    sortOrder: row.sort_order,
    productCount: row.products?.[0]?.count ?? 0,
  };
}

export async function listPublicCategories(): Promise<CategoryDto[]> {
  const { data, error } = await supabasePublic
    .from('categories')
    .select(CATEGORY_SELECT)
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });

  if (error) throw new ApiError(502, 'DATABASE_ERROR', 'Could not load categories.');
  return ((data ?? []) as unknown as CategoryRow[]).map(toDto);
}

export async function listAdminCategories(): Promise<CategoryDto[]> {
  const { data, error } = await supabaseAdmin
    .from('categories')
    .select(CATEGORY_SELECT)
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });

  if (error) throw new ApiError(502, 'DATABASE_ERROR', 'Could not load categories.');
  return ((data ?? []) as unknown as CategoryRow[]).map(toDto);
}

export async function findCategoryBySlug(slug: string) {
  const { data, error } = await supabasePublic
    .from('categories')
    .select('id, name, slug')
    .eq('slug', slug)
    .maybeSingle();

  if (error) throw new ApiError(502, 'DATABASE_ERROR', 'Could not load category.');
  return data as { id: string; name: string; slug: string } | null;
}

async function uniqueCategorySlug(name: string, excludeId?: string): Promise<string> {
  const base = slugify(name) || 'category';

  for (let attempt = 1; attempt <= 50; attempt += 1) {
    const candidate = attempt === 1 ? base : `${base}-${attempt}`;
    const { data, error } = await supabaseAdmin
      .from('categories')
      .select('id')
      .eq('slug', candidate)
      .maybeSingle();

    if (error) throw new ApiError(502, 'DATABASE_ERROR', 'Could not check category slug.');
    if (!data || data.id === excludeId) return candidate;
  }

  throw new ApiError(409, 'SLUG_CONFLICT', 'Could not generate a unique category slug.');
}

export async function createCategory(input: {
  name: string;
  description: string;
  sortOrder: number;
}): Promise<CategoryDto> {
  const slug = await uniqueCategorySlug(input.name);

  const { data, error } = await supabaseAdmin
    .from('categories')
    .insert({ name: input.name, slug, description: input.description, sort_order: input.sortOrder })
    .select(CATEGORY_SELECT)
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new ApiError(409, 'CATEGORY_EXISTS', 'A category with this name already exists.');
    }
    throw new ApiError(502, 'DATABASE_ERROR', 'Could not create category.');
  }

  return toDto(data as unknown as CategoryRow);
}

export async function updateCategory(
  id: string,
  input: { name?: string; description?: string; sortOrder?: number },
): Promise<CategoryDto> {
  const { data: existing, error: lookupError } = await supabaseAdmin
    .from('categories')
    .select('id, name')
    .eq('id', id)
    .maybeSingle();

  if (lookupError) throw new ApiError(502, 'DATABASE_ERROR', 'Could not load category.');
  if (!existing) throw ApiError.notFound('Category not found.');

  const patch: Record<string, unknown> = {};
  if (input.name !== undefined && input.name !== existing.name) {
    patch.name = input.name;
    patch.slug = await uniqueCategorySlug(input.name, id);
  }
  if (input.description !== undefined) patch.description = input.description;
  if (input.sortOrder !== undefined) patch.sort_order = input.sortOrder;

  if (Object.keys(patch).length === 0) {
    const { data } = await supabaseAdmin
      .from('categories')
      .select(CATEGORY_SELECT)
      .eq('id', id)
      .single();
    return toDto(data as unknown as CategoryRow);
  }

  const { data, error } = await supabaseAdmin
    .from('categories')
    .update(patch)
    .eq('id', id)
    .select(CATEGORY_SELECT)
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new ApiError(409, 'CATEGORY_EXISTS', 'A category with this name already exists.');
    }
    throw new ApiError(502, 'DATABASE_ERROR', 'Could not update category.');
  }

  return toDto(data as unknown as CategoryRow);
}

export async function deleteCategory(id: string): Promise<void> {
  const { data: existing, error: lookupError } = await supabaseAdmin
    .from('categories')
    .select('id')
    .eq('id', id)
    .maybeSingle();

  if (lookupError) throw new ApiError(502, 'DATABASE_ERROR', 'Could not load category.');
  if (!existing) throw ApiError.notFound('Category not found.');

  const { count, error: countError } = await supabaseAdmin
    .from('products')
    .select('id', { count: 'exact', head: true })
    .eq('category_id', id);

  if (countError) throw new ApiError(502, 'DATABASE_ERROR', 'Could not check category products.');
  if ((count ?? 0) > 0) {
    throw new ApiError(
      409,
      'CATEGORY_IN_USE',
      'This category still has products. Move them to another category first.',
    );
  }

  const { error } = await supabaseAdmin.from('categories').delete().eq('id', id);
  if (error) throw new ApiError(502, 'DATABASE_ERROR', 'Could not delete category.');
}
