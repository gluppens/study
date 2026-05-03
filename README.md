# Study

A smart personal study app for source-linked courses, structured appendices, traceable flashcards, and spaced repetition review.

## Stack

- React + TypeScript + Vite
- Tailwind CSS with shadcn/ui-style primitives
- Supabase Auth, Postgres, Storage, RLS, and Edge Functions
- Local demo persistence when Supabase environment variables are not configured

## Local Development

```bash
npm install
npm run dev
```

Copy `.env.example` to `.env` and add Supabase values to enable hosted auth/data:

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

## Supabase

The schema and storage/RLS policies live in:

- `supabase/migrations/202605030001_initial_study_schema.sql`
- `supabase/functions/generate-study-suggestions/index.ts`

The UI currently runs against local demo persistence by default, with the database schema ready for Supabase integration and production data repositories.
