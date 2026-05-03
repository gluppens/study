import { ArrowRight, BookOpenText, Database, Layers3, Sparkles } from "lucide-react"
import { Link, useParams } from "react-router-dom"
import { CourseWorkspaceShell } from "@/components/course/course-workspace-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Stat } from "@/components/ui/stat"
import { useStudyData } from "@/state/study-data"

export function CourseOverviewPage() {
  const { courseId = "" } = useParams()
  const { data } = useStudyData()
  const course = data.courses.find((item) => item.id === courseId)
  const metrics = data.metrics.find((item) => item.courseId === courseId)

  if (!course) return null

  return (
    <CourseWorkspaceShell active="overview">
      <div className="space-y-5 p-4 md:p-6">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Stat icon={BookOpenText} label="Content blocks" value={metrics?.contentBlockCount ?? 0} accent="teal" />
          <Stat icon={Database} label="Appendix records" value={metrics?.appendixRecordCount ?? 0} accent="amber" />
          <Stat icon={Layers3} label="Flashcards" value={metrics?.flashcardCount ?? 0} accent="rose" />
          <Stat icon={Sparkles} label="Coverage" value={`${metrics?.coveragePercent ?? 0}%`} accent="indigo" />
        </section>

        <section className="grid gap-4 xl:grid-cols-[1fr_0.8fr]">
          <Card>
            <CardHeader>
              <CardTitle>Workspace Map</CardTitle>
              <CardDescription>Follow the recommended MVP workflow from source content to traceable review.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
              {[
                ["Write structured blocks", "Content is the primary course source of truth.", "content"],
                ["Build appendices", "Persons, events, places, images, and definitions stay editable.", "appendices"],
                ["Create traceable cards", "Flashcards keep source warnings until linked.", "flashcards"],
                ["Review due cards", "Spaced repetition updates mastery and confidence.", "study"],
              ].map(([title, description, path]) => (
                <Link key={title} to={`/courses/${courseId}/${path}`} className="rounded-lg border p-4 transition-colors hover:bg-muted/40">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-medium">{title}</div>
                      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
                    </div>
                    <ArrowRight className="size-4 text-muted-foreground" />
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Readiness Snapshot</CardTitle>
              <CardDescription>Basic MVP forecast using current mastery, due cards, and coverage.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Mastery</span>
                  <span>{Math.round(course.masteryScore)}%</span>
                </div>
                <Progress value={course.masteryScore} />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Confidence</span>
                  <span>{Math.round(course.confidenceScore)}%</span>
                </div>
                <Progress value={course.confidenceScore} />
              </div>
              <div className="rounded-md bg-amber-50 p-3 text-sm text-amber-900">
                Advanced readiness forecasting is a Phase 2/3 feature. This view keeps the MVP honest by showing the raw signals first.
              </div>
              <Button asChild className="w-full">
                <Link to={`/courses/${courseId}/analytics`}>Open analytics</Link>
              </Button>
            </CardContent>
          </Card>
        </section>
      </div>
    </CourseWorkspaceShell>
  )
}
