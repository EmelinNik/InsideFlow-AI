<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1J1W3wCljjamd1qeKxhVrmdANkhJBxTLn

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. (Supabase) Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env.local`
4. Run the app:
   `npm run dev`

## Supabase setup

The app now stores user data in Supabase (fallback to localStorage if env vars are missing).

### Table schema (SQL)

```sql
create table if not exists public.app_users (
  user_id bigint primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);
```

### RLS policy

The app uses Telegram IDs and does not use Supabase Auth. To keep the current flow working:

1. Either **disable RLS** on `app_users`, **or**
2. Add a permissive policy for anon access (not recommended for production).

If you later add Supabase Auth, update the policy to restrict `user_id` to the authenticated user.
