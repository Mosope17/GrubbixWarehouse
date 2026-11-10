import { env } from '../config/env';
import { supabaseAdmin } from '../config/supabase';
import { ApiError } from '../utils/errors';
import { logger } from '../utils/logger';

export type ManagedAdmin = {
  id: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
};

export async function listAdminAccounts(): Promise<ManagedAdmin[]> {
  const { data: roles, error: rolesError } = await supabaseAdmin
    .from('admin_roles')
    .select('user_id, role, is_active, created_at')
    .order('created_at');

  if (rolesError) {
    throw new ApiError(502, 'DATABASE_ERROR', 'Could not load administrator accounts.');
  }

  const usersById = new Map<string, string>();
  const perPage = 1000;
  for (let page = 1; ; page += 1) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });
    if (error) {
      throw new ApiError(502, 'AUTH_USERS_UNAVAILABLE', 'Could not load administrator accounts.');
    }
    for (const user of data.users) usersById.set(user.id, user.email ?? '');
    if (data.users.length < perPage) break;
  }

  return roles.map((role) => ({
    id: role.user_id,
    email: usersById.get(role.user_id) ?? '',
    role: role.role,
    isActive: role.is_active,
    createdAt: role.created_at,
  }));
}

export async function inviteAdmin(email: string): Promise<void> {
  const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
    redirectTo: env.ADMIN_INVITE_REDIRECT_URL,
  });

  if (error || !data.user) {
    if (error?.status === 422) {
      throw new ApiError(
        409,
        'ACCOUNT_ALREADY_EXISTS',
        'An account with that email already exists. Ask the owner to review it or use another email.',
      );
    }
    logger.error({ status: error?.status }, 'Supabase administrator invitation failed');
    throw new ApiError(
      502,
      'INVITE_EMAIL_FAILED',
      'Could not send the administrator invitation. Please try again later.',
    );
  }

  const { error: roleError } = await supabaseAdmin.rpc('register_pending_admin_invite', {
    invited_user_id: data.user.id,
  });

  if (roleError) {
    const { error: cleanupError } = await supabaseAdmin.auth.admin.deleteUser(data.user.id);
    if (cleanupError) {
      logger.error(
        { userId: data.user.id, code: roleError.code, cleanupStatus: cleanupError.status },
        'Could not register invited admin role or clean up invited user',
      );
    } else {
      logger.error({ userId: data.user.id, code: roleError.code }, 'Could not register invited admin role');
    }
    throw new ApiError(
      502,
      'INVITE_REGISTRATION_FAILED',
      cleanupError
        ? 'The invitation could not be registered or cleaned up. Contact support before inviting this email again.'
        : 'The invitation could not be registered; the unprivileged invited account was removed. Please try again.',
    );
  }
}

export async function deleteAdminAccount(actorId: string, targetId: string): Promise<void> {
  const { error } = await supabaseAdmin.rpc('delete_admin_account', {
    actor_user_id: actorId,
    target_user_id: targetId,
  });

  if (!error) return;
  if (error.code === '42501') {
    throw ApiError.forbidden('Only an owner can delete administrator accounts.');
  }
  if (error.code === '22023') {
    throw new ApiError(400, 'CANNOT_DELETE_SELF', 'You cannot delete your own account.');
  }
  if (error.code === '23514') {
    throw new ApiError(409, 'LAST_OWNER', 'Promote another administrator to owner before deleting this account.');
  }
  if (error.code === 'P0002') {
    throw ApiError.notFound('Administrator account not found.');
  }
  logger.error({ code: error.code }, 'Supabase administrator account deletion failed');
  throw new ApiError(502, 'ACCOUNT_DELETE_FAILED', 'Could not delete the administrator account.');
}
