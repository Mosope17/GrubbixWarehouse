import { Link } from 'react-router-dom';
import type { Product } from '../../types';
import { formatNaira } from '../../utils/format';

export default function ProductCard({ product }: { product: Product }) {
  const cover = product.images[0];

  return (
    <Link
      to={`/products/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white transition-shadow hover:shadow-md"
    >
      <div className="aspect-square overflow-hidden bg-neutral-100">
        {cover ? (
          <img
            src={cover.url}
            alt={cover.altText || product.name}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center px-4 text-center text-xs uppercase tracking-widest text-neutral-400">
            No image yet
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        {product.category && (
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand">
            {product.category.name}
          </p>
        )}
        <h3 className="mt-1 line-clamp-2 text-sm font-semibold leading-snug text-ink sm:text-base">
          {product.name}
        </h3>
        <div className="mt-auto pt-3">
          <p className="text-base font-semibold text-ink sm:text-lg">
            {formatNaira(product.priceKobo)}
          </p>
          {product.stockQuantity > 0 && product.stockQuantity <= 5 && (
            <p className="mt-1 text-xs text-amber-600">Only {product.stockQuantity} left</p>
          )}
        </div>
      </div>
    </Link>
  );
}
