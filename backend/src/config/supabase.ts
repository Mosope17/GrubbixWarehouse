import { createClient } from '@supabase/supabase-js';
import { env } from './env';

const sharedOptions = {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
} as const;

/**
 * Anon-key client. Used for every public read so Row Level Security decides
 * what anonymous visitors may see.
 */
export const supabasePublic = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_ANON_KEY,
  sharedOptions,
);

/**
 * Service-role client. Server-side only — it must never be exposed to the
 * browser. Administrative access is always gated by requireAdmin first.
 */
export const supabaseAdmin = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  sharedOptions,
);
