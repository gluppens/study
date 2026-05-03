# Study

Study is a source-linked learning workspace for building courses, writing structured course material, maintaining appendices, creating traceable flashcards, reviewing with spaced repetition, and tracking progress.

The app is currently an MVP frontend with rich local demo data, Supabase-backed live mode, a complete Supabase schema scaffold, and a safe AI suggestion function scaffold. It can run as a separate local demo workspace or as an authenticated Supabase workspace when Vite Supabase environment variables are configured.

For the original long-form product and architecture plan, see [docs/initial-product-plan.md](docs/initial-product-plan.md).

## Current Status

Implemented:

- React, TypeScript, Vite application shell.
- Tailwind CSS with shadcn/ui-style local primitives.
- Course dashboard and course library.
- Course creation flow.
- Course workspace tabs:
  - Content
  - Appendices
  - Flashcards
  - Study
  - Analytics
  - Import
  - Export
- Codespaces-inspired content workspace:
  - single editor-like content surface without a separate course tree pane
  - inline course headings backed by the structured course hierarchy
  - compact search, current-location, and jump-to-heading toolbar
  - monospaced block editor with a quiet numbering gutter
  - text-like minimap rail with density stripes and semantic markers
  - collapsible heading blocks
  - block-level appendix linking
  - AI flashcard suggestion trigger
- Structured appendices:
  - default tables for Images, Persons, Events, Places, and Definitions
  - custom demo tables such as Concepts, Formulas, APIs, Processes, Verbs, and Grammar Patterns
  - multilingual aliases and translations in the demo records
- Flashcards:
  - basic Q&A
  - definition
  - cloze
  - true/false
  - person
  - image-based
  - linked, unlinked, stale, due, future, weak, and AI-generated states
- Study sessions:
  - due cards
  - new cards
  - weak cards
  - section mode
  - appendix mode
  - tag focus
  - random mixed
  - image recognition
- SM-2-inspired spaced repetition scheduler.
- Analytics:
  - course size metrics
  - coverage
  - due cards
  - weak cards
  - review accuracy
  - hierarchy mastery
  - source-link integrity signals
- Import/export MVP:
  - paste text import into content blocks
  - JSON course export
  - flashcards CSV export
- Global search across local demo content, appendices, cards, and tags.
- Email/password Supabase Auth live mode.
- Dual local/Supabase repository layer behind the shared `StudyDataProvider`.
- Supabase-backed live CRUD for courses, hierarchy, content blocks, appendices, flashcards, reviews, AI suggestions, links, tags, assets, and metrics.
- Supabase migration with tables, indexes, RLS policies, and storage buckets.
- Supabase Edge Function scaffold for AI suggestions.

Not yet implemented:

- Real file upload/download UI.
- Production auth hardening such as password reset, OAuth providers, and account settings.
- PDF/Word import and export.
- Advanced exact text-span repair.
- Full AI import pipeline.
- FSRS-style scheduling and advanced readiness forecasting.
- Collaboration.

## Product Model

The highest-level object is a course.

Each course contains:

- Content
- Appendices
- Flashcards
- Study/review sessions
- Analytics and progress metrics
- AI suggestions
- Source links and entity links

The source-of-truth rule is central:

- Content is source of truth.
- Appendices are source of truth.
- Flashcards are derived learning objects.
- Flashcards should remain traceable to content blocks, text anchors, appendix records, assets, or sources.
- AI can create suggestions, but source-of-truth changes should require user review.

## Course Structure

The academic hierarchy is modeled as:

```text
Course -> Module -> Chapter -> Section -> Subsection
```

Content inside that hierarchy is block-based. Supported block types are:

- heading
- paragraph
- definition
- quote
- example
- note
- warning
- table
- image
- formula
- question
- summary

The app stores numbering as structured tokens and caches display labels. The MVP uses practical academic numbering such as:

```text
I.A.a.i
```

Later levels can use the planned compact form:

```text
§1.IV.A.iv.a.1.2.3
```

## Demo Dataset

The local demo data is intentionally rich so the product feels populated immediately.

Current demo seed includes:

- 4 courses
- 48 hierarchy nodes
- 112 content blocks
- 28 appendix tables
- 60 appendix records
- 75 flashcards
- 12 text anchors
- 33 entity links
- 16 AI suggestions
- 4 review sessions
- 32 review attempts

Demo courses:

- European History Foundations
- Cell Biology and Genetics
- Full-Stack TypeScript with Supabase
- French A2 Grammar Review

The seed uses deterministic IDs such as `course_history`, `history_block_fiscal_crisis`, and `bio_card_mitosis_cloze` so records and links are readable while debugging.

The app persists local demo state in `localStorage`. A seed version key forces old local demo data to refresh when the built-in demo dataset changes.

Storage keys:

```text
study.mvp.data
study.mvp.seedVersion
study.mvp.mode
```

Current seed version:

```text
2026-05-expanded-demo
```

## Architecture

Frontend:

- React 19
- TypeScript
- Vite
- React Router
- TanStack Query dependency installed for future server-state refinements
- Tailwind CSS
- shadcn/ui-style primitives built locally
- lucide-react icons

State:

- `StudyDataProvider` is the shared data boundary for demo and live workspaces.
- Demo mode persists runtime actions to `localStorage`.
- Live mode uses Supabase Auth plus a repository/mapping layer to persist the same domain shape to Supabase tables.
- Mutating actions are async and keep the UI state optimistic while serializing Supabase writes.
- The state shape mirrors the Supabase schema so pages can stay backend-agnostic.

Backend and live persistence:

- Supabase Auth
- Supabase Postgres
- Row Level Security
- Supabase Storage
- Supabase Edge Functions

AI scaffold:

- AI calls should happen server-side.
- The included Edge Function stores suggestions in `ai_suggestions`.
- AI suggestions target existing records through `ai_suggestion_targets`.
- Source-of-truth content is not directly mutated by the AI function.

## Key Files

Application entry:

- `src/main.tsx`
- `src/App.tsx`
- `src/index.css`

Domain and state:

- `src/domain/types.ts`
- `src/domain/numbering.ts`
- `src/domain/review.ts`
- `src/domain/import-export.ts`
- `src/state/demo-data.ts`
- `src/state/study-data.tsx`
- `src/state/supabase-study-repository.ts`
- `src/lib/supabase-storage.ts`

Layout and UI:

- `src/components/layout/app-shell.tsx`
- `src/components/course/course-workspace-shell.tsx`
- `src/components/course/course-explorer.tsx`
- `src/components/ui/*`

Pages:

- `src/pages/dashboard-page.tsx`
- `src/pages/courses-page.tsx`
- `src/pages/new-course-page.tsx`
- `src/pages/course-overview-page.tsx`
- `src/pages/content-page.tsx`
- `src/pages/appendices-page.tsx`
- `src/pages/flashcards-page.tsx`
- `src/pages/study-page.tsx`
- `src/pages/study-session-page.tsx`
- `src/pages/analytics-page.tsx`
- `src/pages/import-page.tsx`
- `src/pages/export-page.tsx`
- `src/pages/search-page.tsx`
- `src/pages/login-page.tsx`

Supabase:

- `supabase/config.toml`
- `supabase/migrations/202605030001_initial_study_schema.sql`
- `supabase/functions/generate-study-suggestions/index.ts`

## Routes

```text
/login
/
/courses
/courses/new
/courses/:courseId
/courses/:courseId/content
/courses/:courseId/appendices
/courses/:courseId/flashcards
/courses/:courseId/study
/courses/:courseId/study/session/:sessionId
/courses/:courseId/analytics
/courses/:courseId/import
/courses/:courseId/export
/search
```

## Supabase Schema

The initial migration creates the main MVP schema:

- `profiles`
- `courses`
- `course_nodes`
- `content_blocks`
- `content_block_versions`
- `content_text_anchors`
- `appendix_tables`
- `appendix_fields`
- `appendix_records`
- `appendix_record_values`
- `sources`
- `assets`
- `flashcards`
- `flashcard_sources`
- `review_sessions`
- `review_attempts`
- `study_schedules`
- `ai_suggestions`
- `ai_suggestion_targets`
- `entity_links`
- `tags`
- `taggings`
- `course_metrics`

The migration also adds:

- useful indexes
- full-text search indexes where appropriate
- update timestamp triggers
- profile creation trigger for new auth users
- RLS policies for owner-scoped access
- private storage buckets:
  - `course-images`
  - `course-documents`
  - `course-exports`

## Local Development

Install dependencies:

```bash
npm install
```

Run the dev server:

```bash
npm run dev
```

Run a production preview after building:

```bash
npm run build
npm run preview -- --port 4174
```

Run checks:

```bash
npm run lint
npm run build
```

## Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Add Supabase values when using a hosted Supabase project:

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
VITE_SUPABASE_ANON_KEY=
```

`VITE_SUPABASE_PUBLISHABLE_KEY` is preferred for hosted projects. `VITE_SUPABASE_ANON_KEY` remains supported for older Supabase setups and local projects.

Without these values, the app runs in local demo mode.

## Supabase Local Development

The Supabase project scaffold is present, and the frontend can use live Supabase persistence when Vite Supabase env vars are configured.

Typical local Supabase workflow:

```bash
supabase start
supabase db reset
supabase functions serve generate-study-suggestions
```

The AI Edge Function expects server-side environment variables when connected to a real AI provider:

```text
AI_API_KEY
AI_ENDPOINT
AI_MODEL
```

The function is intentionally suggestion-first. It inserts reviewable AI output instead of directly changing content or appendices.

## Import and Export

MVP import:

- paste text into a selected hierarchy node
- split text into heading and paragraph blocks

MVP export:

- full course JSON
- flashcards CSV

Planned later:

- PDF import
- Word import
- CSV/Excel appendix import with mapping
- Anki-compatible export
- PDF export
- Word export
- AI-assisted structure extraction

## Review Scheduling

The current scheduler is SM-2-inspired.

It tracks:

- due date
- interval
- ease factor
- review count
- lapses
- confidence
- mastery

Review ratings:

- again
- hard
- good
- easy

Planned later:

- FSRS-style stability and difficulty modeling
- exam-date workload planning
- readiness forecasts
- mastery decay
- weak-topic clustering

## AI Safety Model

The intended AI behavior is conservative:

- send only selected source context
- create suggestions first
- show affected targets
- allow accept, edit, reject, or defer
- avoid direct source-of-truth mutation unless explicitly approved

Current implementation:

- local and live UI can create reviewable flashcard suggestions
- suggestions appear in the flashcard validation inbox
- accepting flashcard suggestions creates derived cards
- live mode persists suggestions, targets, accepted cards, and source links through Supabase repositories
- Supabase Edge Function scaffold can create persisted suggestions server-side

## MVP Boundaries

This MVP is meant to demonstrate the product shape, not finish every hard system.

Simplified for now:

- local demo mode remains separate from authenticated Supabase live data
- live mode is browser-client Supabase persistence, not an SSR application
- block-level linking as the primary working link model
- exact text anchors exist in data but advanced repair UI is not complete
- text-like minimap rail rather than exact glyph-level VS Code minimap
- simple import/export
- simple spaced repetition
- AI suggestions rather than autonomous AI edits

## Roadmap

Phase 2:

- harden the Supabase live workspace with password reset, account/profile settings, and better error recovery
- add real file uploads to Supabase Storage
- improve exact text-span anchoring and stale anchor repair
- add richer appendix custom fields and views
- add stale flashcard update suggestions
- add PDF/Word import
- add Anki export
- add section/chapter mastery analytics

Phase 3:

- advanced VS Code-style minimap
- visual learning map
- full AI import pipeline
- AI inconsistency and duplicate detection
- mock exams and generated quizzes
- FSRS-style scheduling
- readiness forecast with mastery decay
- glyph-level minimap rendering and viewport sync
- advanced multilingual workflows
- full PDF/Word export
- collaboration

## Notes for Future Developers

- Keep content and appendices as source of truth.
- Treat flashcards as derived and traceable.
- Preserve source links when generating or editing cards.
- Keep AI outputs reviewable.
- Keep RLS policies authoritative; do not rely on client-side checks for data isolation.
- Keep local and Supabase repository behavior aligned so page components stay backend-agnostic.
