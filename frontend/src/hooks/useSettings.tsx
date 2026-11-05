import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { fetchSettings } from '../services/catalog';
import type { StoreSettings } from '../types';

const EMPTY_SETTINGS: StoreSettings = {
  business_name: 'Grubbix Warehouse',
  whatsapp_number: '',
  phone_number: '',
  contact_email: '',
  address: '',
  instagram_url: '',
  facebook_url: '',
};

type SettingsContextValue = {
  settings: StoreSettings;
  loading: boolean;
  error: string | null;
  reload: () => void;
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

function withPlaceholders(settings: StoreSettings): StoreSettings {
  return {
    ...settings,
    business_name: settings.business_name || 'Grubbix Warehouse',
    whatsapp_number: settings.whatsapp_number || import.meta.env.VITE_WHATSAPP_NUMBER || '',
    phone_number: settings.phone_number || import.meta.env.VITE_CONTACT_PHONE || '',
    contact_email: settings.contact_email || import.meta.env.VITE_CONTACT_EMAIL || '',
  };
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<StoreSettings>(EMPTY_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    fetchSettings()
      .then((result) => {
        if (cancelled) return;
        setSettings(withPlaceholders(result));
        setError(null);
      })
      .catch(() => {
        if (cancelled) return;
        setSettings(withPlaceholders(EMPTY_SETTINGS));
        setError('Contact details could not be loaded.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  const reload = useCallback(() => setReloadToken((token) => token + 1), []);

  const value = useMemo(
    () => ({ settings, loading, error, reload }),
    [settings, loading, error, reload],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettings must be used inside SettingsProvider');
  return context;
}
