export type AdminUser = {
  id: string;
  email: string;
  role: string;
};

export type CategoryDto = {
  id: string;
  name: string;
  slug: string;
  description: string;
  sortOrder: number;
  productCount: number;
};

export type ProductImageDto = {
  id: string;
  url: string;
  altText: string;
  sortOrder: number;
};

export type ProductDto = {
  id: string;
  name: string;
  slug: string;
  description: string;
  priceKobo: number;
  specifications: Record<string, string>;
  stockQuantity: number;
  isAvailable: boolean;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
  category: { id: string; name: string; slug: string } | null;
  images: ProductImageDto[];
};

export type Paginated<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type DashboardStats = {
  totals: {
    products: number;
    available: number;
    outOfStock: number;
    categories: number;
    featured: number;
  };
  perCategory: Array<{ id: string; name: string; productCount: number }>;
};

export type ProductRow = {
  id: string;
  name: string;
  slug: string;
  description: string;
  price_kobo: number;
  specifications: Record<string, string> | null;
  stock_quantity: number;
  is_available: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
  category: { id: string; name: string; slug: string } | null;
  images: Array<{
    id: string;
    storage_path: string;
    alt_text: string;
    sort_order: number;
  }> | null;
};

export type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  description: string;
  sort_order: number;
  products?: Array<{ count: number }> | null;
};
