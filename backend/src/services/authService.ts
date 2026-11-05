import { supabaseAdmin } from '../config/supabase';
import type { AdminUser } from '../types/api';
import { ApiError } from '../utils/errors';
import { logger } from '../utils/logger';

type SessionPayload = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  admin: AdminUser;
};

async function getAdminRole(userId: string): Promise<string | null> {
  const { data, error } = await supabaseAdmin
    .from('admin_roles')
    .select('role')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw new ApiError(502, 'DATABASE_ERROR', 'Could not verify administrator access.');
  return data ? (data.role as string) : null;
}

function toPayload(session: {
  access_token: string;
  refresh_token: string;
  expires_at?: number | null;
  expires_in?: number | null;
}): Omit<SessionPayload, 'admin'> {
  return {
    accessToken: session.access_token,
    refreshToken: session.refresh_token,
    expiresAt: session.expires_at ?? Math.floor(Date.now() / 1000) + (session.expires_in ?? 3600),
  };
}

export async function login(email: string, password: string): Promise<SessionPayload> {
  const { data, error } = await supabaseAdmin.auth.signInWithPassword({ email, password });

  if (error || !data.user || !data.session) {
    throw new ApiError(401, 'INVALID_CREDENTIALS', 'Invalid email or password.');
  }

  const role = await getAdminRole(data.user.id);
  if (!role) {
    // Do not leave a valid session behind for a non-administrator account.
    const { error: signOutError } = await supabaseAdmin.auth.admin.signOut(data.session.access_token);
    if (signOutError) {
      logger.warn({ userId: data.user.id }, 'Could not revoke non-admin session');
    }
    throw new ApiError(403, 'NOT_ADMIN', 'This account does not have administrator access.');
  }

  return {
    ...toPayload(data.session),
    admin: { id: data.user.id, email: data.user.email ?? email, role },
  };
}

export async function refresh(refreshToken: string): Promise<SessionPayload> {
  const { data, error } = await supabaseAdmin.auth.refreshSession({ refresh_token: refreshToken });

  if (error || !data.user || !data.session) {
    throw new ApiError(401, 'INVALID_SESSION', 'Your session has expired. Please sign in again.');
  }

  const role = await getAdminRole(data.user.id);
  if (!role) {
    throw new ApiError(403, 'NOT_ADMIN', 'This account does not have administrator access.');
  }

  return {
    ...toPayload(data.session),
    admin: { id: data.user.id, email: data.user.email ?? '', role },
  };
}
