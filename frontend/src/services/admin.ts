import type {
  AdminSession,
  Category,
  DashboardStats,
  ManagedAdmin,
  Paginated,
  Product,
  ProductImage,
  ProductPayload,
  StoreSettings,
} from '../types';
import { apiRequest } from './http';

export type AdminProductQuery = {
  search?: string;
  categoryId?: string;
  status?: 'all' | 'available' | 'out_of_stock';
  page?: number;
  limit?: number;
};

export function login(email: string, password: string): Promise<AdminSession> {
  return apiRequest<AdminSession>('/api/auth/login', {
    method: 'POST',
    body: { email, password },
  });
}

export function requestPasswordReset(email: string): Promise<{ message: string }> {
  return apiRequest<{ message: string }>('/api/auth/password-reset', {
    method: 'POST',
    body: { email },
  });
}

export function confirmPasswordReset(
  accessToken: string,
  refreshToken: string,
  password: string,
): Promise<{ message: string }> {
  return apiRequest<{ message: string }>('/api/auth/password-reset/confirm', {
    method: 'POST',
    body: { accessToken, refreshToken, password },
  });
}

export function acceptAdminInvite(
  accessToken: string,
  refreshToken: string,
  password: string,
): Promise<{ message: string }> {
  return apiRequest<{ message: string }>('/api/auth/invite/accept', {
    method: 'POST',
    body: { accessToken, refreshToken, password },
  });
}

export async function fetchAdminAccounts(): Promise<ManagedAdmin[]> {
  const data = await apiRequest<{ accounts: ManagedAdmin[] }>('/api/admin/accounts', {
    auth: true,
  });
  return data.accounts;
}

export function inviteAdmin(email: string): Promise<{ message: string }> {
  return apiRequest<{ message: string }>('/api/admin/accounts/invites', {
    method: 'POST',
    body: { email },
    auth: true,
  });
}

export function deleteAdminAccount(id: string): Promise<void> {
  return apiRequest<void>(`/api/admin/accounts/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    auth: true,
  });
}

export async function fetchCurrentAdmin(): Promise<AdminSession['admin']> {
  const data = await apiRequest<{ admin: AdminSession['admin'] }>('/api/auth/me', { auth: true });
  return data.admin;
}

export async function fetchStats(): Promise<DashboardStats> {
  const data = await apiRequest<{ stats: DashboardStats }>('/api/admin/stats', { auth: true });
  return data.stats;
}

export function fetchAdminProducts(query: AdminProductQuery = {}): Promise<Paginated<Product>> {
  const params = new URLSearchParams();
  if (query.search) params.set('search', query.search);
  if (query.categoryId) params.set('categoryId', query.categoryId);
  if (query.status && query.status !== 'all') params.set('status', query.status);
  if (query.page) params.set('page', String(query.page));
  if (query.limit) params.set('limit', String(query.limit));

  const suffix = params.toString();
  return apiRequest<Paginated<Product>>(`/api/admin/products${suffix ? `?${suffix}` : ''}`, {
    auth: true,
  });
}

export async function fetchAdminProduct(id: string): Promise<Product> {
  const data = await apiRequest<{ product: Product }>(`/api/admin/products/${id}`, { auth: true });
  return data.product;
}

export async function createProduct(payload: ProductPayload): Promise<Product> {
  const data = await apiRequest<{ product: Product }>('/api/admin/products', {
    method: 'POST',
    body: payload,
    auth: true,
  });
  return data.product;
}

export async function updateProduct(id: string, payload: Partial<ProductPayload>): Promise<Product> {
  const data = await apiRequest<{ product: Product }>(`/api/admin/products/${id}`, {
    method: 'PATCH',
    body: payload,
    auth: true,
  });
  return data.product;
}

export async function deleteProduct(id: string): Promise<void> {
  await apiRequest<void>(`/api/admin/products/${id}`, { method: 'DELETE', auth: true });
}

export async function uploadProductImages(id: string, files: File[]): Promise<ProductImage[]> {
  const formData = new FormData();
  for (const file of files) formData.append('images', file);
  const data = await apiRequest<{ images: ProductImage[] }>(`/api/admin/products/${id}/images`, {
    method: 'POST',
    formData,
    auth: true,
  });
  return data.images;
}

export async function deleteProductImage(productId: string, imageId: string): Promise<void> {
  await apiRequest<void>(`/api/admin/products/${productId}/images/${imageId}`, {
    method: 'DELETE',
    auth: true,
  });
}

export async function fetchAdminCategories(): Promise<Category[]> {
  const data = await apiRequest<{ categories: Category[] }>('/api/admin/categories', { auth: true });
  return data.categories;
}

export async function createCategory(input: {
  name: string;
  description: string;
  sortOrder: number;
}): Promise<Category> {
  const data = await apiRequest<{ category: Category }>('/api/admin/categories', {
    method: 'POST',
    body: input,
    auth: true,
  });
  return data.category;
}

export async function updateCategory(
  id: string,
  input: { name?: string; description?: string; sortOrder?: number },
): Promise<Category> {
  const data = await apiRequest<{ category: Category }>(`/api/admin/categories/${id}`, {
    method: 'PATCH',
    body: input,
    auth: true,
  });
  return data.category;
}

export async function deleteCategory(id: string): Promise<void> {
  await apiRequest<void>(`/api/admin/categories/${id}`, { method: 'DELETE', auth: true });
}

export async function fetchAdminSettings(): Promise<StoreSettings> {
  const data = await apiRequest<{ settings: StoreSettings }>('/api/admin/settings', { auth: true });
  return data.settings;
}

export async function saveSettings(input: Partial<StoreSettings>): Promise<StoreSettings> {
  const data = await apiRequest<{ settings: StoreSettings }>('/api/admin/settings', {
    method: 'PUT',
    body: input,
    auth: true,
  });
  return data.settings;
}
