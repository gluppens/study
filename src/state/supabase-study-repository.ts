import type { SupabaseClient } from "@supabase/supabase-js"
import type {
  AiSuggestion,
  AiSuggestionTarget,
  AppendixField,
  AppendixRecord,
  AppendixRecordValue,
  AppendixTable,
  Asset,
  ContentBlock,
  ContentBlockVersion,
  ContentTextAnchor,
  Course,
  CourseMetrics,
  CourseNode,
  EntityLink,
  Flashcard,
  FlashcardSource,
  Language,
  NumberingToken,
  ReviewAttempt,
  ReviewSession,
  Source,
  StudyData,
  StudySchedule,
  Tag,
  Tagging,
} from "@/domain/types"

type JsonRecord = Record<string, unknown>

interface CourseRow {
  id: string
  owner_id: string
  title: string
  description: string | null
  main_language: string
  subject: string | null
  difficulty_level: string
  status: string
  exam_date: string | null
  target_date: string | null
  source_type: string | null
  estimated_study_minutes: number | string | null
  mastery_score: number | string | null
  confidence_score: number | string | null
  tags: string[] | null
  created_at: string
  updated_at: string
}

interface CourseNodeRow {
  id: string
  course_id: string
  parent_id: string | null
  node_type: string
  title: string
  position: number
  depth: number
  numbering_path: unknown
  display_number: string | null
  language: string
  is_collapsed_default: boolean
  created_at: string
  updated_at: string
}

interface ContentBlockRow {
  id: string
  course_id: string
  node_id: string
  parent_block_id: string | null
  block_type: string
  position: number
  depth: number
  content: unknown
  plain_text: string
  language: string
  numbering_path: unknown
  display_number: string | null
  is_collapsible: boolean
  is_collapsed: boolean
  version: number
  content_hash: string | null
  created_at: string
  updated_at: string
}

interface ContentBlockVersionRow {
  id: string
  content_block_id: string
  version: number
  content: unknown
  plain_text: string
  content_hash: string | null
  created_by: string | null
  created_at: string
}

interface ContentTextAnchorRow {
  id: string
  course_id: string
  content_block_id: string
  block_version: number
  start_offset: number
  end_offset: number
  selected_text: string
  prefix_context: string | null
  suffix_context: string | null
  text_hash: string | null
  anchor_status: string
  created_at: string
  updated_at: string
}

interface AppendixTableRow {
  id: string
  course_id: string
  name: string
  slug: string
  table_type: string
  is_default: boolean
  description: string | null
  position: number
  created_at: string
  updated_at: string
}

interface AppendixFieldRow {
  id: string
  appendix_table_id: string
  name: string
  slug: string
  field_type: string
  is_required: boolean
  position: number
  options: unknown
  created_at: string
}

interface AppendixRecordRow {
  id: string
  course_id: string
  appendix_table_id: string
  title: string
  record_type: string
  short_description: string | null
  source_id: string | null
  language: string
  aliases: unknown
  translations: unknown
  tags_cache: string[] | null
  user_notes: string | null
  version: number
  record_hash: string | null
  created_method: string
  created_at: string
  updated_at: string
}

interface AppendixRecordValueRow {
  id: string
  appendix_record_id: string
  appendix_field_id: string
  value: unknown
  created_at: string
  updated_at: string
}

interface SourceRow {
  id: string
  course_id: string
  source_type: string
  title: string
  author: string | null
  url: string | null
  citation: string | null
  publisher: string | null
  published_date: string | null
  page_start: string | null
  page_end: string | null
  metadata: unknown
  created_at: string
  updated_at: string
}

interface AssetRow {
  id: string
  course_id: string
  owner_id: string
  bucket: string
  storage_path: string
  file_name: string
  mime_type: string
  file_size_bytes: number | string
  asset_type: string
  source_id: string | null
  metadata: unknown
  created_at: string
}

interface FlashcardRow {
  id: string
  course_id: string
  card_type: string
  prompt: unknown
  answer: unknown
  explanation: string | null
  hint: string | null
  source_excerpt: string | null
  difficulty_level: string
  tags: string[] | null
  language: string
  related_appendix_record_id: string | null
  source_warning: boolean
  mastery_score: number | string
  confidence_score: number | string
  due_at: string
  interval_days: number | string
  ease_factor: number | string
  stability: number | string
  difficulty: number | string
  lapses: number
  review_count: number
  last_reviewed_at: string | null
  stale_status: string
  created_method: string
  user_notes: string | null
  created_at: string
  updated_at: string
}

interface FlashcardSourceRow {
  id: string
  flashcard_id: string
  source_target_type: string
  source_target_id: string
  source_version: number | null
  source_hash: string | null
  source_excerpt: string | null
  created_at: string
}

interface ReviewSessionRow {
  id: string
  course_id: string
  user_id: string
  mode: string
  filters: unknown
  started_at: string
  ended_at: string | null
  duration_seconds: number
  card_count: number
}

interface ReviewAttemptRow {
  id: string
  review_session_id: string
  flashcard_id: string
  user_id: string
  answer_payload: unknown
  self_rating: number
  is_correct: boolean | null
  ai_evaluation: unknown
  user_confirmed_result: boolean
  response_time_ms: number
  reviewed_at: string
}

interface StudyScheduleRow {
  id: string
  course_id: string
  target_date: string | null
  daily_goal_minutes: number
  daily_new_cards: number
  algorithm_config: unknown
  created_at: string
  updated_at: string
}

interface AiSuggestionRow {
  id: string
  course_id: string
  suggestion_type: string
  status: string
  title: string
  summary: string | null
  payload: unknown
  model: string | null
  prompt_version: string | null
  risk_level: string
  created_by_context: unknown
  created_at: string
  resolved_at: string | null
}

interface AiSuggestionTargetRow {
  id: string
  ai_suggestion_id: string
  target_type: string
  target_id: string
  target_version: number | null
  target_hash: string | null
}

interface EntityLinkRow {
  id: string
  course_id: string
  from_type: string
  from_id: string
  to_type: string
  to_id: string
  link_type: string
  anchor_id: string | null
  metadata: unknown
  created_method: string
  created_at: string
}

interface TagRow {
  id: string
  course_id: string
  name: string
  slug: string
  color: string | null
  created_at: string
}

interface TaggingRow {
  id: string
  tag_id: string
  target_type: string
  target_id: string
  created_at: string
}

interface CourseMetricsRow {
  course_id: string
  word_count: number
  character_count: number
  sentence_count: number
  heading_count: number
  content_block_count: number
  appendix_record_count: number
  flashcard_count: number
  token_estimate: number
  due_card_count: number
  weak_card_count: number
  coverage_percent: number | string
  updated_at: string
}

export interface SupabaseStudyPatch {
  courses?: Course[]
  courseNodes?: CourseNode[]
  contentBlocks?: ContentBlock[]
  contentBlockVersions?: ContentBlockVersion[]
  contentTextAnchors?: ContentTextAnchor[]
  appendixTables?: AppendixTable[]
  appendixFields?: AppendixField[]
  appendixRecords?: AppendixRecord[]
  appendixRecordValues?: AppendixRecordValue[]
  sources?: Source[]
  assets?: Asset[]
  flashcards?: Flashcard[]
  flashcardSources?: FlashcardSource[]
  reviewSessions?: ReviewSession[]
  reviewAttempts?: ReviewAttempt[]
  studySchedules?: StudySchedule[]
  aiSuggestions?: AiSuggestion[]
  aiSuggestionTargets?: AiSuggestionTarget[]
  entityLinks?: EntityLink[]
  tags?: Tag[]
  taggings?: Tagging[]
  metrics?: CourseMetrics[]
}

function maybe(value: string | null | undefined) {
  return value || undefined
}

function asLanguage(value: string): Language {
  return value === "nl" || value === "fr" ? value : "en"
}

function asNumber(value: number | string | null | undefined, fallback = 0) {
  if (typeof value === "number") return value
  if (typeof value === "string") {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : fallback
  }
  return fallback
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : []
}

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as JsonRecord) : {}
}

function asNumberingPath(value: unknown): NumberingToken[] {
  return Array.isArray(value) ? (value as NumberingToken[]) : []
}

function asTranslations(value: unknown): Partial<Record<Language, string[]>> {
  const record = asRecord(value)
  return {
    en: asStringArray(record.en),
    nl: asStringArray(record.nl),
    fr: asStringArray(record.fr),
  }
}

function cleanUndefined(row: JsonRecord): JsonRecord {
  return Object.fromEntries(Object.entries(row).filter(([, value]) => value !== undefined))
}

function courseFromRow(row: CourseRow): Course {
  return {
    id: row.id,
    ownerId: row.owner_id,
    title: row.title,
    description: row.description ?? "",
    mainLanguage: asLanguage(row.main_language),
    subject: row.subject ?? "",
    difficultyLevel: row.difficulty_level === "intro" || row.difficulty_level === "advanced" ? row.difficulty_level : "intermediate",
    status:
      row.status === "active" || row.status === "completed" || row.status === "archived" || row.status === "draft"
        ? row.status
        : "draft",
    examDate: maybe(row.exam_date),
    targetDate: maybe(row.target_date),
    sourceType: row.source_type ?? "mixed",
    estimatedStudyMinutes: asNumber(row.estimated_study_minutes),
    masteryScore: asNumber(row.mastery_score),
    confidenceScore: asNumber(row.confidence_score),
    tags: asStringArray(row.tags),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function courseToRow(course: Course): JsonRecord {
  return cleanUndefined({
    id: course.id,
    owner_id: course.ownerId,
    title: course.title,
    description: course.description,
    main_language: course.mainLanguage,
    subject: course.subject,
    difficulty_level: course.difficultyLevel,
    status: course.status,
    exam_date: course.examDate ?? null,
    target_date: course.targetDate ?? null,
    source_type: course.sourceType,
    estimated_study_minutes: course.estimatedStudyMinutes,
    mastery_score: course.masteryScore,
    confidence_score: course.confidenceScore,
    tags: course.tags,
    created_at: course.createdAt,
    updated_at: course.updatedAt,
  })
}

function courseNodeFromRow(row: CourseNodeRow): CourseNode {
  return {
    id: row.id,
    courseId: row.course_id,
    parentId: maybe(row.parent_id),
    nodeType:
      row.node_type === "module" ||
      row.node_type === "chapter" ||
      row.node_type === "section" ||
      row.node_type === "subsection" ||
      row.node_type === "heading"
        ? row.node_type
        : "heading",
    title: row.title,
    position: row.position,
    depth: row.depth,
    numberingPath: asNumberingPath(row.numbering_path),
    displayNumber: row.display_number ?? "",
    language: asLanguage(row.language),
    isCollapsedDefault: row.is_collapsed_default,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function courseNodeToRow(node: CourseNode): JsonRecord {
  return cleanUndefined({
    id: node.id,
    course_id: node.courseId,
    parent_id: node.parentId ?? null,
    node_type: node.nodeType,
    title: node.title,
    position: node.position,
    depth: node.depth,
    numbering_path: node.numberingPath,
    display_number: node.displayNumber,
    language: node.language,
    is_collapsed_default: node.isCollapsedDefault,
    created_at: node.createdAt,
    updated_at: node.updatedAt,
  })
}

function contentBlockFromRow(row: ContentBlockRow): ContentBlock {
  return {
    id: row.id,
    courseId: row.course_id,
    nodeId: row.node_id,
    parentBlockId: maybe(row.parent_block_id),
    blockType:
      row.block_type === "heading" ||
      row.block_type === "paragraph" ||
      row.block_type === "definition" ||
      row.block_type === "quote" ||
      row.block_type === "example" ||
      row.block_type === "note" ||
      row.block_type === "warning" ||
      row.block_type === "table" ||
      row.block_type === "image" ||
      row.block_type === "formula" ||
      row.block_type === "question" ||
      row.block_type === "summary"
        ? row.block_type
        : "paragraph",
    position: row.position,
    depth: row.depth,
    content: asRecord(row.content) as ContentBlock["content"],
    plainText: row.plain_text,
    language: asLanguage(row.language),
    numberingPath: asNumberingPath(row.numbering_path),
    displayNumber: row.display_number ?? "",
    isCollapsible: row.is_collapsible,
    isCollapsed: row.is_collapsed,
    version: row.version,
    contentHash: row.content_hash ?? "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function contentBlockToRow(block: ContentBlock): JsonRecord {
  return cleanUndefined({
    id: block.id,
    course_id: block.courseId,
    node_id: block.nodeId,
    parent_block_id: block.parentBlockId ?? null,
    block_type: block.blockType,
    position: block.position,
    depth: block.depth,
    content: block.content,
    plain_text: block.plainText,
    language: block.language,
    numbering_path: block.numberingPath,
    display_number: block.displayNumber,
    is_collapsible: block.isCollapsible,
    is_collapsed: block.isCollapsed,
    version: block.version,
    content_hash: block.contentHash,
    created_at: block.createdAt,
    updated_at: block.updatedAt,
  })
}

function contentBlockVersionFromRow(row: ContentBlockVersionRow): ContentBlockVersion {
  return {
    id: row.id,
    contentBlockId: row.content_block_id,
    version: row.version,
    content: asRecord(row.content) as ContentBlock["content"],
    plainText: row.plain_text,
    contentHash: maybe(row.content_hash),
    createdBy: maybe(row.created_by),
    createdAt: row.created_at,
  }
}

function contentBlockVersionToRow(version: ContentBlockVersion): JsonRecord {
  return cleanUndefined({
    id: version.id,
    content_block_id: version.contentBlockId,
    version: version.version,
    content: version.content,
    plain_text: version.plainText,
    content_hash: version.contentHash ?? null,
    created_by: version.createdBy ?? null,
    created_at: version.createdAt,
  })
}

function contentTextAnchorFromRow(row: ContentTextAnchorRow): ContentTextAnchor {
  return {
    id: row.id,
    courseId: row.course_id,
    contentBlockId: row.content_block_id,
    blockVersion: row.block_version,
    startOffset: row.start_offset,
    endOffset: row.end_offset,
    selectedText: row.selected_text,
    prefixContext: row.prefix_context ?? "",
    suffixContext: row.suffix_context ?? "",
    textHash: row.text_hash ?? "",
    anchorStatus: row.anchor_status === "stale" || row.anchor_status === "needs_review" ? row.anchor_status : "active",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function contentTextAnchorToRow(anchor: ContentTextAnchor): JsonRecord {
  return cleanUndefined({
    id: anchor.id,
    course_id: anchor.courseId,
    content_block_id: anchor.contentBlockId,
    block_version: anchor.blockVersion,
    start_offset: anchor.startOffset,
    end_offset: anchor.endOffset,
    selected_text: anchor.selectedText,
    prefix_context: anchor.prefixContext,
    suffix_context: anchor.suffixContext,
    text_hash: anchor.textHash,
    anchor_status: anchor.anchorStatus,
    created_at: anchor.createdAt,
    updated_at: anchor.updatedAt,
  })
}

function appendixTableFromRow(row: AppendixTableRow): AppendixTable {
  return {
    id: row.id,
    courseId: row.course_id,
    name: row.name,
    slug: row.slug,
    tableType:
      row.table_type === "images" ||
      row.table_type === "persons" ||
      row.table_type === "events" ||
      row.table_type === "places" ||
      row.table_type === "definitions"
        ? row.table_type
        : "custom",
    isDefault: row.is_default,
    description: row.description ?? "",
    position: row.position,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function appendixTableToRow(table: AppendixTable): JsonRecord {
  return cleanUndefined({
    id: table.id,
    course_id: table.courseId,
    name: table.name,
    slug: table.slug,
    table_type: table.tableType,
    is_default: table.isDefault,
    description: table.description,
    position: table.position,
    created_at: table.createdAt,
    updated_at: table.updatedAt,
  })
}

function appendixFieldFromRow(row: AppendixFieldRow): AppendixField {
  return {
    id: row.id,
    appendixTableId: row.appendix_table_id,
    name: row.name,
    slug: row.slug,
    fieldType:
      row.field_type === "long_text" ||
      row.field_type === "number" ||
      row.field_type === "date" ||
      row.field_type === "url" ||
      row.field_type === "select" ||
      row.field_type === "multi_select" ||
      row.field_type === "image" ||
      row.field_type === "file"
        ? row.field_type
        : "text",
    isRequired: row.is_required,
    position: row.position,
    options: row.options,
    createdAt: row.created_at,
  }
}

function appendixFieldToRow(field: AppendixField): JsonRecord {
  return cleanUndefined({
    id: field.id,
    appendix_table_id: field.appendixTableId,
    name: field.name,
    slug: field.slug,
    field_type: field.fieldType,
    is_required: field.isRequired,
    position: field.position,
    options: field.options ?? {},
    created_at: field.createdAt,
  })
}

function appendixRecordFromRow(row: AppendixRecordRow): AppendixRecord {
  return {
    id: row.id,
    courseId: row.course_id,
    appendixTableId: row.appendix_table_id,
    title: row.title,
    recordType: row.record_type,
    shortDescription: row.short_description ?? "",
    sourceId: maybe(row.source_id),
    language: asLanguage(row.language),
    aliases: asStringArray(row.aliases),
    translations: asTranslations(row.translations),
    tags: asStringArray(row.tags_cache),
    userNotes: row.user_notes ?? "",
    version: row.version,
    recordHash: row.record_hash ?? "",
    createdMethod: row.created_method === "imported" || row.created_method === "ai_suggested" ? row.created_method : "manual",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function appendixRecordToRow(record: AppendixRecord): JsonRecord {
  return cleanUndefined({
    id: record.id,
    course_id: record.courseId,
    appendix_table_id: record.appendixTableId,
    title: record.title,
    record_type: record.recordType,
    short_description: record.shortDescription,
    source_id: record.sourceId ?? null,
    language: record.language,
    aliases: record.aliases,
    translations: record.translations,
    tags_cache: record.tags,
    user_notes: record.userNotes,
    version: record.version,
    record_hash: record.recordHash,
    created_method: record.createdMethod === "ai" || record.createdMethod === "system" ? "ai_suggested" : record.createdMethod,
    created_at: record.createdAt,
    updated_at: record.updatedAt,
  })
}

function appendixRecordValueFromRow(row: AppendixRecordValueRow): AppendixRecordValue {
  return {
    id: row.id,
    appendixRecordId: row.appendix_record_id,
    appendixFieldId: row.appendix_field_id,
    value: row.value,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function appendixRecordValueToRow(value: AppendixRecordValue): JsonRecord {
  return cleanUndefined({
    id: value.id,
    appendix_record_id: value.appendixRecordId,
    appendix_field_id: value.appendixFieldId,
    value: value.value,
    created_at: value.createdAt,
    updated_at: value.updatedAt,
  })
}

function sourceFromRow(row: SourceRow): Source {
  return {
    id: row.id,
    courseId: row.course_id,
    sourceType: row.source_type,
    title: row.title,
    author: maybe(row.author),
    url: maybe(row.url),
    citation: maybe(row.citation),
    publisher: maybe(row.publisher),
    publishedDate: maybe(row.published_date),
    pageStart: maybe(row.page_start),
    pageEnd: maybe(row.page_end),
    metadata: asRecord(row.metadata),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function sourceToRow(source: Source): JsonRecord {
  return cleanUndefined({
    id: source.id,
    course_id: source.courseId,
    source_type: source.sourceType,
    title: source.title,
    author: source.author ?? null,
    url: source.url ?? null,
    citation: source.citation ?? null,
    publisher: source.publisher ?? null,
    published_date: source.publishedDate ?? null,
    page_start: source.pageStart ?? null,
    page_end: source.pageEnd ?? null,
    metadata: source.metadata ?? {},
    created_at: source.createdAt,
    updated_at: source.updatedAt,
  })
}

function assetFromRow(row: AssetRow): Asset {
  return {
    id: row.id,
    courseId: row.course_id,
    ownerId: row.owner_id,
    bucket: row.bucket,
    storagePath: row.storage_path,
    fileName: row.file_name,
    mimeType: row.mime_type,
    fileSizeBytes: asNumber(row.file_size_bytes),
    assetType:
      row.asset_type === "image" ||
      row.asset_type === "document" ||
      row.asset_type === "import" ||
      row.asset_type === "export" ||
      row.asset_type === "audio"
        ? row.asset_type
        : "other",
    sourceId: maybe(row.source_id),
    metadata: asRecord(row.metadata),
    createdAt: row.created_at,
  }
}

function assetToRow(asset: Asset): JsonRecord {
  return cleanUndefined({
    id: asset.id,
    course_id: asset.courseId,
    owner_id: asset.ownerId,
    bucket: asset.bucket,
    storage_path: asset.storagePath,
    file_name: asset.fileName,
    mime_type: asset.mimeType,
    file_size_bytes: asset.fileSizeBytes,
    asset_type: asset.assetType,
    source_id: asset.sourceId ?? null,
    metadata: asset.metadata ?? {},
    created_at: asset.createdAt,
  })
}

function flashcardFromRow(row: FlashcardRow): Flashcard {
  return {
    id: row.id,
    courseId: row.course_id,
    cardType:
      row.card_type === "definition" ||
      row.card_type === "cloze" ||
      row.card_type === "true_false" ||
      row.card_type === "person" ||
      row.card_type === "image"
        ? row.card_type
        : "basic",
    prompt: asRecord(row.prompt) as Flashcard["prompt"],
    answer: asRecord(row.answer) as Flashcard["answer"],
    explanation: row.explanation ?? "",
    hint: row.hint ?? "",
    sourceExcerpt: row.source_excerpt ?? "",
    difficultyLevel: row.difficulty_level === "intro" || row.difficulty_level === "advanced" ? row.difficulty_level : "intermediate",
    tags: asStringArray(row.tags),
    language: asLanguage(row.language),
    relatedAppendixRecordId: maybe(row.related_appendix_record_id),
    sourceWarning: row.source_warning,
    masteryScore: asNumber(row.mastery_score),
    confidenceScore: asNumber(row.confidence_score),
    dueAt: row.due_at,
    intervalDays: asNumber(row.interval_days),
    easeFactor: asNumber(row.ease_factor, 2.5),
    stability: asNumber(row.stability),
    difficulty: asNumber(row.difficulty, 0.5),
    lapses: row.lapses,
    reviewCount: row.review_count,
    lastReviewedAt: maybe(row.last_reviewed_at),
    staleStatus: row.stale_status === "stale" || row.stale_status === "needs_review" ? row.stale_status : "fresh",
    createdMethod: row.created_method === "ai" || row.created_method === "imported" ? row.created_method : "manual",
    userNotes: row.user_notes ?? "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function flashcardToRow(card: Flashcard): JsonRecord {
  return cleanUndefined({
    id: card.id,
    course_id: card.courseId,
    card_type: card.cardType,
    prompt: card.prompt,
    answer: card.answer,
    explanation: card.explanation,
    hint: card.hint,
    source_excerpt: card.sourceExcerpt,
    difficulty_level: card.difficultyLevel,
    tags: card.tags,
    language: card.language,
    related_appendix_record_id: card.relatedAppendixRecordId ?? null,
    source_warning: card.sourceWarning,
    mastery_score: card.masteryScore,
    confidence_score: card.confidenceScore,
    due_at: card.dueAt,
    interval_days: card.intervalDays,
    ease_factor: card.easeFactor,
    stability: card.stability,
    difficulty: card.difficulty,
    lapses: card.lapses,
    review_count: card.reviewCount,
    last_reviewed_at: card.lastReviewedAt ?? null,
    stale_status: card.staleStatus,
    created_method: card.createdMethod,
    user_notes: card.userNotes,
    created_at: card.createdAt,
    updated_at: card.updatedAt,
  })
}

function flashcardSourceFromRow(row: FlashcardSourceRow): FlashcardSource {
  return {
    id: row.id,
    flashcardId: row.flashcard_id,
    sourceTargetType:
      row.source_target_type === "text_anchor" ||
      row.source_target_type === "appendix_record" ||
      row.source_target_type === "source" ||
      row.source_target_type === "asset"
        ? row.source_target_type
        : "content_block",
    sourceTargetId: row.source_target_id,
    sourceVersion: row.source_version ?? undefined,
    sourceHash: maybe(row.source_hash),
    sourceExcerpt: row.source_excerpt ?? "",
    createdAt: row.created_at,
  }
}

function flashcardSourceToRow(source: FlashcardSource): JsonRecord {
  return cleanUndefined({
    id: source.id,
    flashcard_id: source.flashcardId,
    source_target_type: source.sourceTargetType,
    source_target_id: source.sourceTargetId,
    source_version: source.sourceVersion ?? null,
    source_hash: source.sourceHash ?? null,
    source_excerpt: source.sourceExcerpt,
    created_at: source.createdAt,
  })
}

function reviewSessionFromRow(row: ReviewSessionRow): ReviewSession {
  return {
    id: row.id,
    courseId: row.course_id,
    userId: row.user_id,
    mode: row.mode,
    filters: asRecord(row.filters),
    startedAt: row.started_at,
    endedAt: maybe(row.ended_at),
    durationSeconds: row.duration_seconds,
    cardCount: row.card_count,
  }
}

function reviewSessionToRow(session: ReviewSession): JsonRecord {
  return cleanUndefined({
    id: session.id,
    course_id: session.courseId,
    user_id: session.userId,
    mode: session.mode,
    filters: session.filters,
    started_at: session.startedAt,
    ended_at: session.endedAt ?? null,
    duration_seconds: session.durationSeconds,
    card_count: session.cardCount,
  })
}

function reviewAttemptFromRow(row: ReviewAttemptRow): ReviewAttempt {
  return {
    id: row.id,
    reviewSessionId: row.review_session_id,
    flashcardId: row.flashcard_id,
    userId: row.user_id,
    answerPayload: asRecord(row.answer_payload),
    selfRating: row.self_rating,
    isCorrect: row.is_correct ?? false,
    aiEvaluation: Object.keys(asRecord(row.ai_evaluation)).length ? asRecord(row.ai_evaluation) : undefined,
    userConfirmedResult: row.user_confirmed_result,
    responseTimeMs: row.response_time_ms,
    reviewedAt: row.reviewed_at,
  }
}

function reviewAttemptToRow(attempt: ReviewAttempt): JsonRecord {
  return cleanUndefined({
    id: attempt.id,
    review_session_id: attempt.reviewSessionId,
    flashcard_id: attempt.flashcardId,
    user_id: attempt.userId,
    answer_payload: attempt.answerPayload,
    self_rating: attempt.selfRating,
    is_correct: attempt.isCorrect,
    ai_evaluation: attempt.aiEvaluation ?? null,
    user_confirmed_result: attempt.userConfirmedResult,
    response_time_ms: attempt.responseTimeMs,
    reviewed_at: attempt.reviewedAt,
  })
}

function studyScheduleFromRow(row: StudyScheduleRow): StudySchedule {
  return {
    id: row.id,
    courseId: row.course_id,
    targetDate: maybe(row.target_date),
    dailyGoalMinutes: row.daily_goal_minutes,
    dailyNewCards: row.daily_new_cards,
    algorithmConfig: asRecord(row.algorithm_config),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function studyScheduleToRow(schedule: StudySchedule): JsonRecord {
  return cleanUndefined({
    id: schedule.id,
    course_id: schedule.courseId,
    target_date: schedule.targetDate ?? null,
    daily_goal_minutes: schedule.dailyGoalMinutes,
    daily_new_cards: schedule.dailyNewCards,
    algorithm_config: schedule.algorithmConfig,
    created_at: schedule.createdAt,
    updated_at: schedule.updatedAt,
  })
}

function aiSuggestionFromRow(row: AiSuggestionRow): AiSuggestion {
  return {
    id: row.id,
    courseId: row.course_id,
    suggestionType:
      row.suggestion_type === "appendix_items" ||
      row.suggestion_type === "links" ||
      row.suggestion_type === "content_update" ||
      row.suggestion_type === "study_plan"
        ? row.suggestion_type
        : "flashcards",
    status:
      row.status === "accepted" ||
      row.status === "edited" ||
      row.status === "rejected" ||
      row.status === "deferred" ||
      row.status === "stale"
        ? row.status
        : "pending",
    title: row.title,
    summary: row.summary ?? "",
    payload: asRecord(row.payload),
    model: row.model ?? "",
    promptVersion: row.prompt_version ?? "",
    riskLevel: row.risk_level === "medium" || row.risk_level === "high" ? row.risk_level : "low",
    createdByContext: asRecord(row.created_by_context),
    createdAt: row.created_at,
    resolvedAt: maybe(row.resolved_at),
  }
}

function aiSuggestionToRow(suggestion: AiSuggestion): JsonRecord {
  return cleanUndefined({
    id: suggestion.id,
    course_id: suggestion.courseId,
    suggestion_type: suggestion.suggestionType,
    status: suggestion.status,
    title: suggestion.title,
    summary: suggestion.summary,
    payload: suggestion.payload,
    model: suggestion.model,
    prompt_version: suggestion.promptVersion,
    risk_level: suggestion.riskLevel,
    created_by_context: suggestion.createdByContext,
    created_at: suggestion.createdAt,
    resolved_at: suggestion.resolvedAt ?? null,
  })
}

function aiSuggestionTargetFromRow(row: AiSuggestionTargetRow): AiSuggestionTarget {
  return {
    id: row.id,
    aiSuggestionId: row.ai_suggestion_id,
    targetType:
      row.target_type === "text_anchor" ||
      row.target_type === "appendix_record" ||
      row.target_type === "flashcard" ||
      row.target_type === "source" ||
      row.target_type === "asset" ||
      row.target_type === "review_session" ||
      row.target_type === "ai_suggestion"
        ? row.target_type
        : "content_block",
    targetId: row.target_id,
    targetVersion: row.target_version ?? undefined,
    targetHash: maybe(row.target_hash),
  }
}

function aiSuggestionTargetToRow(target: AiSuggestionTarget): JsonRecord {
  return cleanUndefined({
    id: target.id,
    ai_suggestion_id: target.aiSuggestionId,
    target_type: target.targetType,
    target_id: target.targetId,
    target_version: target.targetVersion ?? null,
    target_hash: target.targetHash ?? null,
  })
}

function entityLinkFromRow(row: EntityLinkRow): EntityLink {
  return {
    id: row.id,
    courseId: row.course_id,
    fromType:
      row.from_type === "text_anchor" ||
      row.from_type === "appendix_record" ||
      row.from_type === "flashcard" ||
      row.from_type === "source" ||
      row.from_type === "asset" ||
      row.from_type === "review_session" ||
      row.from_type === "ai_suggestion"
        ? row.from_type
        : "content_block",
    fromId: row.from_id,
    toType:
      row.to_type === "text_anchor" ||
      row.to_type === "appendix_record" ||
      row.to_type === "flashcard" ||
      row.to_type === "source" ||
      row.to_type === "asset" ||
      row.to_type === "review_session" ||
      row.to_type === "ai_suggestion"
        ? row.to_type
        : "content_block",
    toId: row.to_id,
    linkType: row.link_type,
    anchorId: maybe(row.anchor_id),
    metadata: asRecord(row.metadata),
    createdMethod:
      row.created_method === "ai" || row.created_method === "imported" || row.created_method === "system"
        ? row.created_method
        : "manual",
    createdAt: row.created_at,
  }
}

function entityLinkToRow(link: EntityLink): JsonRecord {
  return cleanUndefined({
    id: link.id,
    course_id: link.courseId,
    from_type: link.fromType,
    from_id: link.fromId,
    to_type: link.toType,
    to_id: link.toId,
    link_type: link.linkType,
    anchor_id: link.anchorId ?? null,
    metadata: link.metadata ?? {},
    created_method: link.createdMethod,
    created_at: link.createdAt,
  })
}

function tagFromRow(row: TagRow): Tag {
  return {
    id: row.id,
    courseId: row.course_id,
    name: row.name,
    slug: row.slug,
    color: maybe(row.color),
    createdAt: row.created_at,
  }
}

function tagToRow(tag: Tag): JsonRecord {
  return cleanUndefined({
    id: tag.id,
    course_id: tag.courseId,
    name: tag.name,
    slug: tag.slug,
    color: tag.color ?? null,
    created_at: tag.createdAt,
  })
}

function taggingFromRow(row: TaggingRow): Tagging {
  return {
    id: row.id,
    tagId: row.tag_id,
    targetType:
      row.target_type === "text_anchor" ||
      row.target_type === "appendix_record" ||
      row.target_type === "flashcard" ||
      row.target_type === "source" ||
      row.target_type === "asset" ||
      row.target_type === "review_session" ||
      row.target_type === "ai_suggestion"
        ? row.target_type
        : "content_block",
    targetId: row.target_id,
    createdAt: row.created_at,
  }
}

function taggingToRow(tagging: Tagging): JsonRecord {
  return cleanUndefined({
    id: tagging.id,
    tag_id: tagging.tagId,
    target_type: tagging.targetType,
    target_id: tagging.targetId,
    created_at: tagging.createdAt,
  })
}

function courseMetricsFromRow(row: CourseMetricsRow): CourseMetrics {
  return {
    courseId: row.course_id,
    wordCount: row.word_count,
    characterCount: row.character_count,
    sentenceCount: row.sentence_count,
    headingCount: row.heading_count,
    contentBlockCount: row.content_block_count,
    appendixRecordCount: row.appendix_record_count,
    flashcardCount: row.flashcard_count,
    tokenEstimate: row.token_estimate,
    dueCardCount: row.due_card_count,
    weakCardCount: row.weak_card_count,
    coveragePercent: asNumber(row.coverage_percent),
    updatedAt: row.updated_at,
  }
}

function courseMetricsToRow(metric: CourseMetrics): JsonRecord {
  return cleanUndefined({
    course_id: metric.courseId,
    word_count: metric.wordCount,
    character_count: metric.characterCount,
    sentence_count: metric.sentenceCount,
    heading_count: metric.headingCount,
    content_block_count: metric.contentBlockCount,
    appendix_record_count: metric.appendixRecordCount,
    flashcard_count: metric.flashcardCount,
    token_estimate: metric.tokenEstimate,
    due_card_count: metric.dueCardCount,
    weak_card_count: metric.weakCardCount,
    coverage_percent: metric.coveragePercent,
    updated_at: metric.updatedAt,
  })
}

async function selectRows<Row>(client: SupabaseClient, table: string): Promise<Row[]> {
  const { data, error } = await client.from(table).select("*")
  if (error) throw new Error(`${table}: ${error.message}`)
  return (data ?? []) as Row[]
}

async function upsertRows(client: SupabaseClient, table: string, rows: JsonRecord[], onConflict?: string) {
  if (rows.length === 0) return
  const { error } = await client.from(table).upsert(rows, onConflict ? { onConflict } : undefined)
  if (error) throw new Error(`${table}: ${error.message}`)
}

export async function loadSupabaseStudyData(client: SupabaseClient, profileId: string): Promise<StudyData> {
  const [
    courses,
    courseNodes,
    contentBlocks,
    contentBlockVersions,
    contentTextAnchors,
    appendixTables,
    appendixFields,
    appendixRecords,
    appendixRecordValues,
    sources,
    assets,
    flashcards,
    flashcardSources,
    reviewSessions,
    reviewAttempts,
    studySchedules,
    aiSuggestions,
    aiSuggestionTargets,
    entityLinks,
    tags,
    taggings,
    metrics,
  ] = await Promise.all([
    selectRows<CourseRow>(client, "courses"),
    selectRows<CourseNodeRow>(client, "course_nodes"),
    selectRows<ContentBlockRow>(client, "content_blocks"),
    selectRows<ContentBlockVersionRow>(client, "content_block_versions"),
    selectRows<ContentTextAnchorRow>(client, "content_text_anchors"),
    selectRows<AppendixTableRow>(client, "appendix_tables"),
    selectRows<AppendixFieldRow>(client, "appendix_fields"),
    selectRows<AppendixRecordRow>(client, "appendix_records"),
    selectRows<AppendixRecordValueRow>(client, "appendix_record_values"),
    selectRows<SourceRow>(client, "sources"),
    selectRows<AssetRow>(client, "assets"),
    selectRows<FlashcardRow>(client, "flashcards"),
    selectRows<FlashcardSourceRow>(client, "flashcard_sources"),
    selectRows<ReviewSessionRow>(client, "review_sessions"),
    selectRows<ReviewAttemptRow>(client, "review_attempts"),
    selectRows<StudyScheduleRow>(client, "study_schedules"),
    selectRows<AiSuggestionRow>(client, "ai_suggestions"),
    selectRows<AiSuggestionTargetRow>(client, "ai_suggestion_targets"),
    selectRows<EntityLinkRow>(client, "entity_links"),
    selectRows<TagRow>(client, "tags"),
    selectRows<TaggingRow>(client, "taggings"),
    selectRows<CourseMetricsRow>(client, "course_metrics"),
  ])

  return {
    profileId,
    courses: courses.map(courseFromRow).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    courseNodes: courseNodes.map(courseNodeFromRow).sort((a, b) => a.depth - b.depth || a.position - b.position),
    contentBlocks: contentBlocks.map(contentBlockFromRow).sort((a, b) => a.position - b.position),
    contentBlockVersions: contentBlockVersions.map(contentBlockVersionFromRow),
    contentTextAnchors: contentTextAnchors.map(contentTextAnchorFromRow),
    appendixTables: appendixTables.map(appendixTableFromRow).sort((a, b) => a.position - b.position),
    appendixFields: appendixFields.map(appendixFieldFromRow).sort((a, b) => a.position - b.position),
    appendixRecords: appendixRecords.map(appendixRecordFromRow).sort((a, b) => a.title.localeCompare(b.title)),
    appendixRecordValues: appendixRecordValues.map(appendixRecordValueFromRow),
    sources: sources.map(sourceFromRow),
    assets: assets.map(assetFromRow),
    flashcards: flashcards.map(flashcardFromRow).sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    flashcardSources: flashcardSources.map(flashcardSourceFromRow),
    reviewSessions: reviewSessions.map(reviewSessionFromRow),
    reviewAttempts: reviewAttempts.map(reviewAttemptFromRow),
    studySchedules: studySchedules.map(studyScheduleFromRow),
    aiSuggestions: aiSuggestions.map(aiSuggestionFromRow).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    aiSuggestionTargets: aiSuggestionTargets.map(aiSuggestionTargetFromRow),
    entityLinks: entityLinks.map(entityLinkFromRow),
    tags: tags.map(tagFromRow),
    taggings: taggings.map(taggingFromRow),
    metrics: metrics.map(courseMetricsFromRow),
  }
}

export async function upsertSupabaseStudyPatch(client: SupabaseClient, patch: SupabaseStudyPatch) {
  await upsertRows(client, "courses", (patch.courses ?? []).map(courseToRow))
  await upsertRows(client, "course_nodes", (patch.courseNodes ?? []).map(courseNodeToRow))
  await upsertRows(client, "content_blocks", (patch.contentBlocks ?? []).map(contentBlockToRow))
  await upsertRows(client, "content_block_versions", (patch.contentBlockVersions ?? []).map(contentBlockVersionToRow))
  await upsertRows(client, "content_text_anchors", (patch.contentTextAnchors ?? []).map(contentTextAnchorToRow))
  await upsertRows(client, "sources", (patch.sources ?? []).map(sourceToRow))
  await upsertRows(client, "appendix_tables", (patch.appendixTables ?? []).map(appendixTableToRow))
  await upsertRows(client, "appendix_fields", (patch.appendixFields ?? []).map(appendixFieldToRow))
  await upsertRows(client, "appendix_records", (patch.appendixRecords ?? []).map(appendixRecordToRow))
  await upsertRows(client, "appendix_record_values", (patch.appendixRecordValues ?? []).map(appendixRecordValueToRow))
  await upsertRows(client, "assets", (patch.assets ?? []).map(assetToRow))
  await upsertRows(client, "flashcards", (patch.flashcards ?? []).map(flashcardToRow))
  await upsertRows(client, "flashcard_sources", (patch.flashcardSources ?? []).map(flashcardSourceToRow))
  await upsertRows(client, "review_sessions", (patch.reviewSessions ?? []).map(reviewSessionToRow))
  await upsertRows(client, "review_attempts", (patch.reviewAttempts ?? []).map(reviewAttemptToRow))
  await upsertRows(client, "study_schedules", (patch.studySchedules ?? []).map(studyScheduleToRow))
  await upsertRows(client, "ai_suggestions", (patch.aiSuggestions ?? []).map(aiSuggestionToRow))
  await upsertRows(client, "ai_suggestion_targets", (patch.aiSuggestionTargets ?? []).map(aiSuggestionTargetToRow))
  await upsertRows(client, "entity_links", (patch.entityLinks ?? []).map(entityLinkToRow))
  await upsertRows(client, "tags", (patch.tags ?? []).map(tagToRow))
  await upsertRows(client, "taggings", (patch.taggings ?? []).map(taggingToRow))
  await upsertRows(client, "course_metrics", (patch.metrics ?? []).map(courseMetricsToRow), "course_id")
}
