# Supabase Reinit Checklist

Use this checklist to rebuild the app from scratch when the original `.env` and Supabase setup are gone.

## 1. Create Or Reuse A Supabase Project

- Create a new Supabase project, or open the old one if you still have access.
- Copy the project URL and anon key into `.env.local`.
- Copy the service role key into `.env.local` if you need storage uploads or admin actions.

## 2. Configure Auth

- Enable the auth providers you want to use in the Supabase dashboard.
- At minimum, configure email sign-in and email verification.
- If you want OAuth, add Google and GitHub provider credentials.
- Set redirect URLs to match the app routes:
  - `http://localhost:3000/auth/callback`
  - `http://localhost:3000/verify-otp`
  - `http://localhost:3000/onboarding`
  - `http://localhost:3000/dashboard`

## 3. Recreate Database Tables

Apply the SQL files in this order if needed:

- `model/database_setup.sql`
- `model/database_migration.sql`
- `model/database_migration_fixed.sql`
- `model/database_enhancements.sql`
- `model/enhanced_database_schema.sql`
- `user_onboarding_table.sql`
- `saved_jobs_table.sql`

If some tables already exist, inspect the SQL first and apply only the missing parts.

## 4. Recreate Storage Buckets

- Create buckets for resume uploads and profile images if the app depends on them.
- Check the code for the exact bucket names before applying policies.
- Add storage policies so authenticated users can read and write their own files.

## 5. Recheck Runtime Dependencies

- Set `NEXT_PUBLIC_SITE_URL` to your actual local or deployed URL.
- Set `BACKEND_API_URL` and `NEXT_PUBLIC_API_URL` to the Python/FastAPI backend.
- Set SMTP values if you want contact email and password reset email to work.
- Set Razorpay keys if you want payments to work.

## 6. Start The App

```bash
npm install
npm run dev
```

If the backend is separate, start it first so the proxy routes do not fail.

## 7. Quick Sanity Checks

- Visit `/api/check-config` to verify env loading.
- Visit `/test-auth` to check auth flow.
- Open the dashboard and confirm redirects behave correctly.
- Test resume upload, job search, and payment only after Supabase and backend services are available.
