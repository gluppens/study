import { uid } from "@/lib/utils"
import type { ContentBlock, Course, CourseNode, StudyData } from "./types"

export function splitPastedText(
  text: string,
  course: Course,
  node: CourseNode,
  idFactory: (prefix: string) => string = uid,
): ContentBlock[] {
  const lines = text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)

  return lines.map((line, index) => {
    const isHeading =
      line.length < 90 &&
      (/^#{1,6}\s+/.test(line) || /^[A-Z0-9 .:-]+$/.test(line) || /^\d+(\.\d+)*\s+/.test(line))
    const plainText = line.replace(/^#{1,6}\s+/, "").replace(/^\d+(\.\d+)*\s+/, "")

    return {
      id: idFactory("block"),
      courseId: course.id,
      nodeId: node.id,
      blockType: isHeading ? "heading" : "paragraph",
      position: index + 1,
      depth: isHeading ? 1 : 2,
      content: { text: plainText },
      plainText,
      language: course.mainLanguage,
      numberingPath: node.numberingPath,
      displayNumber: isHeading ? `${node.displayNumber}.${index + 1}` : "",
      isCollapsible: isHeading,
      isCollapsed: false,
      version: 1,
      contentHash: `${plainText.length}:${plainText.slice(0, 24)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  })
}

export function exportCourseJson(data: StudyData, courseId: string) {
  const course = data.courses.find((item) => item.id === courseId)
  if (!course) return "{}"

  return JSON.stringify(
    {
      course,
      courseNodes: data.courseNodes.filter((item) => item.courseId === courseId),
      contentBlocks: data.contentBlocks.filter((item) => item.courseId === courseId),
      contentBlockVersions: data.contentBlockVersions.filter((version) =>
        data.contentBlocks.some((block) => block.courseId === courseId && block.id === version.contentBlockId),
      ),
      contentTextAnchors: data.contentTextAnchors.filter((item) => item.courseId === courseId),
      appendixTables: data.appendixTables.filter((item) => item.courseId === courseId),
      appendixFields: data.appendixFields.filter((field) =>
        data.appendixTables.some((table) => table.courseId === courseId && table.id === field.appendixTableId),
      ),
      appendixRecords: data.appendixRecords.filter((item) => item.courseId === courseId),
      appendixRecordValues: data.appendixRecordValues.filter((value) =>
        data.appendixRecords.some((record) => record.courseId === courseId && record.id === value.appendixRecordId),
      ),
      sources: data.sources.filter((item) => item.courseId === courseId),
      assets: data.assets.filter((item) => item.courseId === courseId),
      flashcards: data.flashcards.filter((item) => item.courseId === courseId),
      flashcardSources: data.flashcardSources.filter((source) =>
        data.flashcards.some((card) => card.courseId === courseId && card.id === source.flashcardId),
      ),
      reviewSessions: data.reviewSessions.filter((item) => item.courseId === courseId),
      reviewAttempts: data.reviewAttempts.filter((attempt) =>
        data.flashcards.some((card) => card.courseId === courseId && card.id === attempt.flashcardId),
      ),
      studySchedules: data.studySchedules.filter((item) => item.courseId === courseId),
      aiSuggestions: data.aiSuggestions.filter((item) => item.courseId === courseId),
      aiSuggestionTargets: data.aiSuggestionTargets.filter((target) =>
        data.aiSuggestions.some((suggestion) => suggestion.courseId === courseId && suggestion.id === target.aiSuggestionId),
      ),
      entityLinks: data.entityLinks.filter((item) => item.courseId === courseId),
      tags: data.tags.filter((item) => item.courseId === courseId),
      taggings: data.taggings.filter((tagging) =>
        data.tags.some((tag) => tag.courseId === courseId && tag.id === tagging.tagId),
      ),
      metrics: data.metrics.filter((item) => item.courseId === courseId),
      exportedAt: new Date().toISOString(),
      schemaVersion: "0.1.0",
    },
    null,
    2,
  )
}

export function flashcardsToCsv(data: StudyData, courseId: string) {
  const cards = data.flashcards.filter((card) => card.courseId === courseId)
  const rows = [
    ["type", "prompt", "answer", "hint", "explanation", "tags", "language", "due_at"],
    ...cards.map((card) => [
      card.cardType,
      card.prompt.text,
      card.answer.text,
      card.hint,
      card.explanation,
      card.tags.join(";"),
      card.language,
      card.dueAt,
    ]),
  ]

  return rows
    .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","))
    .join("\n")
}
