import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { usePageMeta } from '../hooks/usePageMeta';
import { useSettings } from '../hooks/useSettings';
import { fetchProduct } from '../services/catalog';
import { ApiError } from '../services/http';
import type { Product } from '../types';
import { formatNaira } from '../utils/format';
import { buildWhatsAppUrl, productEnquiryMessage } from '../utils/whatsapp';

type LoadState = 'loading' | 'ready' | 'notfound' | 'error';

export default function ProductDetails() {
  const { slug } = useParams<{ slug: string }>();
  const { settings } = useSettings();
  const [product, setProduct] = useState<Product | null>(null);
  const [state, setState] = useState<LoadState>('loading');
  const [activeImage, setActiveImage] = useState(0);
  const [retryToken, setRetryToken] = useState(0);

  usePageMeta(
    product ? `${product.name} — ${settings.business_name}` : `Product — ${settings.business_name}`,
    product?.description || 'Product details and pricing at Grubbix Warehouse.',
  );

  useEffect(() => {
    if (!slug) {
      setState('notfound');
      return;
    }

    let cancelled = false;
    setState('loading');
    setActiveImage(0);

    fetchProduct(slug)
      .then((data) => {
        if (cancelled) return;
        setProduct(data);
        setState('ready');
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setState(error instanceof ApiError && error.status === 404 ? 'notfound' : 'error');
      });

    return () => {
      cancelled = true;
    };
  }, [slug, retryToken]);

  if (state === 'loading') {
    return (
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-2">
          <div className="aspect-square animate-pulse rounded-xl bg-neutral-100" />
          <div className="space-y-4">
            <div className="h-4 w-24 animate-pulse rounded bg-neutral-100" />
            <div className="h-8 w-3/4 animate-pulse rounded bg-neutral-100" />
            <div className="h-6 w-32 animate-pulse rounded bg-neutral-100" />
            <div className="h-24 animate-pulse rounded bg-neutral-100" />
          </div>
        </div>
      </div>
    );
  }

  if (state === 'notfound') {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center sm:px-6">
        <h1 className="text-2xl font-semibold">Product not available</h1>
        <p className="mt-3 text-sm text-neutral-600">
          This product may have sold out or been removed from the catalogue.
        </p>
        <Link
          to="/catalogue"
          className="mt-6 inline-block rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark"
        >
          Back to catalogue
        </Link>
      </div>
    );
  }

  if (state === 'error' || !product) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center sm:px-6">
        <h1 className="text-2xl font-semibold">Something went wrong</h1>
        <p className="mt-3 text-sm text-neutral-600">The product details could not be loaded.</p>
        <button
          type="button"
          onClick={() => setRetryToken((token) => token + 1)}
          className="mt-6 rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark"
        >
          Try again
        </button>
      </div>
    );
  }

  const image = product.images[activeImage] ?? product.images[0];
  const productUrl = `${window.location.origin}/products/${product.slug}`;
  const whatsappUrl = buildWhatsAppUrl(
    settings.whatsapp_number,
    productEnquiryMessage(product, productUrl),
  );
  const specifications = Object.entries(product.specifications ?? {});
  const paragraphs = product.description.split(/\n{2,}/).filter(Boolean);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <nav aria-label="Breadcrumb" className="text-xs text-neutral-500">
        <Link to="/" className="hover:text-brand">
          Home
        </Link>
        <span aria-hidden="true" className="px-2">
          /
        </span>
        <Link to="/catalogue" className="hover:text-brand">
          Catalogue
        </Link>
        {product.category && (
          <>
            <span aria-hidden="true" className="px-2">
              /
            </span>
            <Link to={`/catalogue?category=${product.category.slug}`} className="hover:text-brand">
              {product.category.name}
            </Link>
          </>
        )}
      </nav>

      <div className="mt-6 grid gap-10 lg:grid-cols-2">
        <div>
          <div className="aspect-square overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100">
            {image ? (
              <img
                src={image.url}
                alt={image.altText || product.name}
                className="h-full w-full object-contain"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-xs uppercase tracking-widest text-neutral-400">
                No image available
              </div>
            )}
          </div>

          {product.images.length > 1 && (
            <div className="mt-3 flex gap-3 overflow-x-auto pb-1">
              {product.images.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveImage(index)}
                  aria-label={`Show image ${index + 1}`}
                  aria-current={index === activeImage}
                  className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg border ${
                    index === activeImage ? 'border-brand' : 'border-neutral-200'
                  }`}
                >
                  <img
                    src={item.url}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          {product.category && (
            <Link
              to={`/catalogue?category=${product.category.slug}`}
              className="text-xs font-semibold uppercase tracking-[0.16em] text-brand hover:text-brand-dark"
            >
              {product.category.name}
            </Link>
          )}
          <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">{product.name}</h1>

          <p className="mt-4 text-2xl font-semibold">{formatNaira(product.priceKobo)}</p>

          <p className="mt-3 text-sm">
            {product.stockQuantity > 0 ? (
              <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
                In stock
                {product.stockQuantity <= 5 && ` — only ${product.stockQuantity} left`}
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1 text-red-700">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500" aria-hidden="true" />
                Out of stock
              </span>
            )}
          </p>

          {paragraphs.length > 0 && (
            <div className="mt-6 space-y-3 text-sm leading-relaxed text-neutral-700">
              {paragraphs.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          )}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            {whatsappUrl ? (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center justify-center rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-dark"
              >
                Enquire on WhatsApp
              </a>
            ) : (
              <Link
                to="/#contact"
                className="inline-flex items-center justify-center rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-dark"
              >
                Contact us about this product
              </Link>
            )}
            <Link
              to="/catalogue"
              className="inline-flex items-center justify-center rounded-full border border-neutral-300 px-6 py-3 text-sm font-semibold text-neutral-800 transition-colors hover:border-brand hover:text-brand"
            >
              Back to catalogue
            </Link>
          </div>

          {specifications.length > 0 && (
            <section className="mt-10">
              <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-neutral-500">
                Specifications
              </h2>
              <dl className="mt-4 divide-y divide-neutral-200 rounded-xl border border-neutral-200">
                {specifications.map(([key, value]) => (
                  <div key={key} className="grid grid-cols-2 gap-4 px-4 py-3 text-sm">
                    <dt className="text-neutral-600">{key}</dt>
                    <dd className="font-medium text-ink">{value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
