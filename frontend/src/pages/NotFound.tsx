import { Link } from 'react-router-dom';
import { usePageMeta } from '../hooks/usePageMeta';

export default function NotFound() {
  usePageMeta('Page not found — Grubbix Warehouse');

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-4 text-center">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">404</p>
      <h1 className="mt-3 text-2xl font-semibold">We could not find that page</h1>
      <p className="mt-3 text-sm text-neutral-600">
        The link may be broken or the page may have moved.
      </p>
      <Link
        to="/"
        className="mt-6 rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark"
      >
        Back to homepage
      </Link>
    </div>
  );
}
