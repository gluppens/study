export type Language = "en" | "nl" | "fr"
export type CourseStatus = "draft" | "active" | "completed" | "archived"
export type DifficultyLevel = "intro" | "intermediate" | "advanced"

export type CourseNodeType = "module" | "chapter" | "section" | "subsection" | "heading"
export type ContentBlockType =
  | "heading"
  | "paragraph"
  | "definition"
  | "quote"
  | "example"
  | "note"
  | "warning"
  | "table"
  | "image"
  | "formula"
  | "question"
  | "summary"

export type AppendixTableType = "images" | "persons" | "events" | "places" | "definitions" | "custom"
export type AppendixFieldType =
  | "text"
  | "long_text"
  | "number"
  | "date"
  | "url"
  | "select"
  | "multi_select"
  | "image"
  | "file"

export type FlashcardType = "basic" | "definition" | "cloze" | "true_false" | "person" | "image"
export type CreatedMethod = "manual" | "ai" | "ai_suggested" | "imported" | "system"
export type StaleStatus = "fresh" | "stale" | "needs_review"
export type ReviewRating = "again" | "hard" | "good" | "easy"
export type SuggestionStatus = "pending" | "accepted" | "edited" | "rejected" | "deferred" | "stale"
export type LinkTargetType =
  | "content_block"
  | "text_anchor"
  | "appendix_record"
  | "flashcard"
  | "source"
  | "asset"
  | "review_session"
  | "ai_suggestion"

export interface Course {
  id: string
  ownerId: string
  title: string
  description: string
  mainLanguage: Language
  subject: string
  difficultyLevel: DifficultyLevel
  status: CourseStatus
  examDate?: string
  targetDate?: string
  sourceType: string
  estimatedStudyMinutes: number
  masteryScore: number
  confidenceScore: number
  tags: string[]
  createdAt: string
  updatedAt: string
}

export interface NumberingToken {
  level: number
  style: "roman_upper" | "alpha_upper" | "alpha_lower" | "roman_lower" | "decimal" | "section"
  ordinal: number
  label: string
}

export interface CourseNode {
  id: string
  courseId: string
  parentId?: string
  nodeType: CourseNodeType
  title: string
  position: number
  depth: number
  numberingPath: NumberingToken[]
  displayNumber: string
  language: Language
  isCollapsedDefault: boolean
  createdAt: string
  updatedAt: string
}

export interface ContentBlock {
  id: string
  courseId: string
  nodeId: string
  parentBlockId?: string
  blockType: ContentBlockType
  position: number
  depth: number
  content: {
    text?: string
    title?: string
    caption?: string
    src?: string
    rows?: string[][]
    formula?: string
  }
  plainText: string
  language: Language
  numberingPath: NumberingToken[]
  displayNumber: string
  isCollapsible: boolean
  isCollapsed: boolean
  version: number
  contentHash: string
  createdAt: string
  updatedAt: string
}

export interface ContentTextAnchor {
  id: string
  courseId: string
  contentBlockId: string
  blockVersion: number
  startOffset: number
  endOffset: number
  selectedText: string
  prefixContext: string
  suffixContext: string
  textHash: string
  anchorStatus: "active" | "stale" | "needs_review"
  createdAt: string
  updatedAt: string
}

export interface AppendixTable {
  id: string
  courseId: string
  name: string
  slug: string
  tableType: AppendixTableType
  isDefault: boolean
  description: string
  position: number
  createdAt: string
  updatedAt: string
}

export interface AppendixField {
  id: string
  appendixTableId: string
  name: string
  slug: string
  fieldType: AppendixFieldType
  isRequired: boolean
  position: number
  options?: unknown
  createdAt: string
}

export interface AppendixRecord {
  id: string
  courseId: string
  appendixTableId: string
  title: string
  recordType: string
  shortDescription: string
  sourceId?: string
  language: Language
  aliases: string[]
  translations: Partial<Record<Language, string[]>>
  tags: string[]
  userNotes: string
  version: number
  recordHash: string
  createdMethod: CreatedMethod
  createdAt: string
  updatedAt: string
}

export interface AppendixRecordValue {
  id: string
  appendixRecordId: string
  appendixFieldId: string
  value: unknown
  createdAt: string
  updatedAt: string
}

export interface Source {
  id: string
  courseId: string
  sourceType: string
  title: string
  author?: string
  url?: string
  citation?: string
  publisher?: string
  publishedDate?: string
  pageStart?: string
  pageEnd?: string
  metadata?: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export interface Asset {
  id: string
  courseId: string
  ownerId: string
  bucket: string
  storagePath: string
  fileName: string
  mimeType: string
  fileSizeBytes: number
  assetType: "image" | "document" | "import" | "export" | "audio" | "other"
  sourceId?: string
  metadata?: Record<string, unknown>
  createdAt: string
}

export interface Flashcard {
  id: string
  courseId: string
  cardType: FlashcardType
  prompt: {
    text: string
    imageAssetId?: string
    clozeText?: string
  }
  answer: {
    text: string
    isTrue?: boolean
  }
  explanation: string
  hint: string
  sourceExcerpt: string
  difficultyLevel: DifficultyLevel
  tags: string[]
  language: Language
  relatedAppendixRecordId?: string
  sourceWarning: boolean
  masteryScore: number
  confidenceScore: number
  dueAt: string
  intervalDays: number
  easeFactor: number
  stability: number
  difficulty: number
  lapses: number
  reviewCount: number
  lastReviewedAt?: string
  staleStatus: StaleStatus
  createdMethod: "manual" | "ai" | "imported"
  userNotes: string
  createdAt: string
  updatedAt: string
}

export interface FlashcardSource {
  id: string
  flashcardId: string
  sourceTargetType: "content_block" | "text_anchor" | "appendix_record" | "source" | "asset"
  sourceTargetId: string
  sourceVersion?: number
  sourceHash?: string
  sourceExcerpt: string
  createdAt: string
}

export interface ReviewSession {
  id: string
  courseId: string
  userId: string
  mode: string
  filters: Record<string, unknown>
  startedAt: string
  endedAt?: string
  durationSeconds: number
  cardCount: number
}

export interface ReviewAttempt {
  id: string
  reviewSessionId: string
  flashcardId: string
  userId: string
  answerPayload: Record<string, unknown>
  selfRating: number
  isCorrect: boolean
  aiEvaluation?: Record<string, unknown>
  userConfirmedResult: boolean
  responseTimeMs: number
  reviewedAt: string
}

export interface AiSuggestion {
  id: string
  courseId: string
  suggestionType: "flashcards" | "appendix_items" | "links" | "content_update" | "study_plan"
  status: SuggestionStatus
  title: string
  summary: string
  payload: Record<string, unknown>
  model: string
  promptVersion: string
  riskLevel: "low" | "medium" | "high"
  createdByContext: Record<string, unknown>
  createdAt: string
  resolvedAt?: string
}

export interface AiSuggestionTarget {
  id: string
  aiSuggestionId: string
  targetType: LinkTargetType
  targetId: string
  targetVersion?: number
  targetHash?: string
}

export interface EntityLink {
  id: string
  courseId: string
  fromType: LinkTargetType
  fromId: string
  toType: LinkTargetType
  toId: string
  linkType: string
  anchorId?: string
  metadata?: Record<string, unknown>
  createdMethod: CreatedMethod
  createdAt: string
}

export interface CourseMetrics {
  courseId: string
  wordCount: number
  characterCount: number
  sentenceCount: number
  headingCount: number
  contentBlockCount: number
  appendixRecordCount: number
  flashcardCount: number
  tokenEstimate: number
  dueCardCount: number
  weakCardCount: number
  coveragePercent: number
  updatedAt: string
}

export interface StudyData {
  profileId: string
  courses: Course[]
  courseNodes: CourseNode[]
  contentBlocks: ContentBlock[]
  contentTextAnchors: ContentTextAnchor[]
  appendixTables: AppendixTable[]
  appendixFields: AppendixField[]
  appendixRecords: AppendixRecord[]
  appendixRecordValues: AppendixRecordValue[]
  sources: Source[]
  assets: Asset[]
  flashcards: Flashcard[]
  flashcardSources: FlashcardSource[]
  reviewSessions: ReviewSession[]
  reviewAttempts: ReviewAttempt[]
  aiSuggestions: AiSuggestion[]
  aiSuggestionTargets: AiSuggestionTarget[]
  entityLinks: EntityLink[]
  metrics: CourseMetrics[]
}
