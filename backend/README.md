# Event Bulletin Board Backend — Cleaned

This backend is aligned to the current frontend API contract.

## Included
- Supabase Auth token verification
- User profiles with `avatar` + `avatar_url` compatibility
- Event CRUD and pending -> approved/rejected workflow
- RSVP/registration
- Questions and answers
- Admin dashboard/users/registrations
- Nearby events
- Gemini event parsing
- Gemini event moderation
- Personalized recommendations
- Supabase Storage image upload endpoint
- LAN-friendly CORS in development
- `/` and `/api/health` health endpoints

## Environment

Copy `.env.example` to `.env` and set:

- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY`
- `GEMINI_API_KEY`

`GEMINI_MODEL` defaults to `gemini-3.5-flash`.

For the current frontend, `STORAGE_BUCKET=event-banners` matches the existing Supabase Storage bucket.

## Database

Run `supabase/schema.sql` in the Supabase SQL Editor.

Promote an account to admin:

```sql
update public.profiles
set role = 'admin'
where email = 'YOUR_ADMIN_EMAIL';
```

## Run

```bash
npm install
npm run dev
```

The server listens on `0.0.0.0:3001`.
