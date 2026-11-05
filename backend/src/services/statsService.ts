import { supabaseAdmin } from '../config/supabase';
import type { DashboardStats } from '../types/api';
import { ApiError } from '../utils/errors';

export async function getDashboardStats(): Promise<DashboardStats> {
  const [products, available, outOfStock, featured, categories, productCategories] = await Promise.all([
    supabaseAdmin.from('products').select('id', { count: 'exact', head: true }),
    supabaseAdmin
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('is_available', true)
      .gt('stock_quantity', 0),
    supabaseAdmin
      .from('products')
      .select('id', { count: 'exact', head: true })
      .or('is_available.eq.false,stock_quantity.eq.0'),
    supabaseAdmin
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('is_featured', true),
    supabaseAdmin.from('categories').select('id, name').order('sort_order', { ascending: true }),
    supabaseAdmin.from('products').select('category_id'),
  ]);

  const failure = [products, available, outOfStock, featured, categories, productCategories].find(
    (result) => result.error,
  );
  if (failure?.error) {
    throw new ApiError(502, 'DATABASE_ERROR', 'Could not load dashboard statistics.');
  }

  const counts = new Map<string, number>();
  for (const row of productCategories.data ?? []) {
    const categoryId = row.category_id as string | null;
    if (!categoryId) continue;
    counts.set(categoryId, (counts.get(categoryId) ?? 0) + 1);
  }

  return {
    totals: {
      products: products.count ?? 0,
      available: available.count ?? 0,
      outOfStock: outOfStock.count ?? 0,
      categories: categories.count ?? (categories.data?.length ?? 0),
      featured: featured.count ?? 0,
    },
    perCategory: (categories.data ?? []).map((category) => ({
      id: category.id as string,
      name: category.name as string,
      productCount: counts.get(category.id as string) ?? 0,
    })),
  };
}
