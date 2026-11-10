-- Register invited users as inactive admins through a restricted definer function.
-- This avoids relying on direct INSERT/RLS behavior for the service-role API client.

create or replace function public.register_pending_admin_invite(invited_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.admin_roles (user_id, role, is_active)
  values (invited_user_id, 'admin', false);
end;
$$;

revoke all on function public.register_pending_admin_invite(uuid) from public, anon, authenticated;
grant execute on function public.register_pending_admin_invite(uuid) to service_role;
