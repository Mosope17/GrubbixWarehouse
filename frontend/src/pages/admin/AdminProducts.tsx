import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Pagination from '../../components/products/Pagination';
import { useDebounce } from '../../hooks/useDebounce';
import { usePageMeta } from '../../hooks/usePageMeta';
import { deleteProduct, fetchAdminCategories, fetchAdminProducts } from '../../services/admin';
import { ApiError } from '../../services/http';
import type { Category, Paginated, Product } from '../../types';
import { formatNaira, stockLabel } from '../../utils/format';
import ConfirmDialog from '../../components/admin/ConfirmDialog';

const EMPTY_PRODUCTS: Paginated<Product> = {
  items: [],
  page: 1,
  pageSize: 20,
  total: 0,
  totalPages: 0,
};

function errorMessage(error: unknown): string {
  return error instanceof ApiError ? error.message : 'Could not load products. Check your connection.';
}

export default function AdminProducts() {
  usePageMeta('Products — Grubbix Warehouse admin');

  const [products, setProducts] = useState(EMPTY_PRODUCTS);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [status, setStatus] = useState<'all' | 'available' | 'out_of_stock'>('all');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [retryToken, setRetryToken] = useState(0);
  const [selected, setSelected] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);
  const debouncedSearch = useDebounce(search);

  useEffect(() => {
    let cancelled = false;
    fetchAdminCategories()
      .then((result) => {
        if (!cancelled) {
          setCategories(result);
          setCategoriesError(null);
        }
      })
      .catch(() => {
        if (!cancelled) setCategoriesError('Could not load categories for filtering.');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchAdminProducts({
      search: debouncedSearch.trim() || undefined,
      categoryId: categoryId || undefined,
      status,
      page,
      limit: 20,
    })
      .then((result) => {
        if (!cancelled) {
          setProducts(result);
          setError(null);
        }
      })
      .catch((caught: unknown) => {
        if (!cancelled) setError(errorMessage(caught));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedSearch, categoryId, status, page, retryToken]);

  const handleDelete = async () => {
    if (!selected) return;
    setDeleting(true);
    setError(null);
    try {
      await deleteProduct(selected.id);
      setProducts((current) => ({
        ...current,
        items: current.items.filter((product) => product.id !== selected.id),
        total: Math.max(0, current.total - 1),
      }));
      if (products.items.length === 1 && page > 1) setPage((current) => current - 1);
      setNotice(`${selected.name} was deleted.`);
      setSelected(null);
      setRetryToken((token) => token + 1);
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setDeleting(false);
    }
  };

  const resetFilters = () => {
    setSearch('');
    setCategoryId('');
    setStatus('all');
    setPage(1);
  };

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Products</h1>
          <p className="mt-1 text-sm text-neutral-600">Manage catalogue items, stock, and images.</p>
        </div>
        <Link
          to="/admin/products/new"
          className="rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark"
        >
          Add product
        </Link>
      </div>

      {error && (
        <div role="alert" className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          <span>{error}</span>
          <button type="button" onClick={() => setRetryToken((token) => token + 1)} className="font-semibold underline">
            Retry
          </button>
        </div>
      )}
      {notice && (
        <p role="status" className="mt-5 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800">
          {notice}
        </p>
      )}

      {categoriesError && <p role="alert" className="mt-5 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">{categoriesError}</p>}
      <section aria-label="Product filters" className="mt-6 grid gap-3 rounded-xl border border-neutral-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="sm:col-span-2 lg:col-span-2">
          <span className="sr-only">Search products</span>
          <input
            type="search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Search products"
            className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
        </label>
        <label>
          <span className="sr-only">Filter by category</span>
          <select
            value={categoryId}
            onChange={(event) => {
              setCategoryId(event.target.value);
              setPage(1);
            }}
            className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand"
          >
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
        </label>
        <label>
          <span className="sr-only">Filter by availability</span>
          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as typeof status);
              setPage(1);
            }}
            className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand"
          >
            <option value="all">All products</option>
            <option value="available">Available</option>
            <option value="out_of_stock">Unavailable or out of stock</option>
          </select>
        </label>
      </section>

      {loading ? (
        <p role="status" className="mt-6 text-sm text-neutral-500">Loading products…</p>
      ) : products.items.length === 0 ? (
        <div className="mt-6 rounded-xl border border-neutral-200 bg-white px-5 py-12 text-center">
          <p className="font-semibold text-ink">No products found</p>
          <p className="mt-1 text-sm text-neutral-600">
            {search || categoryId || status !== 'all'
              ? 'Try changing or clearing the filters.'
              : 'Add your first product to start building the catalogue.'}
          </p>
          {search || categoryId || status !== 'all' ? (
            <button type="button" onClick={resetFilters} className="mt-4 text-sm font-semibold text-brand hover:text-brand-dark">
              Clear filters
            </button>
          ) : (
            <Link to="/admin/products/new" className="mt-4 inline-block text-sm font-semibold text-brand hover:text-brand-dark">
              Add a product
            </Link>
          )}
        </div>
      ) : (
        <>
          <div className="mt-6 overflow-hidden rounded-xl border border-neutral-200 bg-white">
            <div className="border-b border-neutral-200 px-4 py-3 text-sm text-neutral-600">
              {products.total} {products.total === 1 ? 'product' : 'products'}
            </div>
            <ul className="divide-y divide-neutral-200">
              {products.items.map((product) => {
                const stock = stockLabel(product);
                return (
                  <li key={product.id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
                      {product.images[0] ? (
                        <img src={product.images[0].url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <span className="flex h-full items-center justify-center text-[10px] text-neutral-400">No image</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <Link to={`/admin/products/${product.id}`} className="font-semibold text-ink hover:text-brand">
                        {product.name}
                      </Link>
                      <p className="mt-1 truncate text-xs text-neutral-500">
                        {product.category?.name ?? 'Uncategorised'} · /{product.slug}
                      </p>
                    </div>
                    <div className="sm:w-36">
                      <p className="text-sm font-semibold">{formatNaira(product.priceKobo)}</p>
                      <p className="mt-1 text-xs text-neutral-500">Stock: {product.stockQuantity}</p>
                    </div>
                    <span className={`self-start rounded-full px-2.5 py-1 text-xs font-medium sm:self-center ${
                      stock.tone === 'success'
                        ? 'bg-green-50 text-green-700'
                        : stock.tone === 'warning'
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-red-50 text-red-700'
                    }`}>
                      {stock.label}
                    </span>
                    <Link to={`/admin/products/${product.id}`} className="text-sm font-semibold text-brand hover:text-brand-dark">
                      Edit
                    </Link>
                    <button
                      type="button"
                      onClick={() => setSelected(product)}
                      className="text-left text-sm font-semibold text-red-700 hover:text-red-800 sm:ml-2"
                    >
                      Delete
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
          <Pagination page={products.page} totalPages={products.totalPages} onChange={setPage} />
        </>
      )}

      <ConfirmDialog
        open={selected !== null}
        title="Delete product?"
        description={selected ? `Permanently delete "${selected.name}" and its image records? This cannot be undone.` : undefined}
        confirmLabel="Delete product"
        busy={deleting}
        onConfirm={handleDelete}
        onCancel={() => setSelected(null)}
      />
    </div>
  );
}
