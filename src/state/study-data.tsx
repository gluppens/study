import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"
import { splitPastedText } from "@/domain/import-export"
import { displayNumber, makeNumberingPath } from "@/domain/numbering"
import { isDue, isWeak, scheduleReview } from "@/domain/review"
import type {
  AiSuggestion,
  AppendixRecord,
  AppendixTable,
  ContentBlock,
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
import { slugify, uid } from "@/lib/utils"
import { defaultStudyData } from "./demo-data"

const storageKey = "study.mvp.data"

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
  resetDemoData: () => void
  createCourse: (input: CreateCourseInput) => Course
  updateCourse: (courseId: string, patch: Partial<Course>) => void
  addCourseNode: (courseId: string, parentId: string | undefined, nodeType: CourseNodeType, title: string) => CourseNode
  addContentBlock: (input: AddBlockInput) => ContentBlock
  updateContentBlock: (blockId: string, text: string) => void
  toggleBlockCollapse: (blockId: string) => void
  importTextToNode: (courseId: string, nodeId: string, text: string) => number
  addAppendixTable: (courseId: string, name: string) => AppendixTable
  addAppendixRecord: (input: AddAppendixRecordInput) => AppendixRecord
  linkContentToAppendix: (courseId: string, blockId: string, recordId: string) => EntityLink
  addFlashcard: (input: AddFlashcardInput) => Flashcard
  reviewFlashcard: (courseId: string, cardId: string, rating: ReviewRating, answerText: string) => void
  createAiFlashcardSuggestion: (courseId: string, targetId: string, targetType: "content_block" | "appendix_record") => AiSuggestion
  resolveSuggestion: (suggestionId: string, status: AiSuggestion["status"]) => void
}

const StudyDataContext = createContext<StudyDataContextValue | null>(null)

function safeParseData(value: string | null): StudyData {
  if (!value) return defaultStudyData

  try {
    return JSON.parse(value) as StudyData
  } catch {
    return defaultStudyData
  }
}

function createDefaultAppendixTables(courseId: string): AppendixTable[] {
  const defaults: Array<[AppendixTable["name"], AppendixTable["tableType"], string]> = [
    ["Images", "images", "Structured images used inline or as study references."],
    ["Persons", "persons", "People, authors, rulers, and historical actors."],
    ["Events", "events", "Dated events and timeline records."],
    ["Places", "places", "Locations and geographic references."],
    ["Definitions", "definitions", "Terms, concepts, and formulas."],
  ]

  return defaults.map(([name, tableType, description], index) => ({
    id: uid("table"),
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

function createInitialNodes(course: Course): CourseNode[] {
  const timestamp = new Date().toISOString()
  const modulePath = makeNumberingPath([], 0, 1)
  const chapterPath = makeNumberingPath(modulePath, 1, 1)
  const sectionPath = makeNumberingPath(chapterPath, 2, 1)
  const subsectionPath = makeNumberingPath(sectionPath, 3, 1)

  const moduleId = uid("node")
  const chapterId = uid("node")
  const sectionId = uid("node")
  const subsectionId = uid("node")

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

export function StudyDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<StudyData>(() => safeParseData(localStorage.getItem(storageKey)))

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(data))
  }, [data])

  const mutate = useCallback((updater: (current: StudyData) => StudyData) => {
    setData((current) => recalculateMetrics(updater(current)))
  }, [])

  const resetDemoData = useCallback(() => {
    setData(defaultStudyData)
  }, [])

  const createCourse = useCallback(
    (input: CreateCourseInput) => {
      const timestamp = new Date().toISOString()
      const course: Course = {
        id: uid("course"),
        ownerId: defaultStudyData.profileId,
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
      const nodes = createInitialNodes(course)
      const tables = createDefaultAppendixTables(course.id)

      mutate((current) => ({
        ...current,
        courses: [course, ...current.courses],
        courseNodes: [...current.courseNodes, ...nodes],
        appendixTables: [...current.appendixTables, ...tables],
      }))

      return course
    },
    [mutate],
  )

  const updateCourse = useCallback(
    (courseId: string, patch: Partial<Course>) => {
      mutate((current) => ({
        ...current,
        courses: current.courses.map((course) =>
          course.id === courseId ? { ...course, ...patch, updatedAt: new Date().toISOString() } : course,
        ),
      }))
    },
    [mutate],
  )

  const addCourseNode = useCallback(
    (courseId: string, parentId: string | undefined, nodeType: CourseNodeType, title: string) => {
      const course = data.courses.find((item) => item.id === courseId)
      if (!course) throw new Error("Course not found")
      const siblings = data.courseNodes.filter((node) => node.courseId === courseId && node.parentId === parentId)
      const parent = parentId ? data.courseNodes.find((node) => node.id === parentId) : undefined
      const position = siblings.length + 1
      const depth = parent ? parent.depth + 1 : 0
      const numberingPath = makeNumberingPath(parent?.numberingPath ?? [], depth, position)
      const timestamp = new Date().toISOString()
      const node: CourseNode = {
        id: uid("node"),
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

      mutate((current) => ({ ...current, courseNodes: [...current.courseNodes, node] }))
      return node
    },
    [data.courseNodes, data.courses, mutate],
  )

  const addContentBlock = useCallback(
    (input: AddBlockInput) => {
      const node = data.courseNodes.find((item) => item.id === input.nodeId)
      const course = data.courses.find((item) => item.id === input.courseId)
      if (!node || !course) throw new Error("Course node not found")
      const siblings = data.contentBlocks.filter((block) => block.nodeId === input.nodeId)
      const timestamp = new Date().toISOString()
      const block: ContentBlock = {
        id: uid("block"),
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

      mutate((current) => ({ ...current, contentBlocks: [...current.contentBlocks, block] }))
      return block
    },
    [data.contentBlocks, data.courseNodes, data.courses, mutate],
  )

  const updateContentBlock = useCallback(
    (blockId: string, text: string) => {
      mutate((current) => {
        const block = current.contentBlocks.find((item) => item.id === blockId)
        if (!block) return current
        const nextHash = getTextHash(text)
        const changed = nextHash !== block.contentHash
        const flashcardIds = new Set(
          current.flashcardSources
            .filter((source) => source.sourceTargetType === "content_block" && source.sourceTargetId === blockId)
            .map((source) => source.flashcardId),
        )

        return {
          ...current,
          contentBlocks: current.contentBlocks.map((item) =>
            item.id === blockId
              ? {
                  ...item,
                  content: { ...item.content, text },
                  plainText: text,
                  version: changed ? item.version + 1 : item.version,
                  contentHash: nextHash,
                  updatedAt: new Date().toISOString(),
                }
              : item,
          ),
          contentTextAnchors: current.contentTextAnchors.map((anchor) =>
            anchor.contentBlockId === blockId ? { ...anchor, anchorStatus: "needs_review" } : anchor,
          ),
          flashcards: current.flashcards.map((card) =>
            changed && flashcardIds.has(card.id)
              ? { ...card, staleStatus: "needs_review", updatedAt: new Date().toISOString() }
              : card,
          ),
        }
      })
    },
    [mutate],
  )

  const toggleBlockCollapse = useCallback(
    (blockId: string) => {
      mutate((current) => ({
        ...current,
        contentBlocks: current.contentBlocks.map((block) =>
          block.id === blockId ? { ...block, isCollapsed: !block.isCollapsed } : block,
        ),
      }))
    },
    [mutate],
  )

  const importTextToNode = useCallback(
    (courseId: string, nodeId: string, text: string) => {
      const course = data.courses.find((item) => item.id === courseId)
      const node = data.courseNodes.find((item) => item.id === nodeId)
      if (!course || !node) return 0
      const blocks = splitPastedText(text, course, node)

      mutate((current) => ({
        ...current,
        contentBlocks: [
          ...current.contentBlocks,
          ...blocks.map((block, index) => ({
            ...block,
            position: current.contentBlocks.filter((item) => item.nodeId === nodeId).length + index + 1,
          })),
        ],
      }))

      return blocks.length
    },
    [data.courseNodes, data.courses, mutate],
  )

  const addAppendixTable = useCallback(
    (courseId: string, name: string) => {
      const siblings = data.appendixTables.filter((table) => table.courseId === courseId)
      const timestamp = new Date().toISOString()
      const table: AppendixTable = {
        id: uid("table"),
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

      mutate((current) => ({ ...current, appendixTables: [...current.appendixTables, table] }))
      return table
    },
    [data.appendixTables, mutate],
  )

  const addAppendixRecord = useCallback(
    (input: AddAppendixRecordInput) => {
      const timestamp = new Date().toISOString()
      const record: AppendixRecord = {
        id: uid("record"),
        courseId: input.courseId,
        appendixTableId: input.appendixTableId,
        title: input.title,
        recordType: data.appendixTables.find((table) => table.id === input.appendixTableId)?.tableType ?? "custom",
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

      mutate((current) => ({ ...current, appendixRecords: [...current.appendixRecords, record] }))
      return record
    },
    [data.appendixTables, mutate],
  )

  const linkContentToAppendix = useCallback(
    (courseId: string, blockId: string, recordId: string) => {
      const link: EntityLink = {
        id: uid("link"),
        courseId,
        fromType: "content_block",
        fromId: blockId,
        toType: "appendix_record",
        toId: recordId,
        linkType: "references",
        createdMethod: "manual",
        createdAt: new Date().toISOString(),
      }

      mutate((current) => ({ ...current, entityLinks: [...current.entityLinks, link] }))
      return link
    },
    [mutate],
  )

  const addFlashcard = useCallback(
    (input: AddFlashcardInput) => {
      const timestamp = new Date().toISOString()
      const sourceWarning = !input.sourceTargetId
      const card: Flashcard = {
        id: uid("card"),
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
              id: uid("card_source"),
              flashcardId: card.id,
              sourceTargetType: input.sourceTargetType,
              sourceTargetId: input.sourceTargetId,
              sourceExcerpt: input.sourceExcerpt ?? "",
              createdAt: timestamp,
            }
          : undefined

      mutate((current) => ({
        ...current,
        flashcards: [...current.flashcards, card],
        flashcardSources: source ? [...current.flashcardSources, source] : current.flashcardSources,
      }))

      return card
    },
    [mutate],
  )

  const reviewFlashcard = useCallback(
    (courseId: string, cardId: string, rating: ReviewRating, answerText: string) => {
      mutate((current) => {
        const card = current.flashcards.find((item) => item.id === cardId)
        if (!card) return current
        const session: ReviewSession = {
          id: uid("session"),
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
          id: uid("attempt"),
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
          ...current,
          reviewSessions: [...current.reviewSessions, session],
          reviewAttempts: [...current.reviewAttempts, attempt],
          flashcards: current.flashcards.map((item) => (item.id === cardId ? nextCard : item)),
        }
      })
    },
    [mutate],
  )

  const createAiFlashcardSuggestion = useCallback(
    (courseId: string, targetId: string, targetType: "content_block" | "appendix_record") => {
      const targetText =
        targetType === "content_block"
          ? data.contentBlocks.find((block) => block.id === targetId)?.plainText
          : data.appendixRecords.find((record) => record.id === targetId)?.shortDescription
      const title =
        targetType === "content_block"
          ? "Flashcards from selected content"
          : "Flashcards from selected appendix item"
      const timestamp = new Date().toISOString()
      const suggestion: AiSuggestion = {
        id: uid("suggestion"),
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

      mutate((current) => ({ ...current, aiSuggestions: [suggestion, ...current.aiSuggestions] }))
      return suggestion
    },
    [data.appendixRecords, data.contentBlocks, mutate],
  )

  const resolveSuggestion = useCallback(
    (suggestionId: string, status: AiSuggestion["status"]) => {
      mutate((current) => {
        const suggestion = current.aiSuggestions.find((item) => item.id === suggestionId)
        if (!suggestion) return current
        const acceptedCards =
          status === "accepted" && suggestion.suggestionType === "flashcards"
            ? ((suggestion.payload.cards as Array<{
                cardType?: Flashcard["cardType"]
                prompt?: string
                answer?: string
                sourceTargetType?: FlashcardSource["sourceTargetType"]
                sourceTargetId?: string
              }>) ?? [])
            : []
        const timestamp = new Date().toISOString()
        const cards: Flashcard[] = acceptedCards.map((item) => ({
          id: uid("card"),
          courseId: suggestion.courseId,
          cardType: item.cardType ?? "basic",
          prompt: { text: item.prompt ?? "Review this source" },
          answer: { text: item.answer ?? "" },
          explanation: "",
          hint: "",
          sourceExcerpt: item.answer?.slice(0, 180) ?? "",
          difficultyLevel: "intermediate",
          tags: ["ai-suggested"],
          language: data.courses.find((course) => course.id === suggestion.courseId)?.mainLanguage ?? "en",
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
              id: uid("card_source"),
              flashcardId: card.id,
              sourceTargetType: source.sourceTargetType,
              sourceTargetId: source.sourceTargetId,
              sourceExcerpt: source.answer?.slice(0, 180) ?? "",
              createdAt: timestamp,
            },
          ]
        })

        return {
          ...current,
          aiSuggestions: current.aiSuggestions.map((item) =>
            item.id === suggestionId ? { ...item, status, resolvedAt: timestamp } : item,
          ),
          flashcards: [...current.flashcards, ...cards],
          flashcardSources: [...current.flashcardSources, ...sources],
        }
      })
    },
    [data.courses, mutate],
  )

  const value = useMemo<StudyDataContextValue>(
    () => ({
      data,
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
      createAiFlashcardSuggestion,
      createCourse,
      data,
      importTextToNode,
      linkContentToAppendix,
      resetDemoData,
      resolveSuggestion,
      reviewFlashcard,
      toggleBlockCollapse,
      updateContentBlock,
      updateCourse,
    ],
  )

  return <StudyDataContext.Provider value={value}>{children}</StudyDataContext.Provider>
}

export function useStudyData() {
  const context = useContext(StudyDataContext)
  if (!context) throw new Error("useStudyData must be used inside StudyDataProvider")
  return context
}
