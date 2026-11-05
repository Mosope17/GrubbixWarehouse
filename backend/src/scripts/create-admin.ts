import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

/**
 * Secure first-administrator setup.
 *
 * Usage (run locally, never in the browser):
 *   ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='strong-password' npm run admin:create
 *
 * Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in backend/.env.
 * The account is created with the service role and granted an admin_roles row.
 */
async function main() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!url || !serviceRoleKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in backend/.env');
    process.exit(1);
  }
  if (!email || !password) {
    console.error("Set ADMIN_EMAIL and ADMIN_PASSWORD, e.g.\n  ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='...' npm run admin:create");
    process.exit(1);
  }
  if (password.length < 8) {
    console.error('ADMIN_PASSWORD must be at least 8 characters.');
    process.exit(1);
  }

  const supabase = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let userId: string | undefined;

  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (createError) {
    if (!/already/i.test(createError.message)) {
      console.error(`Could not create user: ${createError.message}`);
      process.exit(1);
    }

    const { data: list, error: listError } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    if (listError) {
      console.error(`Could not look up existing user: ${listError.message}`);
      process.exit(1);
    }
    userId = list.users.find((user) => user.email?.toLowerCase() === email.toLowerCase())?.id;
    if (!userId) {
      console.error('A user with this email exists but could not be found. Create it in the Supabase dashboard.');
      process.exit(1);
    }
    console.log('Existing user found — granting administrator access.');
  } else {
    userId = created.user?.id;
  }

  if (!userId) {
    console.error('Could not determine the user id.');
    process.exit(1);
  }

  const { error: roleError } = await supabase
    .from('admin_roles')
    .upsert({ user_id: userId, role: 'owner' }, { onConflict: 'user_id' });

  if (roleError) {
    console.error(`Could not grant administrator access: ${roleError.message}`);
    process.exit(1);
  }

  console.log(`Administrator ready: ${email}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
