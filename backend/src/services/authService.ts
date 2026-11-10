import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env';
import { supabaseAdmin, supabasePublic } from '../config/supabase';
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
    .select('role, is_active')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw new ApiError(502, 'DATABASE_ERROR', 'Could not verify administrator access.');
  return data?.is_active ? (data.role as string) : null;
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

export async function requestPasswordReset(email: string): Promise<void> {
  const { error } = await supabasePublic.auth.resetPasswordForEmail(email, {
    redirectTo: env.PASSWORD_RESET_REDIRECT_URL,
  });

  if (error) {
    logger.error({ status: error.status }, 'Supabase password reset email request failed');
    throw new ApiError(
      502,
      'PASSWORD_RESET_UNAVAILABLE',
      'Could not send a password reset email. Please try again later.',
    );
  }
}

export async function completePasswordReset(
  accessToken: string,
  refreshToken: string,
  password: string,
): Promise<void> {
  const recoveryClient = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const { data, error: sessionError } = await recoveryClient.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  if (sessionError || !data.user) {
    throw new ApiError(
      400,
      'INVALID_RESET_LINK',
      'This password reset link is invalid or expired. Request a new one.',
    );
  }

  const { error } = await recoveryClient.auth.updateUser({ password });
  if (error) {
    logger.warn({ userId: data.user.id, status: error.status }, 'Supabase password update failed');
    throw new ApiError(
      400,
      'PASSWORD_RESET_FAILED',
      'Could not update the password. Request a new reset link and try again.',
    );
  }
}

export async function acceptAdminInvite(
  accessToken: string,
  refreshToken: string,
  password: string,
): Promise<void> {
  const inviteClient = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const { data, error: sessionError } = await inviteClient.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  if (sessionError || !data.user) {
    throw new ApiError(
      400,
      'INVALID_INVITE_LINK',
      'This invitation link is invalid or expired. Ask the owner to send another invitation.',
    );
  }

  const { data: role, error: roleError } = await supabaseAdmin
    .from('admin_roles')
    .select('role, is_active')
    .eq('user_id', data.user.id)
    .maybeSingle();

  if (roleError) {
    throw new ApiError(502, 'DATABASE_ERROR', 'Could not verify the administrator invitation.');
  }
  if (!role || role.role !== 'admin' || role.is_active) {
    throw new ApiError(
      400,
      'INVITE_NOT_PENDING',
      'This invitation is no longer pending. Try signing in instead.',
    );
  }

  const { error: passwordError } = await inviteClient.auth.updateUser({ password });
  if (passwordError) {
    logger.warn(
      { userId: data.user.id, status: passwordError.status },
      'Supabase invited-user password setup failed',
    );
    throw new ApiError(
      400,
      'INVITE_PASSWORD_FAILED',
      'Could not set your password. Open the invitation link again or ask the owner to remove this pending invite and send a new one.',
    );
  }

  const { error: activationError } = await supabaseAdmin.rpc('activate_admin_invite', {
    invited_user_id: data.user.id,
  });
  if (activationError) {
    logger.error(
      { userId: data.user.id, code: activationError.code },
      'Could not activate invited administrator',
    );
    throw new ApiError(
      500,
      'INVITE_ACTIVATION_FAILED',
      'Your password was set, but the account could not be activated. Contact the store owner.',
    );
  }
}
