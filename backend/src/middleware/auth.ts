import type { RequestHandler } from 'express';
import { supabaseAdmin } from '../config/supabase';
import type { AdminUser } from '../types/api';
import { ApiError } from '../utils/errors';

async function resolveAdmin(token: string): Promise<AdminUser | null> {
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) return null;

  const { data: role, error: roleError } = await supabaseAdmin
    .from('admin_roles')
    .select('role')
    .eq('user_id', data.user.id)
    .maybeSingle();

  if (roleError) throw new ApiError(500, 'ROLE_LOOKUP_FAILED', 'Could not verify administrator access.');
  if (!role) return null;

  return {
    id: data.user.id,
    email: data.user.email ?? '',
    role: role.role as string,
  };
}

export const requireAdmin: RequestHandler = (req, _res, next) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    next(ApiError.unauthorized('Missing bearer token.'));
    return;
  }

  resolveAdmin(header.slice('Bearer '.length).trim())
    .then((admin) => {
      if (!admin) {
        next(ApiError.forbidden('This account does not have administrator access.'));
        return;
      }
      req.admin = admin;
      next();
    })
    .catch(next);
};
