import { useEffect, useState, type FormEvent } from 'react';
import ConfirmDialog from '../../components/admin/ConfirmDialog';
import { usePageMeta } from '../../hooks/usePageMeta';
import {
  createCategory,
  deleteCategory,
  fetchAdminCategories,
  updateCategory,
} from '../../services/admin';
import { ApiError } from '../../services/http';
import type { Category } from '../../types';

type CategoryFields = { name: string; description: string; sortOrder: string };
const EMPTY_FIELDS: CategoryFields = { name: '', description: '', sortOrder: '0' };
const inputClass = 'mt-1.5 w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20';

function errorMessage(error: unknown): string {
  return error instanceof ApiError ? error.message : 'The request could not be completed. Check your connection and try again.';
}

function fieldsFrom(category: Category): CategoryFields {
  return { name: category.name, description: category.description, sortOrder: String(category.sortOrder) };
}

export default function AdminCategories() {
  usePageMeta('Categories — Grubbix Warehouse admin');

  const [categories, setCategories] = useState<Category[]>([]);
  const [fields, setFields] = useState<CategoryFields>(EMPTY_FIELDS);
  const [editing, setEditing] = useState<Category | null>(null);
  const [selected, setSelected] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [retryToken, setRetryToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchAdminCategories()
      .then((result) => {
        if (!cancelled) {
          setCategories(result);
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
  }, [retryToken]);

  const resetForm = () => {
    setEditing(null);
    setFields(EMPTY_FIELDS);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const sortOrder = Number(fields.sortOrder);
    if (!Number.isInteger(sortOrder) || sortOrder < 0 || sortOrder > 9999) {
      setError('Sort order must be a whole number from 0 to 9,999.');
      return;
    }

    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const input = {
        name: fields.name.trim(),
        description: fields.description.trim(),
        sortOrder,
      };
      if (editing) {
        const updated = await updateCategory(editing.id, input);
        setCategories((current) =>
          current
            .map((item) => item.id === updated.id ? updated : item)
            .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)),
        );
        setNotice(`${updated.name} was updated.`);
      } else {
        const created = await createCategory(input);
        setCategories((current) => [...current, created].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)));
        setNotice(`${created.name} was created.`);
      }
      resetForm();
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setDeleting(true);
    setError(null);
    setNotice(null);
    try {
      await deleteCategory(selected.id);
      setCategories((current) => current.filter((category) => category.id !== selected.id));
      setNotice(`${selected.name} was deleted.`);
      if (editing?.id === selected.id) resetForm();
      setSelected(null);
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Categories</h1>
        <p className="mt-1 text-sm text-neutral-600">Organize products into catalogue categories.</p>
      </div>
      {error && <p role="alert" className="mt-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      {notice && <p role="status" className="mt-5 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800">{notice}</p>}

      <section className="mt-6 rounded-xl border border-neutral-200 bg-white p-5 sm:p-6">
        <h2 className="text-base font-semibold">{editing ? `Edit ${editing.name}` : 'Add a category'}</h2>
        <form className="mt-4 grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit}>
          <label>
            <span className="text-sm font-medium text-neutral-700">Name</span>
            <input
              className={inputClass}
              value={fields.name}
              onChange={(event) => setFields((current) => ({ ...current, name: event.target.value }))}
              minLength={2}
              maxLength={80}
              required
            />
          </label>
          <label>
            <span className="text-sm font-medium text-neutral-700">Sort order</span>
            <input
              className={inputClass}
              type="number"
              min="0"
              max="9999"
              step="1"
              value={fields.sortOrder}
              onChange={(event) => setFields((current) => ({ ...current, sortOrder: event.target.value }))}
              required
            />
          </label>
          <label className="sm:col-span-2">
            <span className="text-sm font-medium text-neutral-700">Description</span>
            <textarea
              className={inputClass}
              rows={3}
              maxLength={500}
              value={fields.description}
              onChange={(event) => setFields((current) => ({ ...current, description: event.target.value }))}
            />
          </label>
          <div className="flex flex-wrap gap-3 sm:col-span-2">
            <button type="submit" disabled={saving} className="rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60">
              {saving ? 'Saving…' : editing ? 'Save category' : 'Create category'}
            </button>
            {editing && (
              <button type="button" onClick={resetForm} className="rounded-lg border border-neutral-300 px-4 py-2.5 text-sm font-semibold text-neutral-700 hover:bg-neutral-50">
                Cancel edit
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="mt-8">
        <h2 className="text-base font-semibold">Current categories</h2>
        {loading ? (
          <p role="status" className="mt-4 text-sm text-neutral-500">Loading categories…</p>
        ) : categories.length === 0 ? (
          <div className="mt-4 rounded-xl border border-neutral-200 bg-white px-5 py-10 text-center text-sm text-neutral-600">
            No categories yet. Add one above to organize products.
          </div>
        ) : (
          <div className="mt-4 overflow-hidden rounded-xl border border-neutral-200 bg-white">
            <ul className="divide-y divide-neutral-200">
              {categories.map((category) => (
                <li key={category.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:px-5">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-ink">{category.name}</p>
                    <p className="mt-1 text-xs text-neutral-500">
                      {category.productCount} {category.productCount === 1 ? 'product' : 'products'}
                      {' · '}Sort order {category.sortOrder}
                      {category.description && ` · ${category.description}`}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(category);
                      setFields(fieldsFrom(category));
                      setError(null);
                    }}
                    className="self-start rounded-lg border border-neutral-300 px-3 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 sm:self-auto"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    disabled={category.productCount > 0}
                    onClick={() => setSelected(category)}
                    title={category.productCount > 0 ? 'Move or remove this category’s products first.' : undefined}
                    className="self-start rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 sm:self-auto"
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        {!loading && error && categories.length === 0 && (
          <button type="button" onClick={() => setRetryToken((token) => token + 1)} className="mt-3 text-sm font-semibold text-brand hover:text-brand-dark">
            Try loading again
          </button>
        )}
      </section>

      <ConfirmDialog
        open={selected !== null}
        title="Delete category?"
        description={selected ? `Delete "${selected.name}"? This cannot be undone.` : undefined}
        confirmLabel="Delete category"
        busy={deleting}
        onConfirm={handleDelete}
        onCancel={() => setSelected(null)}
      />
    </div>
  );
}
