import { supabaseAdmin, supabasePublic } from '../config/supabase';
import { ApiError } from '../utils/errors';

export const SETTINGS_KEYS = [
  'business_name',
  'whatsapp_number',
  'phone_number',
  'contact_email',
  'address',
  'instagram_url',
  'facebook_url',
] as const;

export type SettingsKey = (typeof SETTINGS_KEYS)[number];
export type StoreSettings = Record<SettingsKey, string>;

export async function getSettings(): Promise<StoreSettings> {
  const { data, error } = await supabasePublic.from('store_settings').select('key, value');

  if (error) throw new ApiError(502, 'DATABASE_ERROR', 'Could not load store settings.');

  const settings = Object.fromEntries(
    SETTINGS_KEYS.map((key) => [key, '']),
  ) as StoreSettings;

  for (const row of data ?? []) {
    const key = row.key as string;
    if ((SETTINGS_KEYS as readonly string[]).includes(key)) {
      settings[key as SettingsKey] = (row.value as string) ?? '';
    }
  }

  return settings;
}

export async function updateSettings(input: Partial<StoreSettings>): Promise<StoreSettings> {
  const rows = Object.entries(input)
    .filter(([key, value]) => value !== undefined && (SETTINGS_KEYS as readonly string[]).includes(key))
    .map(([key, value]) => ({ key, value: value as string }));

  if (rows.length > 0) {
    const { error } = await supabaseAdmin
      .from('store_settings')
      .upsert(rows, { onConflict: 'key' });

    if (error) throw new ApiError(502, 'DATABASE_ERROR', 'Could not save store settings.');
  }

  return getSettings();
}
