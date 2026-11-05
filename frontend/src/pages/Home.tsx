import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import ProductCard from '../components/products/ProductCard';
import { usePageMeta } from '../hooks/usePageMeta';
import { useSettings } from '../hooks/useSettings';
import { fetchCategories, fetchFeaturedProducts } from '../services/catalog';
import type { Category, Product } from '../types';
import { buildWhatsAppUrl, generalEnquiryMessage } from '../utils/whatsapp';

export default function Home() {
  const { settings } = useSettings();
  const location = useLocation();
  const [categories, setCategories] = useState<Category[]>([]);
  const [featured, setFeatured] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  usePageMeta(
    `${settings.business_name} — Kitchenware & Catering Equipment in Nigeria`,
    'Browse chafing dishes, dinner plates, glassware, coolers, kitchen utensils and more from Grubbix Warehouse.',
  );

  useEffect(() => {
    let cancelled = false;

    Promise.all([fetchCategories(), fetchFeaturedProducts()])
      .then(([categoryList, productList]) => {
        if (cancelled) return;
        setCategories(categoryList);
        setFeatured(productList);
        setError(null);
      })
      .catch(() => {
        if (!cancelled) setError('The catalogue could not be loaded right now.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (location.hash === '#contact') {
      document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [location.hash]);

  const whatsappUrl = buildWhatsAppUrl(
    settings.whatsapp_number,
    generalEnquiryMessage(settings.business_name),
  );

  return (
    <>
      <section className="border-b border-neutral-200 bg-neutral-50">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1.15fr_0.85fr] lg:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">
              {settings.business_name}
            </p>
            <h1 className="mt-4 max-w-xl text-3xl font-semibold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
              Kitchenware and catering equipment, supplied across Nigeria.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-neutral-600">
              Everything your kitchen, restaurant or event needs — from chafing dishes and dinner
              plates to glassware, coolers and table linen.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/catalogue"
                className="rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-dark"
              >
                Browse catalogue
              </Link>
              {whatsappUrl ? (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="rounded-full border border-neutral-300 bg-white px-6 py-3 text-sm font-semibold text-neutral-800 transition-colors hover:border-brand hover:text-brand"
                >
                  Enquire on WhatsApp
                </a>
              ) : (
                <Link
                  to="/#contact"
                  className="rounded-full border border-neutral-300 bg-white px-6 py-3 text-sm font-semibold text-neutral-800 transition-colors hover:border-brand hover:text-brand"
                >
                  Contact us
                </Link>
              )}
            </div>
          </div>

          <div className="flex justify-center lg:justify-end">
            <div className="w-full max-w-sm rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
              <img
                src="/images/grubbix-logo.jpeg"
                alt="Grubbix Warehouse logo"
                width={576}
                height={480}
                className="h-auto w-full"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Shop by category</h2>
            <p className="mt-2 text-sm text-neutral-600">
              Nine categories covering front-of-house and back-of-house essentials.
            </p>
          </div>
          <Link to="/catalogue" className="hidden text-sm font-semibold text-brand hover:text-brand-dark sm:block">
            View all
          </Link>
        </div>

        {loading ? (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-24 animate-pulse rounded-xl bg-neutral-100" />
            ))}
          </div>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <Link
                key={category.id}
                to={`/catalogue?category=${category.slug}`}
                className="group flex items-center justify-between gap-4 rounded-xl border border-neutral-200 bg-white p-5 transition-colors hover:border-brand"
              >
                <div>
                  <h3 className="text-sm font-semibold text-ink group-hover:text-brand">
                    {category.name}
                  </h3>
                  <p className="mt-1 text-xs text-neutral-500">
                    {category.productCount} {category.productCount === 1 ? 'product' : 'products'}
                  </p>
                </div>
                <span aria-hidden="true" className="text-brand">
                  →
                </span>
              </Link>
            ))}
          </div>
        )}

        {error && (
          <p role="alert" className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}
      </section>

      <section className="border-y border-neutral-200 bg-neutral-50">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Featured products</h2>
          <p className="mt-2 text-sm text-neutral-600">
            A selection highlighted by the Grubbix Warehouse team.
          </p>

          {loading ? (
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-64 animate-pulse rounded-xl bg-neutral-200/60" />
              ))}
            </div>
          ) : featured.length > 0 ? (
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {featured.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <p className="mt-8 rounded-xl border border-dashed border-neutral-300 bg-white px-4 py-10 text-center text-sm text-neutral-500">
              Featured products will appear here as soon as an administrator marks them as featured.
            </p>
          )}
        </div>
      </section>

      <section id="contact" className="scroll-mt-24">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Talk to us</h2>
          <p className="mt-2 max-w-xl text-sm text-neutral-600">
            Ask about availability, bulk pricing or delivery. We reply to enquiries during business
            hours.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {settings.phone_number && (
              <div className="rounded-xl border border-neutral-200 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">
                  Phone
                </p>
                <a
                  href={`tel:${settings.phone_number.replace(/\s/g, '')}`}
                  className="mt-2 block text-sm font-semibold text-ink hover:text-brand"
                >
                  {settings.phone_number}
                </a>
              </div>
            )}

            {settings.whatsapp_number && (
              <div className="rounded-xl border border-neutral-200 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">
                  WhatsApp
                </p>
                {whatsappUrl && (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="mt-2 block text-sm font-semibold text-ink hover:text-brand"
                  >
                    Send a message
                  </a>
                )}
              </div>
            )}

            {settings.contact_email && (
              <div className="rounded-xl border border-neutral-200 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">
                  Email
                </p>
                <a
                  href={`mailto:${settings.contact_email}`}
                  className="mt-2 block break-all text-sm font-semibold text-ink hover:text-brand"
                >
                  {settings.contact_email}
                </a>
              </div>
            )}

            {settings.address && (
              <div className="rounded-xl border border-neutral-200 p-5 sm:col-span-2">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">
                  Address
                </p>
                <p className="mt-2 text-sm text-neutral-700">{settings.address}</p>
              </div>
            )}

            {(settings.instagram_url || settings.facebook_url) && (
              <div className="rounded-xl border border-neutral-200 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">
                  Follow
                </p>
                <div className="mt-2 flex gap-4 text-sm font-semibold">
                  {settings.instagram_url && (
                    <a href={settings.instagram_url} target="_blank" rel="noreferrer noopener" className="text-ink hover:text-brand">
                      Instagram
                    </a>
                  )}
                  {settings.facebook_url && (
                    <a href={settings.facebook_url} target="_blank" rel="noreferrer noopener" className="text-ink hover:text-brand">
                      Facebook
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>

          {!settings.phone_number &&
            !settings.whatsapp_number &&
            !settings.contact_email &&
            !settings.address && (
              <p className="mt-6 rounded-xl border border-dashed border-neutral-300 px-4 py-6 text-sm text-neutral-500">
                Contact details will appear here once they are added in the admin settings.
              </p>
            )}
        </div>
      </section>
    </>
  );
}
