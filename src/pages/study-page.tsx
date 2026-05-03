import { Brain, CalendarCheck, Dices, Flag, Image, Layers3, ListFilter, Tags, TimerReset, Zap } from "lucide-react"
import { Link, useParams } from "react-router-dom"
import { CourseWorkspaceShell } from "@/components/course/course-workspace-shell"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useStudyData } from "@/state/study-data"

const modes = [
  {
    id: "due",
    title: "Review due cards",
    description: "Use spaced repetition due dates.",
    icon: CalendarCheck,
    accent: "bg-teal-50 text-teal-800",
  },
  {
    id: "new",
    title: "Study new cards",
    description: "Introduce cards that have not been reviewed.",
    icon: Zap,
    accent: "bg-amber-50 text-amber-800",
  },
  {
    id: "weak",
    title: "Weak cards only",
    description: "Target low mastery, low confidence, or repeated lapses.",
    icon: Flag,
    accent: "bg-rose-50 text-rose-800",
  },
  {
    id: "section",
    title: "Study one section",
    description: "Use cards sourced from course content blocks.",
    icon: ListFilter,
    accent: "bg-indigo-50 text-indigo-800",
  },
  {
    id: "appendix",
    title: "Study appendix table",
    description: "Practice persons, events, places, images, or definitions.",
    icon: Layers3,
    accent: "bg-emerald-50 text-emerald-800",
  },
  {
    id: "tag",
    title: "Focus by tag",
    description: "Mix cards around one topic or concept.",
    icon: Tags,
    accent: "bg-cyan-50 text-cyan-800",
  },
  {
    id: "random",
    title: "Random mixed mode",
    description: "Shuffle across the whole course.",
    icon: Dices,
    accent: "bg-stone-100 text-stone-800",
  },
  {
    id: "image",
    title: "Image recognition",
    description: "Practice image-based cards.",
    icon: Image,
    accent: "bg-pink-50 text-pink-800",
  },
]

export function StudyPage() {
  const { courseId = "" } = useParams()
  const { data } = useStudyData()
  const cards = data.flashcards.filter((card) => card.courseId === courseId)

  function countForMode(mode: string) {
    if (mode === "due") return cards.filter((card) => new Date(card.dueAt).getTime() <= Date.now()).length
    if (mode === "new") return cards.filter((card) => card.reviewCount === 0).length
    if (mode === "weak") return cards.filter((card) => card.masteryScore < 55 || card.confidenceScore < 50 || card.lapses >= 2).length
    if (mode === "image") return cards.filter((card) => card.cardType === "image").length
    return cards.length
  }

  return (
    <CourseWorkspaceShell active="study">
      <div className="space-y-5 p-4 md:p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-normal">Study</h2>
            <p className="text-sm text-muted-foreground">Choose a session mode. Mobile review is intentionally fast and focused.</p>
          </div>
          <Badge variant="secondary">
            <TimerReset className="mr-1 size-3" />
            SM-2 MVP scheduler
          </Badge>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {modes.map((mode) => {
            const count = countForMode(mode.id)
            return (
              <Card key={mode.id}>
                <CardHeader>
                  <div className={`mb-2 flex size-10 items-center justify-center rounded-md ${mode.accent}`}>
                    <mode.icon className="size-5" />
                  </div>
                  <CardTitle>{mode.title}</CardTitle>
                  <CardDescription>{mode.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Badge variant={count > 0 ? "default" : "outline"}>{count} cards</Badge>
                  <Button asChild className="w-full" disabled={count === 0}>
                    <Link to={`/courses/${courseId}/study/session/${mode.id}`}>
                      <Brain />
                      Start
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </CourseWorkspaceShell>
  )
}
