import type { Session, User } from "@supabase/supabase-js"
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { splitPastedText } from "@/domain/import-export"
import { displayNumber, makeNumberingPath } from "@/domain/numbering"
import { isDue, isWeak, scheduleReview } from "@/domain/review"
import type {
  AiSuggestion,
  AiSuggestionTarget,
  AppendixRecord,
  AppendixTable,
  ContentBlock,
  ContentBlockVersion,
  Course,
  CourseMetrics,
  CourseNode,
  CourseNodeType,
  DifficultyLevel,
  EntityLink,
  Flashcard,
  FlashcardSource,
  Language,
  ReviewAttempt,
  ReviewRating,
  ReviewSession,
  StudyData,
} from "@/domain/types"
import { isSupabaseConfigured, supabase } from "@/lib/supabase"
import { slugify, uid } from "@/lib/utils"
import { defaultStudyData } from "./demo-data"
import {
  loadSupabaseStudyData,
  upsertSupabaseStudyPatch,
  type SupabaseStudyPatch,
} from "./supabase-study-repository"

const storageKey = "study.mvp.data"
const seedVersionKey = "study.mvp.seedVersion"
const modeKey = "study.mvp.mode"
const demoSeedVersion = "2026-05-expanded-demo"

type StudyWorkspaceMode = "demo" | "live"

interface CreateCourseInput {
  title: string
  description: string
  subject: string
  mainLanguage: Language
  difficultyLevel: DifficultyLevel
  examDate?: string
  targetDate?: string
}

interface AddBlockInput {
  courseId: string
  nodeId: string
  blockType: ContentBlock["blockType"]
  text: string
}

interface AddAppendixRecordInput {
  courseId: string
  appendixTableId: string
  title: string
  shortDescription: string
  language: Language
  tags: string[]
}

interface AddFlashcardInput {
  courseId: string
  cardType: Flashcard["cardType"]
  prompt: string
  answer: string
  sourceTargetType?: FlashcardSource["sourceTargetType"]
  sourceTargetId?: string
  sourceExcerpt?: string
  relatedAppendixRecordId?: string
  tags: string[]
  language: Language
}

interface StudyDataContextValue {
  data: StudyData
  mode: StudyWorkspaceMode
  isLiveMode: boolean
  isLoading: boolean
  authReady: boolean
  pendingMutations: number
  lastError: string | null
  user: User | null
  session: Session | null
  activateDemoWorkspace: () => void
  activateLiveWorkspace: () => void
  signInWithPassword: (email: string, password: string) => Promise<Session | null>
  signUpWithPassword: (email: string, password: string) => Promise<Session | null>
  signOut: () => Promise<void>
  reload: () => Promise<void>
  resetDemoData: () => Promise<void>
  createCourse: (input: CreateCourseInput) => Promise<Course>
  updateCourse: (courseId: string, patch: Partial<Course>) => Promise<void>
  addCourseNode: (courseId: string, parentId: string | undefined, nodeType: CourseNodeType, title: string) => Promise<CourseNode>
  addContentBlock: (input: AddBlockInput) => Promise<ContentBlock>
  updateContentBlock: (blockId: string, text: string) => Promise<void>
  toggleBlockCollapse: (blockId: string) => Promise<void>
  importTextToNode: (courseId: string, nodeId: string, text: string) => Promise<number>
  addAppendixTable: (courseId: string, name: string) => Promise<AppendixTable>
  addAppendixRecord: (input: AddAppendixRecordInput) => Promise<AppendixRecord>
  linkContentToAppendix: (courseId: string, blockId: string, recordId: string) => Promise<EntityLink>
  addFlashcard: (input: AddFlashcardInput) => Promise<Flashcard>
  reviewFlashcard: (courseId: string, cardId: string, rating: ReviewRating, answerText: string) => Promise<void>
  createAiFlashcardSuggestion: (
    courseId: string,
    targetId: string,
    targetType: "content_block" | "appendix_record",
  ) => Promise<AiSuggestion>
  resolveSuggestion: (suggestionId: string, status: AiSuggestion["status"]) => Promise<void>
}

interface MutationBuild<T> {
  data: StudyData
  result: T
  patch?: SupabaseStudyPatch
  metricCourseIds?: string[]
}

interface SuggestionCardPayload {
  cardType?: Flashcard["cardType"]
  prompt?: string
  answer?: string
  sourceTargetType?: FlashcardSource["sourceTargetType"]
  sourceTargetId?: string
}

const StudyDataContext = createContext<StudyDataContextValue | null>(null)

function normalizeStudyData(data: StudyData): StudyData {
  return {
    ...data,
    contentBlockVersions: data.contentBlockVersions ?? [],
    contentTextAnchors: data.contentTextAnchors ?? [],
    appendixFields: data.appendixFields ?? [],
    appendixRecordValues: data.appendixRecordValues ?? [],
    sources: data.sources ?? [],
    assets: data.assets ?? [],
    reviewSessions: data.reviewSessions ?? [],
    reviewAttempts: data.reviewAttempts ?? [],
    studySchedules: data.studySchedules ?? [],
    aiSuggestions: data.aiSuggestions ?? [],
    aiSuggestionTargets: data.aiSuggestionTargets ?? [],
    entityLinks: data.entityLinks ?? [],
    tags: data.tags ?? [],
    taggings: data.taggings ?? [],
    metrics: data.metrics ?? [],
  }
}

function emptyStudyData(profileId: string): StudyData {
  return {
    profileId,
    courses: [],
    courseNodes: [],
    contentBlocks: [],
    contentBlockVersions: [],
    contentTextAnchors: [],
    appendixTables: [],
    appendixFields: [],
    appendixRecords: [],
    appendixRecordValues: [],
    sources: [],
    assets: [],
    flashcards: [],
    flashcardSources: [],
    reviewSessions: [],
    reviewAttempts: [],
    studySchedules: [],
    aiSuggestions: [],
    aiSuggestionTargets: [],
    entityLinks: [],
    tags: [],
    taggings: [],
    metrics: [],
  }
}

function safeParseData(value: string | null): StudyData {
  if (!value) return normalizeStudyData(defaultStudyData)

  try {
    return normalizeStudyData(JSON.parse(value) as StudyData)
  } catch {
    return normalizeStudyData(defaultStudyData)
  }
}

function loadInitialStudyData(): StudyData {
  const storedSeedVersion = localStorage.getItem(seedVersionKey)

  if (storedSeedVersion !== demoSeedVersion) {
    localStorage.setItem(seedVersionKey, demoSeedVersion)
    localStorage.setItem(storageKey, JSON.stringify(defaultStudyData))
    return normalizeStudyData(defaultStudyData)
  }

  return safeParseData(localStorage.getItem(storageKey))
}

function initialWorkspaceMode(): StudyWorkspaceMode {
  if (!isSupabaseConfigured) return "demo"
  return localStorage.getItem(modeKey) === "demo" ? "demo" : "live"
}

function makeId(mode: StudyWorkspaceMode, prefix: string) {
  if (mode === "live") return crypto.randomUUID()
  return uid(prefix)
}

function createDefaultAppendixTables(courseId: string, idFactory: (prefix: string) => string): AppendixTable[] {
  const defaults: Array<[AppendixTable["name"], AppendixTable["tableType"], string]> = [
    ["Images", "images", "Structured images used inline or as study references."],
    ["Persons", "persons", "People, authors, rulers, and historical actors."],
    ["Events", "events", "Dated events and timeline records."],
    ["Places", "places", "Locations and geographic references."],
    ["Definitions", "definitions", "Terms, concepts, and formulas."],
  ]

  return defaults.map(([name, tableType, description], index) => ({
    id: idFactory("table"),
    courseId,
    name,
    slug: slugify(name),
    tableType,
    isDefault: true,
    description,
    position: index + 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }))
}

function createInitialNodes(course: Course, idFactory: (prefix: string) => string): CourseNode[] {
  const timestamp = new Date().toISOString()
  const modulePath = makeNumberingPath([], 0, 1)
  const chapterPath = makeNumberingPath(modulePath, 1, 1)
  const sectionPath = makeNumberingPath(chapterPath, 2, 1)
  const subsectionPath = makeNumberingPath(sectionPath, 3, 1)

  const moduleId = idFactory("node")
  const chapterId = idFactory("node")
  const sectionId = idFactory("node")
  const subsectionId = idFactory("node")

  return [
    {
      id: moduleId,
      courseId: course.id,
      nodeType: "module",
      title: "Module 1",
      position: 1,
      depth: 0,
      numberingPath: modulePath,
      displayNumber: displayNumber(modulePath),
      language: course.mainLanguage,
      isCollapsedDefault: false,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      id: chapterId,
      courseId: course.id,
      parentId: moduleId,
      nodeType: "chapter",
      title: "Chapter 1",
      position: 1,
      depth: 1,
      numberingPath: chapterPath,
      displayNumber: displayNumber(chapterPath),
      language: course.mainLanguage,
      isCollapsedDefault: false,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      id: sectionId,
      courseId: course.id,
      parentId: chapterId,
      nodeType: "section",
      title: "Section 1",
      position: 1,
      depth: 2,
      numberingPath: sectionPath,
      displayNumber: displayNumber(sectionPath),
      language: course.mainLanguage,
      isCollapsedDefault: false,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      id: subsectionId,
      courseId: course.id,
      parentId: sectionId,
      nodeType: "subsection",
      title: "Subsection 1",
      position: 1,
      depth: 3,
      numberingPath: subsectionPath,
      displayNumber: displayNumber(subsectionPath),
      language: course.mainLanguage,
      isCollapsedDefault: false,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  ]
}

function getTextHash(text: string) {
  return `${text.length}:${text.slice(0, 32)}`
}

function recalculateMetrics(data: StudyData): StudyData {
  const metrics = data.courses.map<CourseMetrics>((course) => {
    const blocks = data.contentBlocks.filter((block) => block.courseId === course.id)
    const blockText = blocks.map((block) => block.plainText).join(" ")
    const cards = data.flashcards.filter((card) => card.courseId === course.id)
    const appendixRecords = data.appendixRecords.filter((record) => record.courseId === course.id)
    const dueCardCount = cards.filter((card) => isDue(card)).length
    const weakCardCount = cards.filter((card) => isWeak(card)).length
    const sourceLinkedBlockIds = new Set(
      data.flashcardSources
        .filter((source) => source.sourceTargetType === "content_block")
        .map((source) => source.sourceTargetId),
    )
    const contentBlockCount = blocks.length
    const coveredBlocks = blocks.filter((block) => sourceLinkedBlockIds.has(block.id)).length
    const words = blockText.match(/\b[\w'-]+\b/g) ?? []
    const sentences = blockText.split(/(?<=[.!?])\s+/).filter(Boolean)

    return {
      courseId: course.id,
      wordCount: words.length,
      characterCount: blockText.length,
      sentenceCount: sentences.length,
      headingCount: blocks.filter((block) => block.blockType === "heading").length,
      contentBlockCount,
      appendixRecordCount: appendixRecords.length,
      flashcardCount: cards.length,
      tokenEstimate: Math.round(words.length * 1.35),
      dueCardCount,
      weakCardCount,
      coveragePercent: contentBlockCount ? Math.round((coveredBlocks / contentBlockCount) * 100) : 0,
      updatedAt: new Date().toISOString(),
    }
  })

  return { ...data, metrics }
}

function metricPatch(data: StudyData, courseIds: string[] = []) {
  if (courseIds.length === 0) return []
  const ids = new Set(courseIds)
  return data.metrics.filter((metric) => ids.has(metric.courseId))
}

function getSuggestionCardPayloads(suggestion: AiSuggestion): SuggestionCardPayload[] {
  const cards = suggestion.payload.cards
  if (!Array.isArray(cards)) return []

  return cards
    .filter((card): card is Record<string, unknown> => Boolean(card) && typeof card === "object" && !Array.isArray(card))
    .map((card) => ({
      cardType:
        card.cardType === "definition" ||
        card.cardType === "cloze" ||
        card.cardType === "true_false" ||
        card.cardType === "person" ||
        card.cardType === "image" ||
        card.cardType === "basic"
          ? card.cardType
          : undefined,
      prompt: typeof card.prompt === "string" ? card.prompt : undefined,
      answer: typeof card.answer === "string" ? card.answer : undefined,
      sourceTargetType:
        card.sourceTargetType === "content_block" ||
        card.sourceTargetType === "text_anchor" ||
        card.sourceTargetType === "appendix_record" ||
        card.sourceTargetType === "source" ||
        card.sourceTargetType === "asset"
          ? card.sourceTargetType
          : undefined,
      sourceTargetId: typeof card.sourceTargetId === "string" ? card.sourceTargetId : undefined,
    }))
}

function toErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unexpected error"
}

export function StudyDataProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<StudyWorkspaceMode>(() => initialWorkspaceMode())
  const [session, setSession] = useState<Session | null>(null)
  const [authReady, setAuthReady] = useState(!isSupabaseConfigured)
  const [isLoading, setIsLoading] = useState(mode === "live")
  const [pendingMutations, setPendingMutations] = useState(0)
  const [lastError, setLastError] = useState<string | null>(null)
  const [data, setData] = useState<StudyData>(() => (mode === "demo" ? loadInitialStudyData() : emptyStudyData("")))
  const dataRef = useRef(data)
  const modeRef = useRef(mode)
  const sessionRef = useRef(session)
  const persistQueueRef = useRef(Promise.resolve())

  useEffect(() => {
    dataRef.current = data
  }, [data])

  useEffect(() => {
    modeRef.current = mode
  }, [mode])

  useEffect(() => {
    sessionRef.current = session
  }, [session])

  const setWorkspaceMode = useCallback((nextMode: StudyWorkspaceMode) => {
    localStorage.setItem(modeKey, nextMode)
    modeRef.current = nextMode
    setMode(nextMode)
  }, [])

  const runOperation = useCallback(async <T,>(operation: () => Promise<T>): Promise<T> => {
    setPendingMutations((count) => count + 1)
    try {
      const result = await operation()
      setLastError(null)
      return result
    } catch (error) {
      const message = toErrorMessage(error)
      setLastError(message)
      throw error
    } finally {
      setPendingMutations((count) => Math.max(0, count - 1))
    }
  }, [])

  const persistPatch = useCallback(async (patch: SupabaseStudyPatch) => {
    if (modeRef.current !== "live") return
    if (!supabase) throw new Error("Supabase is not configured")
    await upsertSupabaseStudyPatch(supabase, patch)
  }, [])

  const commitMutation = useCallback(
    async <T,>(
      builder: (current: StudyData, idFactory: (prefix: string) => string) => MutationBuild<T>,
    ): Promise<T> => {
      const current = dataRef.current
      const activeMode = modeRef.current
      const idFactory = (prefix: string) => makeId(activeMode, prefix)
      const mutation = builder(current, idFactory)
      const nextData = recalculateMetrics(normalizeStudyData(mutation.data))
      const metrics = metricPatch(nextData, mutation.metricCourseIds)
      const patch: SupabaseStudyPatch = {
        ...(mutation.patch ?? {}),
        metrics: [...(mutation.patch?.metrics ?? []), ...metrics],
      }

      dataRef.current = nextData
      setData(nextData)

      await runOperation(async () => {
        if (modeRef.current !== "live") {
          await persistPatch(patch)
          return
        }

        const queuedWrite = persistQueueRef.current.catch(() => undefined).then(() => persistPatch(patch))
        persistQueueRef.current = queuedWrite.then(
          () => undefined,
          () => undefined,
        )
        await queuedWrite
      })

      return mutation.result
    },
    [persistPatch, runOperation],
  )

  const loadLiveData = useCallback(async () => {
    if (modeRef.current !== "live" || !sessionRef.current?.user.id) return
    if (!supabase) throw new Error("Supabase is not configured")
    const loaded = await loadSupabaseStudyData(supabase, sessionRef.current.user.id)
    const nextData = recalculateMetrics(normalizeStudyData(loaded))
    dataRef.current = nextData
    setData(nextData)
    await upsertSupabaseStudyPatch(supabase, { metrics: nextData.metrics })
  }, [])

  useEffect(() => {
    if (!supabase) {
      return
    }

    let active = true

    supabase.auth.getSession().then(({ data: authData, error }) => {
      if (!active) return
      if (error) setLastError(error.message)
      setSession(authData.session)
      setAuthReady(true)
      if (authData.session && localStorage.getItem(modeKey) !== "demo") setWorkspaceMode("live")
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      if (nextSession && localStorage.getItem(modeKey) !== "demo") setWorkspaceMode("live")
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [setWorkspaceMode])

  useEffect(() => {
    let active = true

    queueMicrotask(() => {
      if (!active) return

      if (mode === "demo") {
        const demoData = loadInitialStudyData()
        dataRef.current = demoData
        setData(demoData)
        setIsLoading(false)
        return
      }

      if (!authReady) return

      if (!session?.user.id) {
        const empty = emptyStudyData("")
        dataRef.current = empty
        setData(empty)
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      loadLiveData()
        .catch((error) => {
          if (active) setLastError(toErrorMessage(error))
        })
        .finally(() => {
          if (active) setIsLoading(false)
        })
    })

    return () => {
      active = false
    }
  }, [authReady, loadLiveData, mode, session?.user.id])

  useEffect(() => {
    if (mode !== "demo") return
    localStorage.setItem(storageKey, JSON.stringify(data))
  }, [data, mode])

  const activateDemoWorkspace = useCallback(() => {
    setWorkspaceMode("demo")
    const demoData = loadInitialStudyData()
    dataRef.current = demoData
    setData(demoData)
    setIsLoading(false)
  }, [setWorkspaceMode])

  const activateLiveWorkspace = useCallback(() => {
    if (!isSupabaseConfigured) return
    setWorkspaceMode("live")
  }, [setWorkspaceMode])

  const signInWithPassword = useCallback(
    async (email: string, password: string) =>
      runOperation(async () => {
        if (!supabase) throw new Error("Supabase is not configured")
        const { data: authData, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw new Error(error.message)
        setSession(authData.session)
        setWorkspaceMode("live")
        return authData.session
      }),
    [runOperation, setWorkspaceMode],
  )

  const signUpWithPassword = useCallback(
    async (email: string, password: string) =>
      runOperation(async () => {
        if (!supabase) throw new Error("Supabase is not configured")
        const { data: authData, error } = await supabase.auth.signUp({ email, password })
        if (error) throw new Error(error.message)
        setSession(authData.session)
        setWorkspaceMode("live")
        return authData.session
      }),
    [runOperation, setWorkspaceMode],
  )

  const signOut = useCallback(
    async () =>
      runOperation(async () => {
        if (!supabase) return
        const { error } = await supabase.auth.signOut()
        if (error) throw new Error(error.message)
        setSession(null)
        setWorkspaceMode("live")
        const empty = emptyStudyData("")
        dataRef.current = empty
        setData(empty)
      }),
    [runOperation, setWorkspaceMode],
  )

  const reload = useCallback(
    async () =>
      runOperation(async () => {
        if (modeRef.current === "demo") {
          const demoData = loadInitialStudyData()
          dataRef.current = demoData
          setData(demoData)
          return
        }
        await loadLiveData()
      }),
    [loadLiveData, runOperation],
  )

  const resetDemoData = useCallback(
    async () =>
      runOperation(async () => {
        localStorage.setItem(seedVersionKey, demoSeedVersion)
        localStorage.setItem(storageKey, JSON.stringify(defaultStudyData))
        setWorkspaceMode("demo")
        const demoData = normalizeStudyData(defaultStudyData)
        dataRef.current = demoData
        setData(demoData)
      }),
    [runOperation, setWorkspaceMode],
  )

  const createCourse = useCallback(
    async (input: CreateCourseInput) =>
      commitMutation<Course>((current, idFactory) => {
        const timestamp = new Date().toISOString()
        const course: Course = {
          id: idFactory("course"),
          ownerId: modeRef.current === "live" ? sessionRef.current?.user.id ?? current.profileId : defaultStudyData.profileId,
          title: input.title,
          description: input.description,
          mainLanguage: input.mainLanguage,
          subject: input.subject,
          difficultyLevel: input.difficultyLevel,
          status: "draft",
          examDate: input.examDate || undefined,
          targetDate: input.targetDate || undefined,
          sourceType: "mixed",
          estimatedStudyMinutes: 0,
          masteryScore: 0,
          confidenceScore: 0,
          tags: [],
          createdAt: timestamp,
          updatedAt: timestamp,
        }
        const nodes = createInitialNodes(course, idFactory)
        const tables = createDefaultAppendixTables(course.id, idFactory)

        return {
          result: course,
          metricCourseIds: [course.id],
          patch: { courses: [course], courseNodes: nodes, appendixTables: tables },
          data: {
            ...current,
            profileId: course.ownerId,
            courses: [course, ...current.courses],
            courseNodes: [...current.courseNodes, ...nodes],
            appendixTables: [...current.appendixTables, ...tables],
          },
        }
      }),
    [commitMutation],
  )

  const updateCourse = useCallback(
    async (courseId: string, patch: Partial<Course>) =>
      commitMutation<void>((current) => {
        const updated = current.courses.map((course) =>
          course.id === courseId ? { ...course, ...patch, updatedAt: new Date().toISOString() } : course,
        )
        const course = updated.find((item) => item.id === courseId)
        return {
          result: undefined,
          metricCourseIds: [courseId],
          patch: course ? { courses: [course] } : undefined,
          data: { ...current, courses: updated },
        }
      }),
    [commitMutation],
  )

  const addCourseNode = useCallback(
    async (courseId: string, parentId: string | undefined, nodeType: CourseNodeType, title: string) =>
      commitMutation<CourseNode>((current, idFactory) => {
        const course = current.courses.find((item) => item.id === courseId)
        if (!course) throw new Error("Course not found")
        const siblings = current.courseNodes.filter((node) => node.courseId === courseId && node.parentId === parentId)
        const parent = parentId ? current.courseNodes.find((node) => node.id === parentId) : undefined
        const position = siblings.length + 1
        const depth = parent ? parent.depth + 1 : 0
        const numberingPath = makeNumberingPath(parent?.numberingPath ?? [], depth, position)
        const timestamp = new Date().toISOString()
        const node: CourseNode = {
          id: idFactory("node"),
          courseId,
          parentId,
          nodeType,
          title,
          position,
          depth,
          numberingPath,
          displayNumber: displayNumber(numberingPath),
          language: course.mainLanguage,
          isCollapsedDefault: false,
          createdAt: timestamp,
          updatedAt: timestamp,
        }

        return {
          result: node,
          metricCourseIds: [courseId],
          patch: { courseNodes: [node] },
          data: { ...current, courseNodes: [...current.courseNodes, node] },
        }
      }),
    [commitMutation],
  )

  const addContentBlock = useCallback(
    async (input: AddBlockInput) =>
      commitMutation<ContentBlock>((current, idFactory) => {
        const node = current.courseNodes.find((item) => item.id === input.nodeId)
        const course = current.courses.find((item) => item.id === input.courseId)
        if (!node || !course) throw new Error("Course node not found")
        const siblings = current.contentBlocks.filter((block) => block.nodeId === input.nodeId)
        const timestamp = new Date().toISOString()
        const block: ContentBlock = {
          id: idFactory("block"),
          courseId: input.courseId,
          nodeId: input.nodeId,
          blockType: input.blockType,
          position: siblings.length + 1,
          depth: input.blockType === "heading" ? 1 : 2,
          content: { text: input.text },
          plainText: input.text,
          language: course.mainLanguage,
          numberingPath: node.numberingPath,
          displayNumber: input.blockType === "heading" ? `${node.displayNumber}.${siblings.length + 1}` : "",
          isCollapsible: input.blockType === "heading",
          isCollapsed: false,
          version: 1,
          contentHash: getTextHash(input.text),
          createdAt: timestamp,
          updatedAt: timestamp,
        }

        return {
          result: block,
          metricCourseIds: [input.courseId],
          patch: { contentBlocks: [block] },
          data: { ...current, contentBlocks: [...current.contentBlocks, block] },
        }
      }),
    [commitMutation],
  )

  const updateContentBlock = useCallback(
    async (blockId: string, text: string) =>
      commitMutation<void>((current, idFactory) => {
        const block = current.contentBlocks.find((item) => item.id === blockId)
        if (!block) return { result: undefined, data: current }
        const timestamp = new Date().toISOString()
        const nextHash = getTextHash(text)
        const changed = nextHash !== block.contentHash
        const nextBlock: ContentBlock = {
          ...block,
          content: { ...block.content, text },
          plainText: text,
          version: changed ? block.version + 1 : block.version,
          contentHash: nextHash,
          updatedAt: timestamp,
        }
        const versionRow: ContentBlockVersion | undefined = changed
          ? {
              id: idFactory("block_version"),
              contentBlockId: blockId,
              version: nextBlock.version,
              content: nextBlock.content,
              plainText: text,
              contentHash: nextHash,
              createdBy: current.profileId,
              createdAt: timestamp,
            }
          : undefined
        const flashcardIds = new Set(
          current.flashcardSources
            .filter((source) => source.sourceTargetType === "content_block" && source.sourceTargetId === blockId)
            .map((source) => source.flashcardId),
        )
        const nextAnchors = current.contentTextAnchors.map((anchor) =>
          anchor.contentBlockId === blockId ? { ...anchor, anchorStatus: "needs_review" as const, updatedAt: timestamp } : anchor,
        )
        const nextFlashcards = current.flashcards.map((card) =>
          changed && flashcardIds.has(card.id) ? { ...card, staleStatus: "needs_review" as const, updatedAt: timestamp } : card,
        )

        return {
          result: undefined,
          metricCourseIds: [block.courseId],
          patch: {
            contentBlocks: [nextBlock],
            contentBlockVersions: versionRow ? [versionRow] : [],
            contentTextAnchors: nextAnchors.filter((anchor) => anchor.contentBlockId === blockId),
            flashcards: nextFlashcards.filter((card) => changed && flashcardIds.has(card.id)),
          },
          data: {
            ...current,
            contentBlocks: current.contentBlocks.map((item) => (item.id === blockId ? nextBlock : item)),
            contentBlockVersions: versionRow ? [...current.contentBlockVersions, versionRow] : current.contentBlockVersions,
            contentTextAnchors: nextAnchors,
            flashcards: nextFlashcards,
          },
        }
      }),
    [commitMutation],
  )

  const toggleBlockCollapse = useCallback(
    async (blockId: string) =>
      commitMutation<void>((current) => {
        const block = current.contentBlocks.find((item) => item.id === blockId)
        if (!block) return { result: undefined, data: current }
        const nextBlock = { ...block, isCollapsed: !block.isCollapsed, updatedAt: new Date().toISOString() }
        return {
          result: undefined,
          patch: { contentBlocks: [nextBlock] },
          data: { ...current, contentBlocks: current.contentBlocks.map((item) => (item.id === blockId ? nextBlock : item)) },
        }
      }),
    [commitMutation],
  )

  const importTextToNode = useCallback(
    async (courseId: string, nodeId: string, text: string) =>
      commitMutation<number>((current, idFactory) => {
        const course = current.courses.find((item) => item.id === courseId)
        const node = current.courseNodes.find((item) => item.id === nodeId)
        if (!course || !node) return { result: 0, data: current }
        const existingCount = current.contentBlocks.filter((item) => item.nodeId === nodeId).length
        const blocks = splitPastedText(text, course, node, idFactory).map((block, index) => ({
          ...block,
          position: existingCount + index + 1,
        }))

        return {
          result: blocks.length,
          metricCourseIds: [courseId],
          patch: { contentBlocks: blocks },
          data: { ...current, contentBlocks: [...current.contentBlocks, ...blocks] },
        }
      }),
    [commitMutation],
  )

  const addAppendixTable = useCallback(
    async (courseId: string, name: string) =>
      commitMutation<AppendixTable>((current, idFactory) => {
        const siblings = current.appendixTables.filter((table) => table.courseId === courseId)
        const timestamp = new Date().toISOString()
        const table: AppendixTable = {
          id: idFactory("table"),
          courseId,
          name,
          slug: slugify(name),
          tableType: "custom",
          isDefault: false,
          description: "Custom structured appendix table.",
          position: siblings.length + 1,
          createdAt: timestamp,
          updatedAt: timestamp,
        }

        return {
          result: table,
          metricCourseIds: [courseId],
          patch: { appendixTables: [table] },
          data: { ...current, appendixTables: [...current.appendixTables, table] },
        }
      }),
    [commitMutation],
  )

  const addAppendixRecord = useCallback(
    async (input: AddAppendixRecordInput) =>
      commitMutation<AppendixRecord>((current, idFactory) => {
        const timestamp = new Date().toISOString()
        const record: AppendixRecord = {
          id: idFactory("record"),
          courseId: input.courseId,
          appendixTableId: input.appendixTableId,
          title: input.title,
          recordType: current.appendixTables.find((table) => table.id === input.appendixTableId)?.tableType ?? "custom",
          shortDescription: input.shortDescription,
          language: input.language,
          aliases: [],
          translations: {},
          tags: input.tags,
          userNotes: "",
          version: 1,
          recordHash: getTextHash(`${input.title}:${input.shortDescription}`),
          createdMethod: "manual",
          createdAt: timestamp,
          updatedAt: timestamp,
        }

        return {
          result: record,
          metricCourseIds: [input.courseId],
          patch: { appendixRecords: [record] },
          data: { ...current, appendixRecords: [...current.appendixRecords, record] },
        }
      }),
    [commitMutation],
  )

  const linkContentToAppendix = useCallback(
    async (courseId: string, blockId: string, recordId: string) =>
      commitMutation<EntityLink>((current, idFactory) => {
        const link: EntityLink = {
          id: idFactory("link"),
          courseId,
          fromType: "content_block",
          fromId: blockId,
          toType: "appendix_record",
          toId: recordId,
          linkType: "references",
          createdMethod: "manual",
          createdAt: new Date().toISOString(),
        }

        return {
          result: link,
          metricCourseIds: [courseId],
          patch: { entityLinks: [link] },
          data: { ...current, entityLinks: [...current.entityLinks, link] },
        }
      }),
    [commitMutation],
  )

  const addFlashcard = useCallback(
    async (input: AddFlashcardInput) =>
      commitMutation<Flashcard>((current, idFactory) => {
        const timestamp = new Date().toISOString()
        const sourceWarning = !input.sourceTargetId
        const card: Flashcard = {
          id: idFactory("card"),
          courseId: input.courseId,
          cardType: input.cardType,
          prompt: { text: input.prompt },
          answer: { text: input.answer },
          explanation: "",
          hint: "",
          sourceExcerpt: input.sourceExcerpt ?? "",
          difficultyLevel: "intermediate",
          tags: input.tags,
          language: input.language,
          relatedAppendixRecordId: input.relatedAppendixRecordId,
          sourceWarning,
          masteryScore: 0,
          confidenceScore: 0,
          dueAt: timestamp,
          intervalDays: 0,
          easeFactor: 2.5,
          stability: 0,
          difficulty: 0.5,
          lapses: 0,
          reviewCount: 0,
          staleStatus: "fresh",
          createdMethod: "manual",
          userNotes: "",
          createdAt: timestamp,
          updatedAt: timestamp,
        }
        const source =
          input.sourceTargetId && input.sourceTargetType
            ? {
                id: idFactory("card_source"),
                flashcardId: card.id,
                sourceTargetType: input.sourceTargetType,
                sourceTargetId: input.sourceTargetId,
                sourceExcerpt: input.sourceExcerpt ?? "",
                createdAt: timestamp,
              }
            : undefined

        return {
          result: card,
          metricCourseIds: [input.courseId],
          patch: { flashcards: [card], flashcardSources: source ? [source] : [] },
          data: {
            ...current,
            flashcards: [...current.flashcards, card],
            flashcardSources: source ? [...current.flashcardSources, source] : current.flashcardSources,
          },
        }
      }),
    [commitMutation],
  )

  const reviewFlashcard = useCallback(
    async (courseId: string, cardId: string, rating: ReviewRating, answerText: string) =>
      commitMutation<void>((current, idFactory) => {
        const card = current.flashcards.find((item) => item.id === cardId)
        if (!card) return { result: undefined, data: current }
        const session: ReviewSession = {
          id: idFactory("session"),
          courseId,
          userId: current.profileId,
          mode: "single-card",
          filters: { cardId },
          startedAt: new Date().toISOString(),
          endedAt: new Date().toISOString(),
          durationSeconds: 0,
          cardCount: 1,
        }
        const attempt: ReviewAttempt = {
          id: idFactory("attempt"),
          reviewSessionId: session.id,
          flashcardId: cardId,
          userId: current.profileId,
          answerPayload: { text: answerText },
          selfRating: { again: 1, hard: 3, good: 4, easy: 5 }[rating],
          isCorrect: rating === "good" || rating === "easy",
          userConfirmedResult: true,
          responseTimeMs: 0,
          reviewedAt: new Date().toISOString(),
        }
        const nextCard = scheduleReview(card, rating)

        return {
          result: undefined,
          metricCourseIds: [courseId],
          patch: { reviewSessions: [session], reviewAttempts: [attempt], flashcards: [nextCard] },
          data: {
            ...current,
            reviewSessions: [...current.reviewSessions, session],
            reviewAttempts: [...current.reviewAttempts, attempt],
            flashcards: current.flashcards.map((item) => (item.id === cardId ? nextCard : item)),
          },
        }
      }),
    [commitMutation],
  )

  const createAiFlashcardSuggestion = useCallback(
    async (courseId: string, targetId: string, targetType: "content_block" | "appendix_record") =>
      commitMutation<AiSuggestion>((current, idFactory) => {
        const targetBlock = targetType === "content_block" ? current.contentBlocks.find((block) => block.id === targetId) : undefined
        const targetRecord = targetType === "appendix_record" ? current.appendixRecords.find((record) => record.id === targetId) : undefined
        const targetText = targetBlock?.plainText ?? targetRecord?.shortDescription
        const title = targetType === "content_block" ? "Flashcards from selected content" : "Flashcards from selected appendix item"
        const timestamp = new Date().toISOString()
        const suggestion: AiSuggestion = {
          id: idFactory("suggestion"),
          courseId,
          suggestionType: "flashcards",
          status: "pending",
          title,
          summary: `Suggested cards from: ${targetText?.slice(0, 110) ?? "selected source"}`,
          payload: {
            cards: [
              {
                cardType: "basic",
                prompt: `Explain: ${(targetText ?? "this source").slice(0, 70)}`,
                answer: targetText ?? "Review the source and write a concise answer.",
                sourceTargetType: targetType,
                sourceTargetId: targetId,
              },
            ],
          },
          model: "supabase-edge-function-ready",
          promptVersion: "mvp-1",
          riskLevel: "low",
          createdByContext: { targetType, targetId },
          createdAt: timestamp,
        }
        const target: AiSuggestionTarget = {
          id: idFactory("suggestion_target"),
          aiSuggestionId: suggestion.id,
          targetType,
          targetId,
          targetVersion: targetBlock?.version ?? targetRecord?.version,
          targetHash: targetBlock?.contentHash ?? targetRecord?.recordHash,
        }

        return {
          result: suggestion,
          metricCourseIds: [courseId],
          patch: { aiSuggestions: [suggestion], aiSuggestionTargets: [target] },
          data: {
            ...current,
            aiSuggestions: [suggestion, ...current.aiSuggestions],
            aiSuggestionTargets: [...current.aiSuggestionTargets, target],
          },
        }
      }),
    [commitMutation],
  )

  const resolveSuggestion = useCallback(
    async (suggestionId: string, status: AiSuggestion["status"]) =>
      commitMutation<void>((current, idFactory) => {
        const suggestion = current.aiSuggestions.find((item) => item.id === suggestionId)
        if (!suggestion) return { result: undefined, data: current }
        const acceptedCards = status === "accepted" && suggestion.suggestionType === "flashcards" ? getSuggestionCardPayloads(suggestion) : []
        const timestamp = new Date().toISOString()
        const cards: Flashcard[] = acceptedCards.map((item) => ({
          id: idFactory("card"),
          courseId: suggestion.courseId,
          cardType: item.cardType ?? "basic",
          prompt: { text: item.prompt ?? "Review this source" },
          answer: { text: item.answer ?? "" },
          explanation: "",
          hint: "",
          sourceExcerpt: item.answer?.slice(0, 180) ?? "",
          difficultyLevel: "intermediate",
          tags: ["ai-suggested"],
          language: current.courses.find((course) => course.id === suggestion.courseId)?.mainLanguage ?? "en",
          sourceWarning: !item.sourceTargetId,
          masteryScore: 0,
          confidenceScore: 0,
          dueAt: timestamp,
          intervalDays: 0,
          easeFactor: 2.5,
          stability: 0,
          difficulty: 0.5,
          lapses: 0,
          reviewCount: 0,
          staleStatus: "fresh",
          createdMethod: "ai",
          userNotes: "",
          createdAt: timestamp,
          updatedAt: timestamp,
        }))
        const sources: FlashcardSource[] = cards.flatMap((card, index) => {
          const source = acceptedCards[index]
          if (!source.sourceTargetId || !source.sourceTargetType) return []
          return [
            {
              id: idFactory("card_source"),
              flashcardId: card.id,
              sourceTargetType: source.sourceTargetType,
              sourceTargetId: source.sourceTargetId,
              sourceExcerpt: source.answer?.slice(0, 180) ?? "",
              createdAt: timestamp,
            },
          ]
        })
        const resolvedSuggestion: AiSuggestion = { ...suggestion, status, resolvedAt: timestamp }

        return {
          result: undefined,
          metricCourseIds: [suggestion.courseId],
          patch: { aiSuggestions: [resolvedSuggestion], flashcards: cards, flashcardSources: sources },
          data: {
            ...current,
            aiSuggestions: current.aiSuggestions.map((item) => (item.id === suggestionId ? resolvedSuggestion : item)),
            flashcards: [...current.flashcards, ...cards],
            flashcardSources: [...current.flashcardSources, ...sources],
          },
        }
      }),
    [commitMutation],
  )

  const value = useMemo<StudyDataContextValue>(
    () => ({
      data,
      mode,
      isLiveMode: mode === "live",
      isLoading,
      authReady,
      pendingMutations,
      lastError,
      user: session?.user ?? null,
      session,
      activateDemoWorkspace,
      activateLiveWorkspace,
      signInWithPassword,
      signUpWithPassword,
      signOut,
      reload,
      resetDemoData,
      createCourse,
      updateCourse,
      addCourseNode,
      addContentBlock,
      updateContentBlock,
      toggleBlockCollapse,
      importTextToNode,
      addAppendixTable,
      addAppendixRecord,
      linkContentToAppendix,
      addFlashcard,
      reviewFlashcard,
      createAiFlashcardSuggestion,
      resolveSuggestion,
    }),
    [
      addAppendixRecord,
      addAppendixTable,
      addContentBlock,
      addCourseNode,
      addFlashcard,
      authReady,
      createAiFlashcardSuggestion,
      createCourse,
      data,
      importTextToNode,
      isLoading,
      lastError,
      linkContentToAppendix,
      mode,
      pendingMutations,
      reload,
      resetDemoData,
      resolveSuggestion,
      reviewFlashcard,
      session,
      signInWithPassword,
      signOut,
      signUpWithPassword,
      toggleBlockCollapse,
      updateContentBlock,
      updateCourse,
      activateDemoWorkspace,
      activateLiveWorkspace,
    ],
  )

  return <StudyDataContext.Provider value={value}>{children}</StudyDataContext.Provider>
}

export function useStudyData() {
  const context = useContext(StudyDataContext)
  if (!context) throw new Error("useStudyData must be used inside StudyDataProvider")
  return context
}
