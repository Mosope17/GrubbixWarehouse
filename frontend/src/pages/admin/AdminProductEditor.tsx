import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import ConfirmDialog from '../../components/admin/ConfirmDialog';
import { usePageMeta } from '../../hooks/usePageMeta';
import {
  createProduct,
  deleteProductImage,
  fetchAdminCategories,
  fetchAdminProduct,
  uploadProductImages,
  updateProduct,
} from '../../services/admin';
import { ApiError } from '../../services/http';
import type { Category, Product, ProductPayload } from '../../types';
import { koboToInput, nairaToKobo } from '../../utils/format';

const inputClass = 'mt-1.5 w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20';

function errorMessage(error: unknown): string {
  return error instanceof ApiError ? error.message : 'Could not save product. Check your connection and try again.';
}

function specsToText(specifications: Record<string, string>): string {
  return Object.entries(specifications).map(([key, value]) => `${key}: ${value}`).join('\n');
}

function textToSpecs(value: string): Record<string, string> | null {
  const result: Record<string, string> = {};
  for (const rawLine of value.split('\n')) {
    const line = rawLine.trim();
    if (!line) continue;
    const separator = line.indexOf(':');
    if (separator <= 0 || !line.slice(separator + 1).trim()) return null;
    const key = line.slice(0, separator).trim();
    const detail = line.slice(separator + 1).trim();
    if (!key || key.length > 80 || detail.length > 300 || result[key] || Object.keys(result).length >= 50) return null;
    result[key] = detail;
  }
  return result;
}

export default function AdminProductEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [price, setPrice] = useState('');
  const [stockQuantity, setStockQuantity] = useState('0');
  const [specifications, setSpecifications] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(Boolean(id));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [removeImage, setRemoveImage] = useState<Product['images'][number] | null>(null);
  const [deletingImage, setDeletingImage] = useState(false);
  const productId = id ?? product?.id;
  const isEditing = Boolean(productId);
  usePageMeta(isEditing ? 'Edit product — Grubbix Warehouse admin' : 'Add product — Grubbix Warehouse admin');

  useEffect(() => {
    const state = location.state as { notice?: string } | null;
    if (state?.notice) {
      setNotice(state.notice);
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.pathname, location.state, navigate]);

  useEffect(() => {
    let cancelled = false;
    fetchAdminCategories()
      .then((result) => {
        if (!cancelled) {
          setCategories(result);
          setCategoriesError(null);
        }
      })
      .catch((caught: unknown) => {
        if (!cancelled) setCategoriesError(errorMessage(caught));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    fetchAdminProduct(id)
      .then((result) => {
        if (cancelled) return;
        setProduct(result);
        setName(result.name);
        setDescription(result.description);
        setCategoryId(result.category?.id ?? '');
        setPrice(koboToInput(result.priceKobo));
        setStockQuantity(String(result.stockQuantity));
        setSpecifications(specsToText(result.specifications));
        setIsAvailable(result.isAvailable);
        setIsFeatured(result.isFeatured);
        setError(null);
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
  }, [id]);

  const parsedPrice = useMemo(() => nairaToKobo(price), [price]);
  const parsedSpecifications = useMemo(() => textToSpecs(specifications), [specifications]);
  const selectedFiles = useMemo(() => Array.from(files), [files]);

  const handleFileChange = (list: FileList | null) => {
    const picked = Array.from(list ?? []);
    if (picked.length + (product?.images.length ?? 0) > 8) {
      setError('A product can have up to 8 images. Remove an existing image or choose fewer files.');
      return;
    }
    setFiles(picked);
    setError(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setNotice(null);

    if (parsedPrice === null) {
      setError('Enter a valid price with no more than 2 decimal places.');
      return;
    }
    const quantity = Number(stockQuantity);
    if (!Number.isInteger(quantity) || quantity < 0 || quantity > 1_000_000) {
      setError('Stock must be a whole number between 0 and 1,000,000.');
      return;
    }
    if (parsedSpecifications === null) {
      setError('Enter specifications one per line using “Name: Value” format.');
      return;
    }

    const payload: ProductPayload = {
      name: name.trim(),
      description,
      categoryId: categoryId || null,
      priceKobo: parsedPrice,
      stockQuantity: quantity,
      specifications: parsedSpecifications,
      isAvailable,
      isFeatured,
    };

    setSaving(true);
    let newlyCreated = false;
    try {
      let saved: Product;
      if (productId) {
        saved = await updateProduct(productId, payload);
      } else {
        saved = await createProduct(payload);
        newlyCreated = true;
        setProduct(saved);
      }
      if (files.length > 0) {
        const uploaded = await uploadProductImages(saved.id, files);
        saved = { ...saved, images: [...saved.images, ...uploaded] };
      }
      setProduct(saved);
      navigate(`/admin/products/${saved.id}`, {
        replace: !id,
        state: { notice: id ? 'Product changes saved.' : 'Product created.' },
      });
      setFiles([]);
    } catch (caught) {
      setError(errorMessage(caught));
      if (newlyCreated) setNotice('The product was created, but its images were not uploaded. Retry the image upload.');
    } finally {
      setSaving(false);
    }
  };

  const handleImageDelete = async () => {
    if (!productId || !removeImage) return;
    setDeletingImage(true);
    setError(null);
    try {
      await deleteProductImage(productId, removeImage.id);
      setProduct((current) =>
        current ? { ...current, images: current.images.filter((image) => image.id !== removeImage.id) } : current,
      );
      setRemoveImage(null);
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setDeletingImage(false);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link to="/admin/products" className="text-sm font-medium text-brand hover:text-brand-dark">← Products</Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">{isEditing ? 'Edit product' : 'Add product'}</h1>
        </div>
      </div>

      {error && <p role="alert" className="mt-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      {notice && <p role="status" className="mt-5 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">{notice}</p>}
      {loading ? (
        <p role="status" className="mt-6 text-sm text-neutral-500">Loading product…</p>
      ) : error && isEditing && !product ? (
        <div className="mt-6 rounded-xl border border-neutral-200 bg-white p-5">
          <p className="text-sm text-neutral-600">The product could not be loaded.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          <section className="grid gap-5 rounded-xl border border-neutral-200 bg-white p-5 sm:grid-cols-2 sm:p-6">
            <label className="sm:col-span-2">
              <span className="text-sm font-medium text-neutral-700">Product name</span>
              <input className={inputClass} value={name} onChange={(event) => setName(event.target.value)} minLength={2} maxLength={160} required />
            </label>
            <label>
              <span className="text-sm font-medium text-neutral-700">Price (NGN)</span>
              <input className={inputClass} type="number" inputMode="decimal" min="0" max="1000000000" step="0.01" value={price} onChange={(event) => setPrice(event.target.value)} required />
            </label>
            <label>
              <span className="text-sm font-medium text-neutral-700">Category</span>
              {categoriesError && <span role="alert" className="mt-1 block text-xs text-red-700">{categoriesError}</span>}
              <select className={inputClass} value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
                <option value="">No category</option>
                {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
              </select>
            </label>
            <label>
              <span className="text-sm font-medium text-neutral-700">Stock quantity</span>
              <input className={inputClass} type="number" min="0" max="1000000" step="1" value={stockQuantity} onChange={(event) => setStockQuantity(event.target.value)} required />
            </label>
            <label className="sm:col-span-2">
              <span className="text-sm font-medium text-neutral-700">Description</span>
              <textarea className={inputClass} rows={5} maxLength={4000} value={description} onChange={(event) => setDescription(event.target.value)} />
            </label>
            <label className="sm:col-span-2">
              <span className="text-sm font-medium text-neutral-700">Specifications</span>
              <textarea
                className={inputClass}
                rows={4}
                value={specifications}
                onChange={(event) => setSpecifications(event.target.value)}
                placeholder={'Material: Stainless steel\nCapacity: 8 litres'}
                aria-describedby="specifications-help"
              />
              <span id="specifications-help" className="mt-1 block text-xs text-neutral-500">One per line, using “Name: Value”. Leave blank if there are no specifications.</span>
            </label>
            <div className="flex flex-wrap gap-6 sm:col-span-2">
              <label className="flex items-center gap-2 text-sm text-neutral-700">
                <input type="checkbox" checked={isAvailable} onChange={(event) => setIsAvailable(event.target.checked)} className="h-4 w-4 accent-brand" />
                Available in public catalogue
              </label>
              <label className="flex items-center gap-2 text-sm text-neutral-700">
                <input type="checkbox" checked={isFeatured} onChange={(event) => setIsFeatured(event.target.checked)} className="h-4 w-4 accent-brand" />
                Feature on homepage
              </label>
            </div>
          </section>

          <section className="rounded-xl border border-neutral-200 bg-white p-5 sm:p-6">
            <h2 className="font-semibold">Product images</h2>
            <p className="mt-1 text-sm text-neutral-600">JPEG, PNG, WebP or AVIF; up to 8 images per product. The server enforces the configured file-size limit.</p>
            {product?.images.length ? (
              <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {product.images.map((image) => (
                  <li key={image.id} className="relative overflow-hidden rounded-lg border border-neutral-200">
                    <img src={image.url} alt={image.altText || product.name} className="aspect-square w-full object-cover" />
                    <button type="button" onClick={() => setRemoveImage(image)} className="w-full px-2 py-2 text-xs font-semibold text-red-700 hover:bg-red-50">
                      Remove image
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
            <label className="mt-4 block">
              <span className="sr-only">Choose product images</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                multiple
                onChange={(event) => handleFileChange(event.target.files)}
                className="block w-full text-sm text-neutral-600 file:mr-3 file:rounded-lg file:border-0 file:bg-neutral-100 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-neutral-700 hover:file:bg-neutral-200"
              />
            </label>
            {selectedFiles.length > 0 && (
              <ul className="mt-3 space-y-1 text-xs text-neutral-600">
                {selectedFiles.map((file) => <li key={`${file.name}-${file.size}`}>{file.name} ({(file.size / 1024 / 1024).toFixed(1)} MB)</li>)}
              </ul>
            )}
            {!productId && <p className="mt-2 text-xs text-neutral-500">Images are uploaded after the product is created.</p>}
          </section>

          <div className="flex flex-wrap justify-end gap-3">
            <Link to="/admin/products" className="rounded-lg border border-neutral-300 px-4 py-2.5 text-sm font-semibold text-neutral-700 hover:bg-neutral-50">Cancel</Link>
            <button type="submit" disabled={saving} className="rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60">
              {saving ? 'Saving…' : isEditing ? 'Save changes' : 'Create product'}
            </button>
          </div>
        </form>
      )}

      <ConfirmDialog
        open={removeImage !== null}
        title="Remove product image?"
        description="This removes the image from the product and storage. This cannot be undone."
        confirmLabel="Remove image"
        busy={deletingImage}
        onConfirm={handleImageDelete}
        onCancel={() => setRemoveImage(null)}
      />
    </div>
  );
}
