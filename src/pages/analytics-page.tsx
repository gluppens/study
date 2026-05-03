import { Activity, AlertTriangle, BarChart3, Clock, Database, Layers3, Percent, Target } from "lucide-react"
import { useParams } from "react-router-dom"
import { CourseWorkspaceShell } from "@/components/course/course-workspace-shell"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Stat } from "@/components/ui/stat"
import { formatDate } from "@/lib/utils"
import { useStudyData } from "@/state/study-data"

export function AnalyticsPage() {
  const { courseId = "" } = useParams()
  const { data } = useStudyData()
  const course = data.courses.find((item) => item.id === courseId)
  const metrics = data.metrics.find((item) => item.courseId === courseId)
  const cards = data.flashcards.filter((card) => card.courseId === courseId)
  const attempts = data.reviewAttempts.filter((attempt) => cards.some((card) => card.id === attempt.flashcardId))
  const correct = attempts.filter((attempt) => attempt.isCorrect).length
  const accuracy = attempts.length ? Math.round((correct / attempts.length) * 100) : 0
  const sectionRows = data.courseNodes
    .filter((node) => node.courseId === courseId && ["module", "chapter", "section", "subsection"].includes(node.nodeType))
    .map((node) => {
      const blocks = data.contentBlocks.filter((block) => block.nodeId === node.id)
      const linkedSources = data.flashcardSources.filter((source) =>
        blocks.some((block) => source.sourceTargetType === "content_block" && source.sourceTargetId === block.id),
      )
      const linkedCards = cards.filter((card) => linkedSources.some((source) => source.flashcardId === card.id))
      const mastery = linkedCards.length
        ? Math.round(linkedCards.reduce((sum, card) => sum + card.masteryScore, 0) / linkedCards.length)
        : 0
      return { node, blocks: blocks.length, cards: linkedCards.length, mastery }
    })

  return (
    <CourseWorkspaceShell active="analytics">
      <div className="space-y-5 p-4 md:p-6">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Stat icon={Layers3} label="Cards created" value={metrics?.flashcardCount ?? 0} accent="teal" />
          <Stat icon={Clock} label="Due cards" value={metrics?.dueCardCount ?? 0} accent="amber" />
          <Stat icon={AlertTriangle} label="Weak cards" value={metrics?.weakCardCount ?? 0} accent="rose" />
          <Stat icon={Percent} label="Review accuracy" value={`${accuracy}%`} accent="emerald" />
        </section>

        <section className="grid gap-4 xl:grid-cols-[1fr_0.8fr]">
          <Card>
            <CardHeader>
              <CardTitle>Coverage and Size Metrics</CardTitle>
              <CardDescription>Cached rollups from content blocks, appendices, and flashcards.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Flashcard coverage</span>
                  <span>{metrics?.coveragePercent ?? 0}%</span>
                </div>
                <Progress value={metrics?.coveragePercent ?? 0} />
              </div>
              <div className="grid gap-2 text-sm md:grid-cols-3">
                <div className="rounded-md border p-3">{metrics?.wordCount ?? 0} words</div>
                <div className="rounded-md border p-3">{metrics?.sentenceCount ?? 0} sentences</div>
                <div className="rounded-md border p-3">{metrics?.tokenEstimate ?? 0} token est.</div>
                <div className="rounded-md border p-3">{metrics?.headingCount ?? 0} headings</div>
                <div className="rounded-md border p-3">{metrics?.contentBlockCount ?? 0} blocks</div>
                <div className="rounded-md border p-3">{metrics?.appendixRecordCount ?? 0} appendix records</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Readiness Forecast</CardTitle>
              <CardDescription>MVP signal view; advanced decay forecast comes later.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Mastery</span>
                  <span>{Math.round(course?.masteryScore ?? 0)}%</span>
                </div>
                <Progress value={course?.masteryScore ?? 0} />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Confidence</span>
                  <span>{Math.round(course?.confidenceScore ?? 0)}%</span>
                </div>
                <Progress value={course?.confidenceScore ?? 0} />
              </div>
              <div className="rounded-md bg-teal-50 p-3 text-sm text-teal-900">
                Target: {course?.targetDate ? formatDate(course.targetDate) : "not set"} · Exam:{" "}
                {course?.examDate ? formatDate(course.examDate) : "not set"}
              </div>
            </CardContent>
          </Card>
        </section>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="size-4" />
              Mastery by Hierarchy
            </CardTitle>
            <CardDescription>Derived from cards linked to content blocks in each academic node.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {sectionRows.map(({ node, blocks, cards: cardCount, mastery }) => (
              <div key={node.id} className="grid gap-3 rounded-md border p-3 md:grid-cols-[1fr_9rem_14rem] md:items-center">
                <div>
                  <div className="font-medium">
                    <span className="font-mono text-xs text-muted-foreground">{node.displayNumber}</span> {node.title}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-2">
                    <Badge variant="outline">{node.nodeType}</Badge>
                    <Badge variant="secondary">{blocks} blocks</Badge>
                    <Badge variant="secondary">{cardCount} cards</Badge>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">{mastery}% mastery</div>
                <Progress value={mastery} />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="size-4" />
              Data Integrity
            </CardTitle>
            <CardDescription>Traceability and source freshness checks.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            <div className="rounded-md border p-3">
              <Database className="mb-2 size-4 text-teal-700" />
              {data.flashcardSources.filter((source) => cards.some((card) => card.id === source.flashcardId)).length} flashcard source links
            </div>
            <div className="rounded-md border p-3">
              <Target className="mb-2 size-4 text-amber-700" />
              {cards.filter((card) => card.sourceWarning).length} cards need source links
            </div>
            <div className="rounded-md border p-3">
              <AlertTriangle className="mb-2 size-4 text-rose-700" />
              {cards.filter((card) => card.staleStatus !== "fresh").length} stale or review-needed cards
            </div>
          </CardContent>
        </Card>
      </div>
    </CourseWorkspaceShell>
  )
}
