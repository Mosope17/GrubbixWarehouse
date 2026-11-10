# Deploy Grubbix Warehouse

This project uses Cloudflare Pages for the React frontend, Render for the Express API, and Supabase for Postgres, authentication, and product-image storage.

## Before you start

- Push the repository to GitHub.
- Create accounts for Cloudflare, Render, and Supabase.
- Use Node.js `26.13.0` locally, matching the repository's `.nvmrc`.
- Keep the Supabase service-role/secret key private. Never add it to a `VITE_*` variable or expose it in frontend code.

## 1. Create and configure Supabase

1. Create a Supabase project and choose a database password and region.
2. In **Project Settings → API** (or **API Keys**), copy the project URL, the publishable/anon key, and the secret/service-role key. The backend needs all three.
3. Open **SQL Editor** and run these committed files, in this order:
   - `supabase/migrations/20261105120000_initial_schema.sql`
   - `supabase/migrations/20261105120100_store_settings_and_storage.sql`
   - `supabase/migrations/20261110130000_admin_onboarding.sql`
   - `supabase/migrations/20261110140000_register_admin_invite.sql`
4. Optionally run `supabase/seed.sql` to add the starter categories and blank store settings. It does not create products.
5. In **Storage**, verify that the public `product-images` bucket exists. The second migration creates/configures it.

## 2. Deploy the API to Render

1. In Render, choose **New → Blueprint** and connect this GitHub repository. Render detects the root `render.yaml`.
2. Create the `grubbix-warehouse-api` web service. The Blueprint builds from `backend/`, runs `npm ci --include=dev && npm run build`, starts with `npm start`, and checks `/api/health`.
3. Add the requested environment values in Render:
   - `SUPABASE_URL`: the Supabase project URL.
   - `SUPABASE_ANON_KEY`: the publishable/anon key.
   - `SUPABASE_SERVICE_ROLE_KEY`: the secret/service-role key.
   - `PASSWORD_RESET_REDIRECT_URL`: the full frontend callback URL, e.g. `https://grubbix-warehouse.vercel.app/admin/reset-password`.
   - `ADMIN_INVITE_REDIRECT_URL`: the full frontend invite callback URL, e.g. `https://grubbix-warehouse.vercel.app/admin/accept-invite`.
4. Wait for the first deploy to complete. Open `https://<your-render-service>.onrender.com/api/health`; the response should contain `"status":"ok"`. Save the service URL.

Render supplies `PORT` at runtime. The Blueprint sets `NODE_ENV=production` and the matching Node.js version. Do not set `PORT` yourself.
The Blueprint temporarily allows only the local development origin. Replace it with the Pages origin in step 4 before using the live frontend.

## 3. Deploy the frontend to Cloudflare Pages

1. In Cloudflare, choose **Workers & Pages → Create → Pages → Connect to Git** and select this repository.
2. Set the build configuration:
   - **Root directory:** `frontend`
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
3. Add the build environment variable `VITE_API_BASE_URL` with the full Render service URL, for example `https://<your-render-service>.onrender.com` (no trailing slash). It is embedded in the frontend at build time, so add it to both Production and Preview environments if both should work.
4. Set `NODE_VERSION` to `26.13.0` in the Pages build environment, then save and deploy.
5. Open the generated `https://<your-project>.pages.dev` site and save its exact origin.

The committed `frontend/public/_redirects` file routes frontend paths such as `/catalog` and `/admin/login` back to the SPA entry point, so refreshing a nested route works.

## 4. Allow the frontend to call the API

1. In Render, open the API service's **Environment** settings.
2. Set `CORS_ORIGINS` to the exact Cloudflare Pages origin, without a trailing slash. For multiple trusted origins, separate them with commas, e.g. `https://shop.example.com,https://grubbix-warehouse.pages.dev`.
3. Save the change and wait for Render to redeploy.
4. Test the home page, catalogue, product details, and `/api/health`. If using a custom domain, add its exact `https://` origin to `CORS_ORIGINS` as well.

Do not use `*` for `CORS_ORIGINS` on a live site. Preview deployments have distinct origins; only add preview origins you intend to trust.

## Password recovery email setup

The admin login includes a **Forgot password?** link. Password recovery uses Supabase Auth's built-in email delivery; this project does not use Resend.

1. In Supabase, open **Authentication → URL Configuration**.
2. Set **Site URL** to the frontend origin, e.g. `https://grubbix-warehouse.vercel.app`.
3. Add the exact callback URL `https://grubbix-warehouse.vercel.app/admin/reset-password` to **Redirect URLs**. For local testing, also allow `http://localhost:5173/admin/reset-password`.
4. In Render, set `PASSWORD_RESET_REDIRECT_URL` to the same production callback URL. The value must match a Supabase allowed redirect.
5. Redeploy the API after changing the Render environment variable. The frontend reset and forgot-password routes are included in the normal frontend build.
6. Submit an admin email at `/admin/forgot-password`, open the email, follow its link, and set a new password. The app shows a generic confirmation whether or not an account exists for the submitted email.

Supabase's built-in email service has strict sending limits and is intended mainly for development/testing. For production email delivery, configure a custom SMTP provider in Supabase Auth; it can be any SMTP provider and does not have to be Resend.

## Admin invitation email setup

1. In Supabase, open **Authentication → URL Configuration** and add `https://grubbix-warehouse.vercel.app/admin/accept-invite` to **Redirect URLs**. Set **Site URL** to `https://grubbix-warehouse.vercel.app` (not a localhost address).
2. In Render, set `ADMIN_INVITE_REDIRECT_URL` to exactly `https://grubbix-warehouse.vercel.app/admin/accept-invite`.
3. Apply the latest Supabase migration, `20261110140000_register_admin_invite.sql`, and redeploy the backend before retrying invitations.
4. If an earlier failed invite email was sent, ask the invitee to ignore it; the backend may have removed that pending account during cleanup. Send a fresh invitation after the migration and redeploy.

## 5. Create the first owner

Run the existing admin setup script locally. It uses the service key to create a confirmed Supabase Auth user and grant the owner role; never run it in frontend code.

1. In a terminal, create `backend/.env` from `backend/.env.example` and fill in the Supabase URL and keys. This file is ignored by Git.
2. From the repository root, install the backend dependencies if needed:

   ```sh
   cd backend
   npm ci
   ```

3. Create the admin account (macOS/Linux shell):

   ```sh
   ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='use-a-strong-unique-password' npm run admin:create
   ```

   In PowerShell, set `$env:ADMIN_EMAIL` and `$env:ADMIN_PASSWORD`, run `npm run admin:create`, then remove both variables from the session.
4. Sign in at `https://<your-project>.pages.dev/admin/login`.

## Local development

Create `backend/.env` and `frontend/.env` from their `.env.example` files, put your Supabase values in the backend file, and then run each app in its own terminal:

```sh
cd backend
npm ci
npm run dev
```

```sh
cd frontend
npm ci
npm run dev
```

The frontend template targets the API at `http://localhost:4000`; the backend template permits the Vite origin at `http://localhost:5173`.

## Updating the live site

- Push frontend or backend changes to the connected Git branch; Cloudflare Pages and Render build from that branch.
- For database changes, apply new SQL migrations to the Supabase project before deploying code that depends on them.
- Change environment variables in the corresponding service dashboard, not in committed files.
- After changing `VITE_API_BASE_URL`, trigger a new Cloudflare Pages build because Vite embeds it at build time.
