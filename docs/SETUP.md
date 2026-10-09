# Setup

This is a one-time, click-by-click guide to wire up Supabase, Google OAuth and GitHub for Ako. The app and CI/CD
pipelines are already in the repo; this guide covers the parts that cannot be done from code (spec section 17 and
PLAN.md phase 1 step 5).

## 1. Supabase project

The project already exists (ref `zmdbimnvxpbmnctqefcu`, Asia-Pacific region).

1. Open the project in the [Supabase dashboard](https://supabase.com/dashboard).
2. Go to **Project Settings -> API**. Copy:
   - **Project URL** (this is `VITE_SUPABASE_URL`, already `https://zmdbimnvxpbmnctqefcu.supabase.co`)
   - **anon / publishable key** (this is `VITE_SUPABASE_ANON_KEY`)
3. Go to **Authentication -> URL Configuration**:
   - **Site URL**: `https://learntereo.github.io/`
   - **Redirect URLs**: add both
     - `https://learntereo.github.io/`
     - `http://127.0.0.1:5173/`
4. Go to **Authentication -> Providers -> Email**. Leave it enabled (email confirmation stays on).

## 2. Google OAuth

1. In [Google Cloud Console](https://console.cloud.google.com/), create (or reuse) a project.
2. **APIs & Services -> OAuth consent screen**:
   - User type: External
   - App name: Ako
   - Scopes: `email`, `profile`, `openid`
   - Privacy policy link: `https://learntereo.github.io/#/privacy`
3. **APIs & Services -> Credentials -> Create credentials -> OAuth client ID**:
   - Application type: Web application
   - Authorised JavaScript origins: `https://learntereo.github.io` and `http://localhost:5173`
   - Authorised redirect URI: `https://zmdbimnvxpbmnctqefcu.supabase.co/auth/v1/callback`
4. Copy the generated **Client ID** and **Client secret**.
5. In Supabase: **Authentication -> Providers -> Google**, enable it, paste the Client ID and secret, save.

### Guest mode (anonymous sign-ins)

Guests use Supabase anonymous sign-ins, and can save their progress later by linking Google or an email address.

1. **Authentication -> Sign In / Providers**: turn on **Allow anonymous sign-ins**.
2. Same page, under **User Signups**: turn on **Allow manual linking** (needed for `linkIdentity` with Google).
3. Supabase recommends CAPTCHA (for example Cloudflare Turnstile) to stop abuse of anonymous sign-ins. It is not set up yet.
4. Anonymous users who never save pile up in `auth.users`. Plan to delete stale ones from time to time.

## 3. Database credentials (for CI)

1. The deploy pipeline connects through the Supabase **session pooler**. Its host for this project is
   `aws-0-ap-northeast-1.pooler.supabase.com` (replace if you recreate the project). This becomes the
   `SUPABASE_DB_HOST` variable. No Supabase access token is needed.
2. The database password is the one you set when the project was created (or reset it under
   **Project Settings -> Database**). This becomes `SUPABASE_DB_PASSWORD`.

## 4. GitHub repository configuration

In `learntereo/learntereo.github.io` on GitHub:

1. **Settings -> Pages**: set Source to **GitHub Actions**.
2. **Settings -> Secrets and variables -> Actions -> Variables**, add:
   - `VITE_SUPABASE_URL` = `https://zmdbimnvxpbmnctqefcu.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = (the anon key from step 1)
   - `SUPABASE_PROJECT_REF` = `zmdbimnvxpbmnctqefcu`
   - `SUPABASE_DB_HOST` = `aws-0-ap-northeast-1.pooler.supabase.com`
3. **Settings -> Secrets and variables -> Actions -> Secrets**, add:
   - `SUPABASE_DB_PASSWORD` = (from step 3)
4. **Settings -> Branches**: add a branch protection rule for `main` requiring the `ci` status check to pass
   before merging, and requiring a pull request before merging.

## 5. Local development

```sh
cp .env.example .env.local
# edit .env.local and fill in VITE_SUPABASE_ANON_KEY
npm install
npm run dev
```

Without `.env.local`, the app builds and runs but shows a "Configuration missing" screen instead of the
sign-in page; this is expected and lets CI build the project without secrets.

## 6. Manual verification checklist

After the first deploy, verify by hand (these are not covered by the unit test suite):

- [ ] AC2: sign in with Google reaches Home with a profile row created.
- [ ] AC3: sign up with email/password, confirm the email, then sign in.
- [ ] AC20: Account -> Delete my account and data removes the user and signs out.
- [ ] AC21: `#/privacy` loads without signing in.
- [ ] AC22: a PR to `main` runs the `ci` check and merging is blocked if it fails.
- [ ] AC23: merging to `main` runs `migrate` then deploys to the Pages URL.
- [ ] AC25: a second account cannot see the first account's rows (RLS).

## 7. Rollback

- **Site**: revert the merge commit on `main`. The next deploy republishes the previous build.
- **Database**: the initial migration can be undone manually if needed:

  ```sql
  drop function if exists public.delete_my_account();
  drop trigger if exists set_updated_at on public.profiles;
  drop function if exists public.set_updated_at();
  drop trigger if exists on_auth_user_created on auth.users;
  drop function if exists public.handle_new_user();
  drop table if exists public.rounds;
  drop table if exists public.item_progress;
  drop table if exists public.profiles;
  ```
