# Initial Product Plan

This document captures the original long-form product and architecture plan for Study.
It is historical context, not a guarantee that every item is currently implemented.
For current setup, status, and development notes, see [../README.md](../README.md).

# Repository Assessment

The repository is essentially empty. I found only `README.md` with:

> `# study`  
> `A smart personal study app.`

No frontend, backend, package manager, Supabase config, or schema exists yet. The plan therefore assumes the requested modern stack:

- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- Supabase Auth, Postgres, Storage, Edge Functions
- AI calls through server-side Supabase Edge Functions

# Product Summary

Build a structured study workspace where users create courses, author academic content, maintain appendices as source-of-truth reference tables, generate traceable flashcards, review with spaced repetition, and track progress.

The app starts as a clean course library and evolves into a full learning environment with a VS Code-style course editor, structured academic outline, appendix database, flashcard system, AI suggestions, search, import/export, and analytics.

# Key Product Principles

- `Content` and `Appendices` are source of truth.
- `Flashcards` are derived learning objects and must stay linked to content blocks, text spans, appendix records, or sources whenever possible.
- AI may suggest content, appendix records, links, flashcards, corrections, and study plans, but source-of-truth changes require explicit user approval.
- Every generated or derived object should preserve traceability: source target, source excerpt, generation method, timestamps, and stale status.
- Content should be block-based, versioned, searchable, linkable, and suitable for structured academic navigation.

# Recommended Architecture

- Frontend: React + TypeScript SPA, preferably Vite unless a future SSR requirement appears.
- UI: Tailwind CSS + shadcn/ui, with desktop-heavy workspace layouts and mobile-optimized review/study flows.
- State: TanStack Query for server state, local component state for editor interactions, optional Zustand for workspace UI state.
- Backend: Supabase Auth, Postgres, RLS, Storage, Edge Functions.
- AI: Supabase Edge Functions call the AI provider; the browser never receives provider API keys.
- Search: Postgres full-text search for MVP, later pgvector embeddings for semantic search.
- Import/export: Edge Functions for heavier PDF/Word parsing and export generation in later phases.
- Analytics: event-level review attempts plus rollup tables/materialized views for dashboard performance.
- Versioning: version source-of-truth content blocks and appendix records enough to detect stale flashcards and AI suggestions.

# Recommended Pages

- `/login`: sign in, sign up, password reset.
- `/`: dashboard with active courses, due cards, progress, weak topics, target countdowns, pending AI suggestions, global search.
- `/courses`: course library with filters by status, language, subject, tags, due cards, recent activity.
- `/courses/new`: guided course creation.
- `/courses/:courseId`: course workspace shell with tabs.
- `/courses/:courseId/content`: academic content editor.
- `/courses/:courseId/appendices`: appendix table browser and record editor.
- `/courses/:courseId/flashcards`: flashcard list, filters, editor, source-link warnings.
- `/courses/:courseId/study`: study mode launcher.
- `/courses/:courseId/study/session/:sessionId`: active review/study session.
- `/courses/:courseId/analytics`: progress, coverage, mastery, readiness forecast.
- `/courses/:courseId/import`: paste/import flow.
- `/courses/:courseId/export`: PDF/Word/CSV/Anki/JSON export options.
- `/search`: global cross-course search.

# Main Components

- `AppShell`: global sidebar, account menu, theme, responsive layout.
- `CourseLibrary`: course cards/table, filters, due-card indicators.
- `DashboardWidgets`: active courses, due cards, weak topics, study streak, AI queue.
- `CourseWorkspaceShell`: course-specific tabs, breadcrumb, command/search entry.
- `CourseExplorer`: module/chapter/section tree with drag/drop later.
- `ContentEditor`: block editor with hierarchy, indentation, numbering, linking UI.
- `ContentBlockRenderer`: heading, paragraph, definition, quote, example, note, warning, table, image, formula, question, summary.
- `OutlinePanel`: clickable headings and block markers.
- `EditorMinimap`: deferred from MVP; starts as simple outline/density rail.
- `SpanLinkPopover`: create/link appendix item or flashcard from selected text.
- `AppendixTableView`: default and custom appendix tables.
- `AppendixRecordEditor`: structured fields, aliases/translations, sources, linked content.
- `FlashcardList`: filters by type, due date, source, weak status, tag.
- `FlashcardEditor`: manual card creation and source linking.
- `StudyModePicker`: due, new, section, appendix, weak, exam, random, tag.
- `ReviewCard`: type-specific answer UI.
- `AIEvaluationPanel`: typed-answer feedback with user confirmation.
- `AISuggestionInbox`: preview, accept, edit, reject, defer.
- `ImportWizard`: paste, document upload, CSV/Excel appendix import.
- `ExportWizard`: JSON, flashcard CSV/Anki; PDF/Word later.

# Supabase Database Schema

## `profiles` — MVP

Purpose: app-level user profile linked to Supabase Auth.

Important columns:
- `id uuid primary key references auth.users(id)`
- `display_name text`
- `preferred_language text`
- `created_at timestamptz`
- `updated_at timestamptz`

Indexes:
- primary key only initially.

RLS:
- required; users can read/update only their profile.

## `courses` — MVP

Purpose: top-level study object.

Important columns:
- `id uuid primary key`
- `owner_id uuid references profiles(id)`
- `title text`
- `description text`
- `main_language text`
- `subject text`
- `difficulty_level text`
- `status text check in draft/active/completed/archived`
- `exam_date date`
- `target_date date`
- `source_type text`
- `estimated_study_minutes int`
- `mastery_score numeric`
- `confidence_score numeric`
- `created_at timestamptz`
- `updated_at timestamptz`

Indexes:
- `(owner_id, status)`
- `(owner_id, updated_at desc)`
- full-text index on `title`, `description`, `subject`.

RLS:
- required; owner-scoped.

## `course_nodes` — MVP

Purpose: strict course hierarchy: module, chapter, section, subsection, plus deeper heading containers if needed.

Important columns:
- `id uuid primary key`
- `course_id uuid references courses(id)`
- `parent_id uuid references course_nodes(id)`
- `node_type text check in module/chapter/section/subsection/heading`
- `title text`
- `position int`
- `depth int`
- `numbering_path jsonb`
- `display_number text`
- `language text`
- `is_collapsed_default boolean`
- `created_at timestamptz`
- `updated_at timestamptz`

Indexes:
- `(course_id, parent_id, position)`
- `(course_id, depth)`
- full-text index on `title`.

RLS:
- required via course ownership.

Notes:
- MVP supports strict hierarchy to subsection.
- Unlimited heading nesting is represented with additional `heading` nodes or heading content blocks linked to parent nodes.
- `numbering_path` stores structured numbering tokens; `display_number` is cached for fast UI rendering.

## `content_blocks` — MVP

Purpose: block-based source-of-truth content.

Important columns:
- `id uuid primary key`
- `course_id uuid references courses(id)`
- `node_id uuid references course_nodes(id)`
- `parent_block_id uuid references content_blocks(id)`
- `block_type text`
- `position int`
- `depth int`
- `content jsonb`
- `plain_text text`
- `language text`
- `numbering_path jsonb`
- `display_number text`
- `is_collapsible boolean`
- `is_collapsed boolean`
- `version int`
- `content_hash text`
- `created_at timestamptz`
- `updated_at timestamptz`

Indexes:
- `(course_id, node_id, position)`
- `(course_id, block_type)`
- full-text index on `plain_text`.

RLS:
- required via course ownership.

Notes:
- `content` stores structured payload per block type.
- Sentences should be stored either as structured inline segments in `content` or derived into `content_sentences`.

## `content_block_versions` — Phase 2

Purpose: preserve source history and detect stale derived objects.

Important columns:
- `id uuid primary key`
- `content_block_id uuid references content_blocks(id)`
- `version int`
- `content jsonb`
- `plain_text text`
- `content_hash text`
- `created_by uuid references profiles(id)`
- `created_at timestamptz`

Indexes:
- `(content_block_id, version desc)`.

RLS:
- required.

MVP simplification:
- keep only current `version` and `content_hash`; add full history in Phase 2.

## `content_text_anchors` — MVP-lite, stronger in Phase 2

Purpose: represent exact text spans safely.

Important columns:
- `id uuid primary key`
- `course_id uuid references courses(id)`
- `content_block_id uuid references content_blocks(id)`
- `block_version int`
- `start_offset int`
- `end_offset int`
- `selected_text text`
- `prefix_context text`
- `suffix_context text`
- `text_hash text`
- `anchor_status text check in active/stale/needs_review`
- `created_at timestamptz`
- `updated_at timestamptz`

Indexes:
- `(content_block_id)`
- `(course_id, anchor_status)`.

RLS:
- required.

Notes:
- MVP can link block-level first.
- Exact spans should use offsets plus selected text plus surrounding context so anchors can be repaired when text changes.

## `appendix_tables` — MVP

Purpose: default and custom appendix table definitions.

Important columns:
- `id uuid primary key`
- `course_id uuid references courses(id)`
- `name text`
- `slug text`
- `table_type text check in images/persons/events/places/definitions/custom`
- `is_default boolean`
- `description text`
- `position int`
- `created_at timestamptz`
- `updated_at timestamptz`

Indexes:
- `(course_id, slug unique)`
- `(course_id, table_type)`.

RLS:
- required.

## `appendix_fields` — MVP for basic custom fields

Purpose: field definitions for appendix tables.

Important columns:
- `id uuid primary key`
- `appendix_table_id uuid references appendix_tables(id)`
- `name text`
- `slug text`
- `field_type text`
- `is_required boolean`
- `position int`
- `options jsonb`
- `created_at timestamptz`

Indexes:
- `(appendix_table_id, position)`
- `(appendix_table_id, slug unique)`.

RLS:
- required.

MVP field types:
- text, long_text, number, date, url, select, multi_select, image, file.

Later field types:
- relation, computed, rich_text, multilingual_label.

## `appendix_records` — MVP

Purpose: structured source-of-truth appendix items.

Important columns:
- `id uuid primary key`
- `course_id uuid references courses(id)`
- `appendix_table_id uuid references appendix_tables(id)`
- `title text`
- `record_type text`
- `short_description text`
- `source_id uuid references sources(id)`
- `language text`
- `aliases jsonb`
- `translations jsonb`
- `tags_cache text[]`
- `user_notes text`
- `version int`
- `record_hash text`
- `created_method text check in manual/imported/ai_suggested`
- `created_at timestamptz`
- `updated_at timestamptz`

Indexes:
- `(course_id, appendix_table_id)`
- full-text index on `title`, `short_description`
- GIN index on `aliases`, `translations`, `tags_cache`.

RLS:
- required.

## `appendix_record_values` — MVP

Purpose: custom field values.

Important columns:
- `id uuid primary key`
- `appendix_record_id uuid references appendix_records(id)`
- `appendix_field_id uuid references appendix_fields(id)`
- `value jsonb`
- `created_at timestamptz`
- `updated_at timestamptz`

Indexes:
- `(appendix_record_id)`
- `(appendix_field_id)`.

RLS:
- required.

## `sources` — MVP

Purpose: normalize source references used by content, appendices, flashcards, and imports.

Important columns:
- `id uuid primary key`
- `course_id uuid references courses(id)`
- `source_type text`
- `title text`
- `author text`
- `url text`
- `citation text`
- `publisher text`
- `published_date date`
- `page_start text`
- `page_end text`
- `metadata jsonb`
- `created_at timestamptz`
- `updated_at timestamptz`

Indexes:
- `(course_id, source_type)`
- full-text index on `title`, `author`, `citation`.

RLS:
- required.

Recommendation:
- yes, use a dedicated `sources` table from MVP. It prevents duplicate source strings and gives imported material, appendix records, and flashcards a shared citation model.

## `assets` — MVP

Purpose: metadata for files stored in Supabase Storage.

Important columns:
- `id uuid primary key`
- `course_id uuid references courses(id)`
- `owner_id uuid references profiles(id)`
- `bucket text`
- `storage_path text`
- `file_name text`
- `mime_type text`
- `file_size_bytes bigint`
- `asset_type text check in image/document/import/export/audio/other`
- `source_id uuid references sources(id)`
- `metadata jsonb`
- `created_at timestamptz`

Indexes:
- `(course_id, asset_type)`
- `(owner_id, created_at desc)`.

RLS:
- required.

## `flashcards` — MVP

Purpose: derived learning objects.

Important columns:
- `id uuid primary key`
- `course_id uuid references courses(id)`
- `card_type text`
- `prompt jsonb`
- `answer jsonb`
- `explanation text`
- `hint text`
- `source_excerpt text`
- `difficulty_level text`
- `language text`
- `related_appendix_record_id uuid references appendix_records(id)`
- `source_warning boolean`
- `mastery_score numeric`
- `confidence_score numeric`
- `due_at timestamptz`
- `interval_days numeric`
- `ease_factor numeric`
- `stability numeric`
- `difficulty numeric`
- `lapses int`
- `review_count int`
- `last_reviewed_at timestamptz`
- `stale_status text check in fresh/stale/needs_review`
- `created_method text check in manual/ai/imported`
- `created_at timestamptz`
- `updated_at timestamptz`

Indexes:
- `(course_id, due_at)`
- `(course_id, stale_status)`
- `(course_id, card_type)`
- full-text index on prompt/answer extracted text.

RLS:
- required.

## `flashcard_sources` — MVP

Purpose: many-to-many traceability between flashcards and source targets.

Important columns:
- `id uuid primary key`
- `flashcard_id uuid references flashcards(id)`
- `source_target_type text check in content_block/text_anchor/appendix_record/source/asset`
- `source_target_id uuid`
- `source_version int`
- `source_hash text`
- `source_excerpt text`
- `created_at timestamptz`

Indexes:
- `(flashcard_id)`
- `(source_target_type, source_target_id)`.

RLS:
- required.

## `review_sessions` — MVP

Purpose: study session metadata.

Important columns:
- `id uuid primary key`
- `course_id uuid references courses(id)`
- `user_id uuid references profiles(id)`
- `mode text`
- `filters jsonb`
- `started_at timestamptz`
- `ended_at timestamptz`
- `duration_seconds int`
- `card_count int`

Indexes:
- `(user_id, started_at desc)`
- `(course_id, started_at desc)`.

RLS:
- required.

## `review_attempts` — MVP

Purpose: individual card answers and scheduling inputs.

Important columns:
- `id uuid primary key`
- `review_session_id uuid references review_sessions(id)`
- `flashcard_id uuid references flashcards(id)`
- `user_id uuid references profiles(id)`
- `answer_payload jsonb`
- `self_rating int`
- `is_correct boolean`
- `ai_evaluation jsonb`
- `user_confirmed_result boolean`
- `response_time_ms int`
- `reviewed_at timestamptz`

Indexes:
- `(flashcard_id, reviewed_at desc)`
- `(user_id, reviewed_at desc)`.

RLS:
- required.

## `study_schedules` — Phase 2

Purpose: target/exam planning and readiness forecasts.

Important columns:
- `id uuid primary key`
- `course_id uuid references courses(id)`
- `target_date date`
- `daily_goal_minutes int`
- `daily_new_cards int`
- `algorithm_config jsonb`
- `created_at timestamptz`
- `updated_at timestamptz`

Indexes:
- `(course_id)`.

RLS:
- required.

## `ai_suggestions` — MVP

Purpose: reviewable AI outputs.

Important columns:
- `id uuid primary key`
- `course_id uuid references courses(id)`
- `suggestion_type text`
- `status text check in pending/accepted/edited/rejected/deferred/stale`
- `title text`
- `summary text`
- `payload jsonb`
- `model text`
- `prompt_version text`
- `risk_level text`
- `created_by_context jsonb`
- `created_at timestamptz`
- `resolved_at timestamptz`

Indexes:
- `(course_id, status)`
- `(course_id, suggestion_type)`.

RLS:
- required.

## `ai_suggestion_targets` — MVP

Purpose: connect AI suggestions to affected records.

Important columns:
- `id uuid primary key`
- `ai_suggestion_id uuid references ai_suggestions(id)`
- `target_type text`
- `target_id uuid`
- `target_version int`
- `target_hash text`

Indexes:
- `(ai_suggestion_id)`
- `(target_type, target_id)`.

RLS:
- required.

## `entity_links` — MVP

Purpose: generalized visible links between content, anchors, appendices, flashcards, sources, assets, sessions, and suggestions.

Important columns:
- `id uuid primary key`
- `course_id uuid references courses(id)`
- `from_type text`
- `from_id uuid`
- `to_type text`
- `to_id uuid`
- `link_type text`
- `anchor_id uuid references content_text_anchors(id)`
- `metadata jsonb`
- `created_method text check in manual/ai/imported/system`
- `created_at timestamptz`

Indexes:
- `(course_id, from_type, from_id)`
- `(course_id, to_type, to_id)`
- `(anchor_id)`.

RLS:
- required.

## `tags` and `taggings` — MVP

Purpose: reusable tags across courses, blocks, appendix records, flashcards, and sources.

Important columns:
- `tags`: `id`, `course_id`, `name`, `slug`, `color`
- `taggings`: `id`, `tag_id`, `target_type`, `target_id`, `created_at`

Indexes:
- `tags(course_id, slug unique)`
- `taggings(target_type, target_id)`
- `taggings(tag_id)`.

RLS:
- required.

## `course_metrics` — MVP-lite

Purpose: cached size and progress metrics.

Important columns:
- `course_id uuid primary key references courses(id)`
- `word_count int`
- `character_count int`
- `sentence_count int`
- `heading_count int`
- `content_block_count int`
- `appendix_record_count int`
- `flashcard_count int`
- `token_estimate int`
- `due_card_count int`
- `weak_card_count int`
- `coverage_percent numeric`
- `updated_at timestamptz`

Indexes:
- primary key.

RLS:
- required.

# Relationships and Linking Model

- A user owns many courses.
- A course owns nodes, content blocks, appendix tables, appendix records, flashcards, sources, assets, tags, AI suggestions, and review sessions.
- Course hierarchy lives in `course_nodes`; content lives in `content_blocks`.
- Appendix records are source-of-truth reference records and can link to content blocks, text anchors, sources, assets, and flashcards.
- Flashcards link to one or more source targets through `flashcard_sources`.
- `entity_links` provides the general graph for UI visibility: selected block, sentence, phrase, appendix item, or flashcard can show related objects.
- Exact text links should use `content_text_anchors` with offsets, selected text, context, block version, and hash.
- When content changes, anchors with mismatched version/hash become `needs_review`; flashcards sourced from changed blocks become `stale` or `needs_review`.

# Content Editor UX

MVP:
- Single editor-like content surface with no separate course tree pane.
- Inline course structure headings backed by `course_nodes`, rendered in preorder with content blocks below each heading.
- Compact top toolbar for full-course search, current heading context, and jump-to-heading navigation.
- Central monospaced block editor with a quiet numbering gutter and inline structural indentation.
- Text-like right minimap with density stripes, semantic markers, and click-to-jump behavior.
- Breadcrumb navigation.
- Basic tabs: Content, Appendices, Flashcards, Study, Analytics.
- Block types: heading, paragraph, definition, note, warning, example, image.
- Hierarchical indentation and display numbering.
- Collapsible headings at practical levels.
- Hover/focus controls for adding child headings, adding content blocks, linking appendices, and suggesting flashcards.

Deferred:
- Full glyph-level VS Code-like minimap with viewport syncing.
- Visual branch lines across all nesting depths.
- Unlimited nested collapsible headings with virtualization.
- Advanced table/formula editing.
- Richer minimap overlays for definitions, images, formulas, links, AI suggestions, and review coverage.

Numbering recommendation:
- Store hierarchy order structurally, not as only text.
- `numbering_path` should contain tokens such as `{ level, style, ordinal, label }`.
- `display_number` is computed/cached.
- MVP supports `I → A → a → iv → 1`.
- Later levels use a compact fallback like `§1.IV.A.iv.a.1.2.3`.
- UI should allow a course-level numbering preset later, but MVP can use one default preset.

# Appendices UX

MVP:
- Default tables: Images, Persons, Events, Places, Definitions.
- Manual record creation and editing.
- Basic custom tables with simple custom fields.
- Images stored in Storage and represented as appendix records.
- Source field backed by the `sources` table.
- Link a content block to an appendix record.
- Link selected text to appendix record where the editor supports stable selection.

Deferred:
- Custom relationship fields between appendix tables.
- Custom display views.
- AI-assisted merge/dedup workflows.
- Rich multilingual field-level editing.
- Exact phrase-link repair UI after major edits.

Default appendix record fields:
- title/name
- type
- short description
- linked content locations
- source
- language
- tags
- aliases/translations
- related flashcards
- user notes
- last updated date

# Flashcards and Review System

MVP card types:
- Basic Q&A
- Definition
- Cloze
- True/false
- Person
- Image-based

Default fields:
- prompt/question
- answer
- explanation
- hint
- source link
- source excerpt
- difficulty
- tags
- language
- card type
- related appendix item
- review history
- confidence/mastery score
- user notes

MVP scheduling:
- Use an SM-2-inspired algorithm with `again/hard/good/easy`.
- Track due date, interval, ease factor, lapses, review count, confidence, and mastery.
- Weak cards are cards with recent incorrect attempts, low self-rating, low mastery, or repeated lapses.

Later scheduling:
- Add FSRS-style stability/difficulty modeling.
- Add exam-date planning, daily workload balancing, readiness forecast, and mastery decay.
- Add adaptive study recommendations by weak section, tag, appendix table, or concept.

Study modes:
- MVP: due cards, new cards, one section, one appendix table, weak cards, tag focus.
- Later: exam prep, random mixed, timeline/date practice, image recognition, mock exams.

# AI Assistance Architecture

AI calls:
- Run only through Supabase Edge Functions.
- Send the smallest relevant context: selected blocks, appendix records, source excerpts, tags, language, and requested output type.
- Do not send unrelated course data, private profile data, auth data, or full files unless the user explicitly runs an import/analyze action.

AI suggestions:
- Store in `ai_suggestions` and connect to affected records through `ai_suggestion_targets`.
- Suggestions remain pending until the user accepts, edits, rejects, or defers.
- Accepted flashcard suggestions create flashcards linked to source records.
- Accepted appendix suggestions create or update appendix records.
- Source-of-truth content changes require preview and explicit confirmation.

Stale flashcard detection:
- Store source version/hash on `flashcard_sources`.
- On content or appendix update, compare current hash/version with stored source hash/version.
- Mark affected cards `stale` or `needs_review`.
- Offer suggested updates with source excerpt comparison.

MVP AI:
- Generate flashcard suggestions from selected content blocks or appendix records.
- Detect possible appendix entities from selected text.
- Optional typed-answer evaluation with user confirmation.

Deferred AI:
- Full import pipeline.
- Inconsistency detection across a full course.
- Duplicate detection and merge suggestions.
- Study plan generation and mock exams.

# Analytics and Progress Tracking

MVP metrics:
- cards created
- cards reviewed
- correct/incorrect attempts
- due cards
- weak cards
- time spent studying
- mastery per card
- basic mastery per course
- basic coverage: content blocks or appendix records with at least one linked flashcard

Phase 2:
- mastery per section/chapter/module.
- coverage by content, appendix table, source, tag.
- study streaks and daily goals.
- target-date forecast.

Phase 3:
- readiness forecast with decay.
- exam-prep simulation.
- weak-topic clustering.
- semantic coverage analysis.

Aggregation:
- Store raw events in `review_attempts`.
- Cache dashboard numbers in `course_metrics`.
- Later use scheduled functions/materialized views for heavier rollups.

# Multilingual Strategy

- Courses have a main language.
- Content blocks can override language.
- Appendix records store primary language plus aliases/translations.
- Flashcards carry language independently.
- Tags can be language-neutral or localized later.
- UI copy should be i18n-ready from the start, though MVP can ship English UI first.
- Dutch, French, and English content can coexist within one course.

# Import / Export Strategy

MVP:
- Paste text into an import wizard.
- Split pasted text into headings and paragraphs.
- CSV import/export for flashcards.
- CSV import for appendix records.
- Full course JSON export.

Phase 2:
- PDF and Word import with user-reviewed structure extraction.
- Excel appendix import.
- Anki-compatible export.
- Basic PDF export.

Phase 3:
- Word export.
- Advanced PDF layout.
- AI import flow detecting structure, appendices, entities, flashcards, and sources.
- Re-import/update workflows with duplicate detection.

# Mobile and Responsive Strategy

- Mobile-first for course library, dashboard, flashcard review, quick study, and search.
- Desktop-first for advanced content editing, appendix schema editing, imports, and analytics.
- On mobile, collapse explorer/minimap into drawers.
- Review cards should be large, touch-friendly, and fast.
- Editor should remain usable on mobile but advanced outline manipulation can be desktop-optimized.

# MVP Scope

Include:
- Auth and profiles.
- Course library and course creation.
- Course metadata.
- Basic hierarchy: module, chapter, section, subsection.
- Block editor with core block types.
- Basic academic numbering.
- Manual appendices with default tables.
- Simple custom appendix fields.
- Sources table.
- Asset upload for images/documents metadata.
- Manual flashcards.
- Basic source linking at block/appendix level.
- Simple text-span anchors where feasible.
- AI-generated flashcard suggestions from selected content/appendices.
- SM-2-inspired spaced repetition.
- Due-card review.
- Basic analytics and coverage.
- Responsive layout.

# Phase 2

Add:
- Full content block version history.
- Better exact text-span anchoring and repair.
- Rich custom appendix views.
- Custom appendix relationships.
- AI entity detection and appendix suggestions.
- Stale flashcard update suggestions.
- PDF/Word import.
- Excel import.
- Anki export.
- Section/chapter mastery analytics.
- Study schedules and target-date planning.
- Minimap viewport syncing and richer semantic markers.

# Phase 3

Add:
- Advanced glyph-level VS Code-style minimap.
- Visual learning map and branch lines.
- Advanced formula/table editing.
- Full AI import pipeline.
- AI inconsistency and duplicate detection.
- Mock exams and quiz generation.
- FSRS-style scheduling.
- Readiness forecast with mastery decay.
- Advanced multilingual workflows.
- Full PDF/Word export.
- Collaboration if desired.

# Technical Risks and Simplifications

Risks:
- Stable exact text-span anchoring is difficult when content changes.
- Unlimited nested headings can become hard to render and navigate without virtualization.
- Custom appendix relationships can turn into a database-builder product.
- Full PDF/Word import/export is complex and format-sensitive.
- AI-generated source-of-truth edits need careful safety controls.
- Readiness forecasting requires enough review data to be meaningful.
- Rich editor behavior can become the largest engineering surface.

MVP simplifications:
- Start with block-level links; add exact spans carefully.
- Support default appendix tables plus simple custom fields only.
- Use one numbering preset.
- Start with a text-like minimap rail before exact glyph rendering and viewport syncing.
- Use SM-2-inspired scheduling before FSRS/readiness forecasting.
- Import pasted text and CSV first.
- Export JSON and flashcard CSV first.
- Keep AI to suggestions, not direct edits.

# Implementation Plan

1. Foundation
- Create React/TypeScript/Tailwind/shadcn app.
- Configure Supabase client, Auth, routing, protected layouts.
- Add profiles, courses, course metadata, tags, RLS.

2. Course Workspace
- Build dashboard, course library, course creation, workspace shell.
- Add course tabs and responsive navigation.

3. Content Model and Editor
- Add `course_nodes` and `content_blocks`.
- Implement explorer, breadcrumb, block editor, numbering, basic collapse, search, focus mode.

4. Appendices and Sources
- Add default appendix tables, fields, records, sources, assets.
- Implement appendix table UI, record editor, image records, source selection.

5. Linking System
- Add `entity_links`, `flashcard_sources`, and MVP anchors.
- Implement selected block/record/card linked-object panels.
- Add source warning for unlinked flashcards.

6. Flashcards
- Add flashcard CRUD.
- Support default card types.
- Add manual creation from content blocks and appendix records.

7. Review System
- Add review sessions and attempts.
- Implement SM-2-inspired due scheduling.
- Build due-card review, weak-card filters, section and appendix study modes.

8. AI Suggestions
- Add Edge Function pattern for AI calls.
- Implement flashcard suggestions from selected content/appendices.
- Store suggestions, targets, source excerpts, accept/edit/reject/defer flow.

9. Analytics
- Add course metrics rollups.
- Show due cards, weak cards, review counts, time spent, coverage, basic mastery.

10. Import/Export
- Add paste import with heading/paragraph splitting.
- Add CSV appendix import.
- Add flashcard CSV and full JSON export.

11. Hardening
- Add RLS tests/manual verification.
- Add integration tests for source links and stale detection.
- Add responsive QA for mobile study flows and desktop editor.

# Approval Request

Please review and approve this plan before implementation begins, especially the MVP simplifications, the Supabase schema direction, and the decision to keep AI as suggestion-only for source-of-truth changes.
