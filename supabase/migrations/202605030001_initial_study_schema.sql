create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  preferred_language text default 'en',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.courses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text default '',
  main_language text not null default 'en',
  subject text default '',
  difficulty_level text not null default 'intermediate' check (difficulty_level in ('intro', 'intermediate', 'advanced')),
  status text not null default 'draft' check (status in ('draft', 'active', 'completed', 'archived')),
  exam_date date,
  target_date date,
  source_type text default 'mixed',
  estimated_study_minutes int not null default 0,
  mastery_score numeric not null default 0 check (mastery_score >= 0 and mastery_score <= 100),
  confidence_score numeric not null default 0 check (confidence_score >= 0 and confidence_score <= 100),
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.is_course_owner(course_uuid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.courses c
    where c.id = course_uuid
      and c.owner_id = auth.uid()
  );
$$;

create table public.course_nodes (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  parent_id uuid references public.course_nodes(id) on delete cascade,
  node_type text not null check (node_type in ('module', 'chapter', 'section', 'subsection', 'heading')),
  title text not null,
  position int not null default 1,
  depth int not null default 0,
  numbering_path jsonb not null default '[]'::jsonb,
  display_number text default '',
  language text not null default 'en',
  is_collapsed_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.content_blocks (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  node_id uuid not null references public.course_nodes(id) on delete cascade,
  parent_block_id uuid references public.content_blocks(id) on delete set null,
  block_type text not null check (block_type in ('heading', 'paragraph', 'definition', 'quote', 'example', 'note', 'warning', 'table', 'image', 'formula', 'question', 'summary')),
  position int not null default 1,
  depth int not null default 0,
  content jsonb not null default '{}'::jsonb,
  plain_text text not null default '',
  language text not null default 'en',
  numbering_path jsonb not null default '[]'::jsonb,
  display_number text default '',
  is_collapsible boolean not null default false,
  is_collapsed boolean not null default false,
  version int not null default 1,
  content_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.content_block_versions (
  id uuid primary key default gen_random_uuid(),
  content_block_id uuid not null references public.content_blocks(id) on delete cascade,
  version int not null,
  content jsonb not null,
  plain_text text not null default '',
  content_hash text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (content_block_id, version)
);

create table public.content_text_anchors (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  content_block_id uuid not null references public.content_blocks(id) on delete cascade,
  block_version int not null,
  start_offset int not null check (start_offset >= 0),
  end_offset int not null check (end_offset >= start_offset),
  selected_text text not null,
  prefix_context text,
  suffix_context text,
  text_hash text,
  anchor_status text not null default 'active' check (anchor_status in ('active', 'stale', 'needs_review')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.sources (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  source_type text not null default 'other',
  title text not null,
  author text,
  url text,
  citation text,
  publisher text,
  published_date date,
  page_start text,
  page_end text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.appendix_tables (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  name text not null,
  slug text not null,
  table_type text not null check (table_type in ('images', 'persons', 'events', 'places', 'definitions', 'custom')),
  is_default boolean not null default false,
  description text default '',
  position int not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (course_id, slug)
);

create table public.appendix_fields (
  id uuid primary key default gen_random_uuid(),
  appendix_table_id uuid not null references public.appendix_tables(id) on delete cascade,
  name text not null,
  slug text not null,
  field_type text not null check (field_type in ('text', 'long_text', 'number', 'date', 'url', 'select', 'multi_select', 'image', 'file')),
  is_required boolean not null default false,
  position int not null default 1,
  options jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (appendix_table_id, slug)
);

create table public.appendix_records (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  appendix_table_id uuid not null references public.appendix_tables(id) on delete cascade,
  title text not null,
  record_type text not null default 'custom',
  short_description text default '',
  source_id uuid references public.sources(id) on delete set null,
  language text not null default 'en',
  aliases jsonb not null default '[]'::jsonb,
  translations jsonb not null default '{}'::jsonb,
  tags_cache text[] not null default '{}',
  user_notes text default '',
  version int not null default 1,
  record_hash text,
  created_method text not null default 'manual' check (created_method in ('manual', 'imported', 'ai_suggested')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.appendix_record_values (
  id uuid primary key default gen_random_uuid(),
  appendix_record_id uuid not null references public.appendix_records(id) on delete cascade,
  appendix_field_id uuid not null references public.appendix_fields(id) on delete cascade,
  value jsonb not null default 'null'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (appendix_record_id, appendix_field_id)
);

create table public.assets (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  bucket text not null,
  storage_path text not null,
  file_name text not null,
  mime_type text not null,
  file_size_bytes bigint not null default 0,
  asset_type text not null check (asset_type in ('image', 'document', 'import', 'export', 'audio', 'other')),
  source_id uuid references public.sources(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (bucket, storage_path)
);

create table public.flashcards (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  card_type text not null check (card_type in ('basic', 'definition', 'cloze', 'true_false', 'person', 'image')),
  prompt jsonb not null default '{}'::jsonb,
  answer jsonb not null default '{}'::jsonb,
  explanation text default '',
  hint text default '',
  source_excerpt text default '',
  difficulty_level text not null default 'intermediate' check (difficulty_level in ('intro', 'intermediate', 'advanced')),
  tags text[] not null default '{}',
  language text not null default 'en',
  related_appendix_record_id uuid references public.appendix_records(id) on delete set null,
  source_warning boolean not null default true,
  mastery_score numeric not null default 0 check (mastery_score >= 0 and mastery_score <= 100),
  confidence_score numeric not null default 0 check (confidence_score >= 0 and confidence_score <= 100),
  due_at timestamptz not null default now(),
  interval_days numeric not null default 0,
  ease_factor numeric not null default 2.5,
  stability numeric not null default 0,
  difficulty numeric not null default 0.5,
  lapses int not null default 0,
  review_count int not null default 0,
  last_reviewed_at timestamptz,
  stale_status text not null default 'fresh' check (stale_status in ('fresh', 'stale', 'needs_review')),
  created_method text not null default 'manual' check (created_method in ('manual', 'ai', 'imported')),
  user_notes text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.flashcard_sources (
  id uuid primary key default gen_random_uuid(),
  flashcard_id uuid not null references public.flashcards(id) on delete cascade,
  source_target_type text not null check (source_target_type in ('content_block', 'text_anchor', 'appendix_record', 'source', 'asset')),
  source_target_id uuid not null,
  source_version int,
  source_hash text,
  source_excerpt text default '',
  created_at timestamptz not null default now()
);

create table public.review_sessions (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  mode text not null,
  filters jsonb not null default '{}'::jsonb,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  duration_seconds int not null default 0,
  card_count int not null default 0
);

create table public.review_attempts (
  id uuid primary key default gen_random_uuid(),
  review_session_id uuid not null references public.review_sessions(id) on delete cascade,
  flashcard_id uuid not null references public.flashcards(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  answer_payload jsonb not null default '{}'::jsonb,
  self_rating int check (self_rating between 1 and 5),
  is_correct boolean,
  ai_evaluation jsonb,
  user_confirmed_result boolean not null default true,
  response_time_ms int not null default 0,
  reviewed_at timestamptz not null default now()
);

create table public.study_schedules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  target_date date,
  daily_goal_minutes int not null default 0,
  daily_new_cards int not null default 0,
  algorithm_config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.ai_suggestions (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  suggestion_type text not null,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'edited', 'rejected', 'deferred', 'stale')),
  title text not null,
  summary text default '',
  payload jsonb not null default '{}'::jsonb,
  model text,
  prompt_version text,
  risk_level text not null default 'low' check (risk_level in ('low', 'medium', 'high')),
  created_by_context jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table public.ai_suggestion_targets (
  id uuid primary key default gen_random_uuid(),
  ai_suggestion_id uuid not null references public.ai_suggestions(id) on delete cascade,
  target_type text not null,
  target_id uuid not null,
  target_version int,
  target_hash text
);

create table public.entity_links (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  from_type text not null,
  from_id uuid not null,
  to_type text not null,
  to_id uuid not null,
  link_type text not null,
  anchor_id uuid references public.content_text_anchors(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_method text not null default 'manual' check (created_method in ('manual', 'ai', 'imported', 'system')),
  created_at timestamptz not null default now()
);

create table public.tags (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  name text not null,
  slug text not null,
  color text,
  created_at timestamptz not null default now(),
  unique (course_id, slug)
);

create table public.taggings (
  id uuid primary key default gen_random_uuid(),
  tag_id uuid not null references public.tags(id) on delete cascade,
  target_type text not null,
  target_id uuid not null,
  created_at timestamptz not null default now(),
  unique (tag_id, target_type, target_id)
);

create table public.course_metrics (
  course_id uuid primary key references public.courses(id) on delete cascade,
  word_count int not null default 0,
  character_count int not null default 0,
  sentence_count int not null default 0,
  heading_count int not null default 0,
  content_block_count int not null default 0,
  appendix_record_count int not null default 0,
  flashcard_count int not null default 0,
  token_estimate int not null default 0,
  due_card_count int not null default 0,
  weak_card_count int not null default 0,
  coverage_percent numeric not null default 0,
  updated_at timestamptz not null default now()
);

create index courses_owner_status_idx on public.courses(owner_id, status);
create index courses_owner_updated_idx on public.courses(owner_id, updated_at desc);
create index courses_search_idx on public.courses using gin (to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(description, '') || ' ' || coalesce(subject, '')));

create index course_nodes_parent_idx on public.course_nodes(course_id, parent_id, position);
create index course_nodes_depth_idx on public.course_nodes(course_id, depth);
create index course_nodes_search_idx on public.course_nodes using gin (to_tsvector('simple', coalesce(title, '')));

create index content_blocks_node_idx on public.content_blocks(course_id, node_id, position);
create index content_blocks_type_idx on public.content_blocks(course_id, block_type);
create index content_blocks_search_idx on public.content_blocks using gin (to_tsvector('simple', coalesce(plain_text, '')));
create index content_block_versions_block_idx on public.content_block_versions(content_block_id, version desc);
create index content_text_anchors_block_idx on public.content_text_anchors(content_block_id);
create index content_text_anchors_status_idx on public.content_text_anchors(course_id, anchor_status);

create index sources_course_type_idx on public.sources(course_id, source_type);
create index sources_search_idx on public.sources using gin (to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(author, '') || ' ' || coalesce(citation, '')));

create index appendix_tables_type_idx on public.appendix_tables(course_id, table_type);
create index appendix_fields_position_idx on public.appendix_fields(appendix_table_id, position);
create index appendix_records_table_idx on public.appendix_records(course_id, appendix_table_id);
create index appendix_records_search_idx on public.appendix_records using gin (to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(short_description, '')));
create index appendix_records_aliases_idx on public.appendix_records using gin (aliases);
create index appendix_records_translations_idx on public.appendix_records using gin (translations);
create index appendix_records_tags_idx on public.appendix_records using gin (tags_cache);
create index appendix_record_values_record_idx on public.appendix_record_values(appendix_record_id);
create index appendix_record_values_field_idx on public.appendix_record_values(appendix_field_id);

create index assets_course_type_idx on public.assets(course_id, asset_type);
create index assets_owner_created_idx on public.assets(owner_id, created_at desc);

create index flashcards_due_idx on public.flashcards(course_id, due_at);
create index flashcards_stale_idx on public.flashcards(course_id, stale_status);
create index flashcards_type_idx on public.flashcards(course_id, card_type);
create index flashcards_search_idx on public.flashcards using gin (to_tsvector('simple', coalesce(prompt::text, '') || ' ' || coalesce(answer::text, '')));
create index flashcard_sources_card_idx on public.flashcard_sources(flashcard_id);
create index flashcard_sources_target_idx on public.flashcard_sources(source_target_type, source_target_id);

create index review_sessions_user_idx on public.review_sessions(user_id, started_at desc);
create index review_sessions_course_idx on public.review_sessions(course_id, started_at desc);
create index review_attempts_card_idx on public.review_attempts(flashcard_id, reviewed_at desc);
create index review_attempts_user_idx on public.review_attempts(user_id, reviewed_at desc);

create index study_schedules_course_idx on public.study_schedules(course_id);
create index ai_suggestions_status_idx on public.ai_suggestions(course_id, status);
create index ai_suggestions_type_idx on public.ai_suggestions(course_id, suggestion_type);
create index ai_suggestion_targets_suggestion_idx on public.ai_suggestion_targets(ai_suggestion_id);
create index ai_suggestion_targets_target_idx on public.ai_suggestion_targets(target_type, target_id);
create index entity_links_from_idx on public.entity_links(course_id, from_type, from_id);
create index entity_links_to_idx on public.entity_links(course_id, to_type, to_id);
create index entity_links_anchor_idx on public.entity_links(anchor_id);
create index taggings_target_idx on public.taggings(target_type, target_id);
create index taggings_tag_idx on public.taggings(tag_id);

create trigger profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger courses_updated_at before update on public.courses for each row execute function public.set_updated_at();
create trigger course_nodes_updated_at before update on public.course_nodes for each row execute function public.set_updated_at();
create trigger content_blocks_updated_at before update on public.content_blocks for each row execute function public.set_updated_at();
create trigger content_text_anchors_updated_at before update on public.content_text_anchors for each row execute function public.set_updated_at();
create trigger sources_updated_at before update on public.sources for each row execute function public.set_updated_at();
create trigger appendix_tables_updated_at before update on public.appendix_tables for each row execute function public.set_updated_at();
create trigger appendix_records_updated_at before update on public.appendix_records for each row execute function public.set_updated_at();
create trigger appendix_record_values_updated_at before update on public.appendix_record_values for each row execute function public.set_updated_at();
create trigger flashcards_updated_at before update on public.flashcards for each row execute function public.set_updated_at();
create trigger study_schedules_updated_at before update on public.study_schedules for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, preferred_language)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)), 'en')
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.courses enable row level security;
alter table public.course_nodes enable row level security;
alter table public.content_blocks enable row level security;
alter table public.content_block_versions enable row level security;
alter table public.content_text_anchors enable row level security;
alter table public.sources enable row level security;
alter table public.appendix_tables enable row level security;
alter table public.appendix_fields enable row level security;
alter table public.appendix_records enable row level security;
alter table public.appendix_record_values enable row level security;
alter table public.assets enable row level security;
alter table public.flashcards enable row level security;
alter table public.flashcard_sources enable row level security;
alter table public.review_sessions enable row level security;
alter table public.review_attempts enable row level security;
alter table public.study_schedules enable row level security;
alter table public.ai_suggestions enable row level security;
alter table public.ai_suggestion_targets enable row level security;
alter table public.entity_links enable row level security;
alter table public.tags enable row level security;
alter table public.taggings enable row level security;
alter table public.course_metrics enable row level security;

create policy profiles_own_select on public.profiles for select using (id = auth.uid());
create policy profiles_own_update on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());

create policy courses_owner_all on public.courses for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy course_nodes_owner_all on public.course_nodes for all using (public.is_course_owner(course_id)) with check (public.is_course_owner(course_id));
create policy content_blocks_owner_all on public.content_blocks for all using (public.is_course_owner(course_id)) with check (public.is_course_owner(course_id));
create policy content_text_anchors_owner_all on public.content_text_anchors for all using (public.is_course_owner(course_id)) with check (public.is_course_owner(course_id));
create policy sources_owner_all on public.sources for all using (public.is_course_owner(course_id)) with check (public.is_course_owner(course_id));
create policy appendix_tables_owner_all on public.appendix_tables for all using (public.is_course_owner(course_id)) with check (public.is_course_owner(course_id));
create policy appendix_records_owner_all on public.appendix_records for all using (public.is_course_owner(course_id)) with check (public.is_course_owner(course_id));
create policy assets_owner_all on public.assets for all using (public.is_course_owner(course_id) and owner_id = auth.uid()) with check (public.is_course_owner(course_id) and owner_id = auth.uid());
create policy flashcards_owner_all on public.flashcards for all using (public.is_course_owner(course_id)) with check (public.is_course_owner(course_id));
create policy review_sessions_owner_all on public.review_sessions for all using (public.is_course_owner(course_id) and user_id = auth.uid()) with check (public.is_course_owner(course_id) and user_id = auth.uid());
create policy study_schedules_owner_all on public.study_schedules for all using (public.is_course_owner(course_id)) with check (public.is_course_owner(course_id));
create policy ai_suggestions_owner_all on public.ai_suggestions for all using (public.is_course_owner(course_id)) with check (public.is_course_owner(course_id));
create policy entity_links_owner_all on public.entity_links for all using (public.is_course_owner(course_id)) with check (public.is_course_owner(course_id));
create policy tags_owner_all on public.tags for all using (public.is_course_owner(course_id)) with check (public.is_course_owner(course_id));
create policy course_metrics_owner_all on public.course_metrics for all using (public.is_course_owner(course_id)) with check (public.is_course_owner(course_id));

create policy content_block_versions_owner_all on public.content_block_versions
for all using (
  exists (
    select 1 from public.content_blocks b
    where b.id = content_block_id and public.is_course_owner(b.course_id)
  )
) with check (
  exists (
    select 1 from public.content_blocks b
    where b.id = content_block_id and public.is_course_owner(b.course_id)
  )
);

create policy appendix_fields_owner_all on public.appendix_fields
for all using (
  exists (
    select 1 from public.appendix_tables t
    where t.id = appendix_table_id and public.is_course_owner(t.course_id)
  )
) with check (
  exists (
    select 1 from public.appendix_tables t
    where t.id = appendix_table_id and public.is_course_owner(t.course_id)
  )
);

create policy appendix_record_values_owner_all on public.appendix_record_values
for all using (
  exists (
    select 1 from public.appendix_records r
    where r.id = appendix_record_id and public.is_course_owner(r.course_id)
  )
) with check (
  exists (
    select 1 from public.appendix_records r
    where r.id = appendix_record_id and public.is_course_owner(r.course_id)
  )
);

create policy flashcard_sources_owner_all on public.flashcard_sources
for all using (
  exists (
    select 1 from public.flashcards f
    where f.id = flashcard_id and public.is_course_owner(f.course_id)
  )
) with check (
  exists (
    select 1 from public.flashcards f
    where f.id = flashcard_id and public.is_course_owner(f.course_id)
  )
);

create policy review_attempts_owner_all on public.review_attempts
for all using (
  user_id = auth.uid()
  and exists (
    select 1 from public.review_sessions s
    where s.id = review_session_id and public.is_course_owner(s.course_id)
  )
) with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.review_sessions s
    where s.id = review_session_id and public.is_course_owner(s.course_id)
  )
);

create policy ai_suggestion_targets_owner_all on public.ai_suggestion_targets
for all using (
  exists (
    select 1 from public.ai_suggestions s
    where s.id = ai_suggestion_id and public.is_course_owner(s.course_id)
  )
) with check (
  exists (
    select 1 from public.ai_suggestions s
    where s.id = ai_suggestion_id and public.is_course_owner(s.course_id)
  )
);

create policy taggings_owner_all on public.taggings
for all using (
  exists (
    select 1 from public.tags t
    where t.id = tag_id and public.is_course_owner(t.course_id)
  )
) with check (
  exists (
    select 1 from public.tags t
    where t.id = tag_id and public.is_course_owner(t.course_id)
  )
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('course-images', 'course-images', false, 52428800, array['image/png', 'image/jpeg', 'image/webp', 'image/gif']),
  ('course-documents', 'course-documents', false, 52428800, array['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'text/csv']),
  ('course-exports', 'course-exports', false, 52428800, null)
on conflict (id) do nothing;

create policy storage_course_images_owner on storage.objects
for all using (
  bucket_id in ('course-images', 'course-documents', 'course-exports')
  and (storage.foldername(name))[1] = auth.uid()::text
) with check (
  bucket_id in ('course-images', 'course-documents', 'course-exports')
  and (storage.foldername(name))[1] = auth.uid()::text
);
