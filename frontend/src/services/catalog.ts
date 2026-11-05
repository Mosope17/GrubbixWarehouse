import type { Category, Paginated, Product, StoreSettings } from '../types';
import { apiRequest } from './http';

export type ProductQuery = {
  search?: string;
  category?: string;
  sort?: 'newest' | 'price_asc' | 'price_desc';
  page?: number;
  limit?: number;
};

export async function fetchProducts(query: ProductQuery = {}): Promise<Paginated<Product>> {
  const params = new URLSearchParams();
  if (query.search) params.set('search', query.search);
  if (query.category) params.set('category', query.category);
  if (query.sort) params.set('sort', query.sort);
  if (query.page) params.set('page', String(query.page));
  if (query.limit) params.set('limit', String(query.limit));

  const suffix = params.toString();
  return apiRequest<Paginated<Product>>(`/api/products${suffix ? `?${suffix}` : ''}`);
}

export async function fetchFeaturedProducts(): Promise<Product[]> {
  const data = await apiRequest<{ products: Product[] }>('/api/products/featured');
  return data.products;
}

export async function fetchProduct(slug: string): Promise<Product> {
  const data = await apiRequest<{ product: Product }>(`/api/products/${encodeURIComponent(slug)}`);
  return data.product;
}

export async function fetchCategories(): Promise<Category[]> {
  const data = await apiRequest<{ categories: Category[] }>('/api/categories');
  return data.categories;
}

export async function fetchSettings(): Promise<StoreSettings> {
  const data = await apiRequest<{ settings: StoreSettings }>('/api/settings');
  return data.settings;
}
