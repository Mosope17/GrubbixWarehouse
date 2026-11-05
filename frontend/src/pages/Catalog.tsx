import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Pagination from '../components/products/Pagination';
import ProductCard from '../components/products/ProductCard';
import { useDebounce } from '../hooks/useDebounce';
import { usePageMeta } from '../hooks/usePageMeta';
import { fetchCategories, fetchProducts } from '../services/catalog';
import type { Category, Paginated, Product } from '../types';

type SortValue = 'newest' | 'price_asc' | 'price_desc';

const SORT_OPTIONS: Array<{ value: SortValue; label: string }> = [
  { value: 'newest', label: 'Newest arrivals' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
];

export default function Catalog() {
  usePageMeta(
    'Catalogue — Grubbix Warehouse',
    'Browse kitchenware and catering equipment by category, search by name and compare prices in naira.',
  );

  const [searchParams, setSearchParams] = useSearchParams();

  const search = searchParams.get('search') ?? '';
  const category = searchParams.get('category') ?? '';
  const rawSort = searchParams.get('sort') ?? 'newest';
  const sort: SortValue =
    rawSort === 'price_asc' || rawSort === 'price_desc' ? rawSort : 'newest';
  const page = Math.max(1, Number(searchParams.get('page') ?? '1') || 1);

  const [searchInput, setSearchInput] = useState(search);
  const debouncedSearch = useDebounce(searchInput, 350);

  const [categories, setCategories] = useState<Category[]>([]);
  const [result, setResult] = useState<Paginated<Product> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryToken, setRetryToken] = useState(0);

  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  useEffect(() => {
    if (debouncedSearch.trim() === search) return;
    const next = new URLSearchParams(searchParams);
    const value = debouncedSearch.trim();
    if (value) next.set('search', value);
    else next.delete('search');
    next.delete('page');
    setSearchParams(next, { replace: true });
    // Only react to the debounced term changing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  useEffect(() => {
    fetchCategories()
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    fetchProducts({
      search: search || undefined,
      category: category || undefined,
      sort,
      page,
      limit: 12,
    })
      .then((data) => {
        if (cancelled) return;
        setResult(data);
        setError(null);
      })
      .catch(() => {
        if (!cancelled) setError('The catalogue could not be loaded. Please try again.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [search, category, sort, page, retryToken]);

  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== 'page') next.delete('page');
    setSearchParams(next);
  };

  const activeCategory = categories.find((item) => item.slug === category);
  const hasFilters = Boolean(search || category || sort !== 'newest');

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">Catalogue</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
          {activeCategory ? activeCategory.name : 'All products'}
        </h1>
        <p className="mt-2 text-sm text-neutral-600">
          {activeCategory?.description ||
            'Search the range by name, filter by category and sort by price or newest arrivals.'}
        </p>
      </header>

      <div className="mt-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="w-full lg:max-w-sm">
          <label htmlFor="catalogue-search" className="sr-only">
            Search products by name
          </label>
          <div className="relative">
            <input
              id="catalogue-search"
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search products…"
              className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 pr-9 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
            <span aria-hidden="true" className="pointer-events-none absolute right-3 top-2.5 text-neutral-400">
              ⌕
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label htmlFor="catalogue-sort" className="sr-only">
            Sort products
          </label>
          <select
            id="catalogue-sort"
            value={sort}
            onChange={(event) => updateParam('sort', event.target.value)}
            className="rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {hasFilters && (
            <button
              type="button"
              onClick={() => {
                setSearchInput('');
                setSearchParams(new URLSearchParams());
              }}
              className="rounded-lg border border-neutral-300 px-3 py-2.5 text-sm font-medium text-neutral-600 hover:border-brand hover:text-brand"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      <div className="mt-5 flex gap-2 overflow-x-auto pb-2">
        <button
          type="button"
          onClick={() => updateParam('category', '')}
          className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${
            category === ''
              ? 'bg-brand text-white'
              : 'border border-neutral-300 text-neutral-700 hover:border-brand hover:text-brand'
          }`}
        >
          All
        </button>
        {categories.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => updateParam('category', item.slug)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${
              category === item.slug
                ? 'bg-brand text-white'
                : 'border border-neutral-300 text-neutral-700 hover:border-brand hover:text-brand'
            }`}
          >
            {item.name}
          </button>
        ))}
      </div>

      {result && !loading && (
        <p className="mt-4 text-xs text-neutral-500" role="status">
          Showing {result.items.length} of {result.total}{' '}
          {result.total === 1 ? 'product' : 'products'}
        </p>
      )}

      {error ? (
        <div className="mt-10 rounded-xl border border-red-200 bg-red-50 px-5 py-8 text-center">
          <p className="text-sm text-red-700">{error}</p>
          <button
            type="button"
            onClick={() => setRetryToken((token) => token + 1)}
            className="mt-4 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
          >
            Try again
          </button>
        </div>
      ) : loading ? (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="h-72 animate-pulse rounded-xl bg-neutral-100" />
          ))}
        </div>
      ) : result && result.items.length > 0 ? (
        <>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {result.items.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          <Pagination
            page={result.page}
            totalPages={result.totalPages}
            onChange={(nextPage) => {
              updateParam('page', String(nextPage));
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        </>
      ) : (
        <div className="mt-10 rounded-xl border border-dashed border-neutral-300 px-6 py-14 text-center">
          <h2 className="text-lg font-semibold">No products match your search</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-neutral-600">
            Try a different name, choose another category, or clear the filters to see everything.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchInput('');
              setSearchParams(new URLSearchParams());
            }}
            className="mt-5 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}
