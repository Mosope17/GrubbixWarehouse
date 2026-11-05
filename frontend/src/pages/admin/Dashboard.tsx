import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { usePageMeta } from '../../hooks/usePageMeta';
import { fetchStats } from '../../services/admin';
import type { DashboardStats } from '../../types';

function StatCard({ label, value, hint }: { label: string; value: number; hint?: string }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-ink">{value}</p>
      {hint && <p className="mt-1 text-xs text-neutral-500">{hint}</p>}
    </div>
  );
}

export default function Dashboard() {
  usePageMeta('Dashboard — Grubbix Warehouse admin');

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryToken, setRetryToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    fetchStats()
      .then((data) => {
        if (cancelled) return;
        setStats(data);
        setError(null);
      })
      .catch(() => {
        if (!cancelled) setError('Dashboard statistics could not be loaded.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [retryToken]);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-neutral-600">Catalogue health at a glance.</p>
        </div>
        <Link
          to="/admin/products/new"
          className="rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark"
        >
          Add product
        </Link>
      </div>

      {error && (
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <p>{error}</p>
          <button
            type="button"
            onClick={() => setRetryToken((token) => token + 1)}
            className="mt-2 font-semibold underline"
          >
            Try again
          </button>
        </div>
      )}

      {loading ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-28 animate-pulse rounded-xl bg-neutral-100" />
          ))}
        </div>
      ) : stats ? (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Total products" value={stats.totals.products} />
            <StatCard
              label="Available"
              value={stats.totals.available}
              hint="Visible in the public catalogue"
            />
            <StatCard
              label="Out of stock"
              value={stats.totals.outOfStock}
              hint="Hidden from the public catalogue"
            />
            <StatCard label="Categories" value={stats.totals.categories} />
          </div>

          <div className="mt-8 rounded-xl border border-neutral-200 bg-white">
            <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4">
              <h2 className="text-sm font-semibold">Products per category</h2>
              <Link to="/admin/categories" className="text-xs font-semibold text-brand hover:text-brand-dark">
                Manage categories
              </Link>
            </div>
            <div className="divide-y divide-neutral-100">
              {stats.perCategory.map((category) => (
                <div key={category.id} className="flex items-center justify-between px-5 py-3 text-sm">
                  <span className="text-neutral-700">{category.name}</span>
                  <span className="font-semibold text-ink">{category.productCount}</span>
                </div>
              ))}
              {stats.perCategory.length === 0 && (
                <p className="px-5 py-6 text-sm text-neutral-500">No categories yet.</p>
              )}
            </div>
          </div>

          <p className="mt-4 text-xs text-neutral-500">
            {stats.totals.featured} {stats.totals.featured === 1 ? 'product is' : 'products are'}{' '}
            marked as featured on the homepage.
          </p>
        </>
      ) : null}
    </div>
  );
}
