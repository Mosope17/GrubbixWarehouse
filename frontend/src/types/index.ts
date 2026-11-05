export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string;
  sortOrder: number;
  productCount: number;
};

export type ProductImage = {
  id: string;
  url: string;
  altText: string;
  sortOrder: number;
};

export type Product = {
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
  images: ProductImage[];
};

export type Paginated<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type AdminUser = {
  id: string;
  email: string;
  role: string;
};

export type AdminSession = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  admin: AdminUser;
};

export type StoreSettings = {
  business_name: string;
  whatsapp_number: string;
  phone_number: string;
  contact_email: string;
  address: string;
  instagram_url: string;
  facebook_url: string;
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

export type ProductPayload = {
  name: string;
  description: string;
  categoryId: string | null;
  priceKobo: number;
  specifications: Record<string, string>;
  stockQuantity: number;
  isAvailable: boolean;
  isFeatured: boolean;
};
