# Chore Chain — starter scaffold

Real backend, not a mockup: Supabase for auth/database/photo storage, Claude for
reading photographed chore charts, deployed on Vercel.

## What's built so far

- `supabase/schema.sql` — full database schema (profiles, groups/join codes,
  memberships, chores, submissions) with row-level security so parents only
  see their own group's data and children only see their own chores.
- `lib/joinCode.ts` — generates 6-character codes, auto-regenerates every
  48 hours, and supports the parent turning rotation off.
- `app/api/groups/join/route.ts` — child joins a group by code.
- `app/api/chores/[id]/submit/route.ts` — child submits a chore + photo proof.
- `app/api/chores/[id]/review/route.ts` — parent approves or sends back for redo.
- `app/api/chart-import/route.ts` — photographs a chore chart, uses Google's
  Gemini (free tier) to turn it into a list of chores for the parent to review
  before saving.
- PWA basics: `public/manifest.json`, `public/sw.js`, and the Safari/iOS meta
  tags in `app/layout.tsx` so it can be added to the home screen.

## What's still missing (next pass)

- The actual UI pages: signup/login, parent dashboard, child dashboard, chore
  editor, review queue. The API/data layer above is what they'll call.
- Chore CRUD route (`app/api/chores/route.ts`) and the "pre-invite without a
  code" flow (insert a `memberships` row with `profile_id = null`, then link
  it when that person signs up via `invite_token`).
- Real app icons in `public/icons/` (192x192 and 512x512 PNGs) — placeholders
  aren't included.
- A daily cron/edge function to auto-reset `chore_submissions.status` back to
  `pending` for recurring chores.

## Setup

1. Create a free project at supabase.com. In the SQL editor, run
   `supabase/schema.sql`.
2. In Supabase → Storage, create a bucket named `chore-photos` (public read).
3. Copy `.env.local.example` to `.env.local` and fill in your Supabase URL/anon
   key (Project Settings → API) and a free Gemini API key from
   aistudio.google.com/apikey.
4. `npm install`, then `npm run dev` to test locally.
5. Push to GitHub, import the repo at vercel.com, add the same env vars in
   Vercel's project settings, deploy.
6. Visit the deployed URL in Safari on iPhone → Share → Add to Home Screen.

I haven't run this in my sandbox (no network access there), so do a local
`npm run dev` pass before deploying — happy to debug whatever comes up.
