-- Invite-based administrator onboarding and atomic account removal.

alter table public.admin_roles
  add column if not exists is_active boolean not null default true;

comment on column public.admin_roles.is_active is
  'Pending invitations remain inactive until the invited user sets a password.';

create or replace function public.activate_admin_invite(invited_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.admin_roles
  set is_active = true
  where user_id = invited_user_id
    and role = 'admin'
    and is_active = false;

  if not found then
    raise exception 'No pending administrator invitation exists'
      using errcode = 'P0002';
  end if;
end;
$$;

revoke all on function public.activate_admin_invite(uuid) from public, anon, authenticated;
grant execute on function public.activate_admin_invite(uuid) to service_role;

create or replace function public.delete_admin_account(actor_user_id uuid, target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_role text;
begin
  perform pg_catalog.pg_advisory_xact_lock(374281, 1);

  if not exists (
    select 1
    from public.admin_roles
    where user_id = actor_user_id
      and role = 'owner'
      and is_active
  ) then
    raise exception 'Only an active owner can delete administrator accounts'
      using errcode = '42501';
  end if;

  if actor_user_id = target_user_id then
    raise exception 'Owners cannot delete their own account'
      using errcode = '22023';
  end if;

  select role
  into target_role
  from public.admin_roles
  where user_id = target_user_id
  for update;

  if not found then
    raise exception 'Administrator account not found'
      using errcode = 'P0002';
  end if;

  if target_role = 'owner' and (
    select count(*)
    from public.admin_roles
    where role = 'owner'
      and is_active
  ) <= 1 then
    raise exception 'Cannot delete the last active owner'
      using errcode = '23514';
  end if;

  delete from auth.users where id = target_user_id;

  if not found then
    raise exception 'Authentication account not found'
      using errcode = 'P0002';
  end if;
end;
$$;

revoke all on function public.delete_admin_account(uuid, uuid) from public, anon, authenticated;
grant execute on function public.delete_admin_account(uuid, uuid) to service_role;
