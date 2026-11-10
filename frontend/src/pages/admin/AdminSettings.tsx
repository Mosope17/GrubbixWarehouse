import { useEffect, useState, type FormEvent } from 'react';
import { usePageMeta } from '../../hooks/usePageMeta';
import { useSettings } from '../../hooks/useSettings';
import { fetchAdminSettings, saveSettings } from '../../services/admin';
import { ApiError } from '../../services/http';
import type { StoreSettings } from '../../types';

type SettingsField = {
  key: keyof StoreSettings;
  label: string;
  type?: 'text' | 'tel' | 'email' | 'url';
  maxLength: number;
  placeholder?: string;
  pattern?: string;
  multiline?: boolean;
};

const fields: SettingsField[] = [
  { key: 'business_name', label: 'Business name', maxLength: 120, placeholder: 'Grubbix Warehouse' },
  { key: 'whatsapp_number', label: 'WhatsApp number', type: 'tel', maxLength: 30, pattern: '[0-9+()\\s-]*', placeholder: '+234 800 000 0000' },
  { key: 'phone_number', label: 'Phone number', type: 'tel', maxLength: 30, pattern: '[0-9+()\\s-]*', placeholder: '+234 800 000 0000' },
  { key: 'contact_email', label: 'Contact email', type: 'email', maxLength: 200, placeholder: 'hello@example.com' },
  { key: 'address', label: 'Business address', maxLength: 300, multiline: true, placeholder: 'Street, city, state' },
  { key: 'instagram_url', label: 'Instagram URL', type: 'url', maxLength: 300, placeholder: 'https://instagram.com/yourstore' },
  { key: 'facebook_url', label: 'Facebook URL', type: 'url', maxLength: 300, placeholder: 'https://facebook.com/yourstore' },
];

const EMPTY_SETTINGS: StoreSettings = {
  business_name: '',
  whatsapp_number: '',
  phone_number: '',
  contact_email: '',
  address: '',
  instagram_url: '',
  facebook_url: '',
};

const inputClass = 'mt-1.5 w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20';

function errorMessage(error: unknown): string {
  return error instanceof ApiError ? error.message : 'Could not save store settings. Check your connection and try again.';
}

export default function AdminSettings() {
  usePageMeta('Settings — Grubbix Warehouse admin');
  const { reload } = useSettings();
  const [settings, setSettings] = useState<StoreSettings>(EMPTY_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [retryToken, setRetryToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchAdminSettings()
      .then((result) => {
        if (!cancelled) {
          setSettings(result);
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

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const updated = await saveSettings(settings);
      setSettings(updated);
      reload();
      setNotice('Store settings saved.');
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Store settings</h1>
        <p className="mt-1 text-sm text-neutral-600">Manage the contact and social details displayed on your storefront.</p>
      </div>
      {error && (
        <div role="alert" className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          <span>{error}</span>
          {!loading && (
            <button type="button" onClick={() => setRetryToken((token) => token + 1)} className="font-semibold underline">
              Reload settings
            </button>
          )}
        </div>
      )}
      {notice && <p role="status" className="mt-5 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800">{notice}</p>}

      {loading ? (
        <p role="status" className="mt-6 text-sm text-neutral-500">Loading settings…</p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6">
          <section className="grid gap-5 rounded-xl border border-neutral-200 bg-white p-5 sm:grid-cols-2 sm:p-6">
            {fields.map((field) => (
              <label key={field.key} className={field.multiline ? 'sm:col-span-2' : undefined}>
                <span className="text-sm font-medium text-neutral-700">{field.label}</span>
                {field.multiline ? (
                  <textarea
                    className={inputClass}
                    rows={3}
                    maxLength={field.maxLength}
                    value={settings[field.key]}
                    placeholder={field.placeholder}
                    onChange={(event) => setSettings((current) => ({ ...current, [field.key]: event.target.value }))}
                  />
                ) : (
                  <input
                    className={inputClass}
                    type={field.type ?? 'text'}
                    maxLength={field.maxLength}
                    pattern={field.pattern}
                    value={settings[field.key]}
                    placeholder={field.placeholder}
                    onChange={(event) => setSettings((current) => ({ ...current, [field.key]: event.target.value }))}
                  />
                )}
              </label>
            ))}
          </section>
          <div className="mt-5 flex justify-end">
            <button type="submit" disabled={saving} className="rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60">
              {saving ? 'Saving…' : 'Save settings'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
