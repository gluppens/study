import {
  AlertTriangle,
  BarChart3,
  BookOpen,
  Brain,
  CalendarClock,
  CheckCircle2,
  Clock,
  Database,
  Search,
  Sparkles,
} from "lucide-react"
import { useState } from "react"
import { Link } from "react-router-dom"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Stat } from "@/components/ui/stat"
import { formatShortDate } from "@/lib/utils"
import { useStudyData } from "@/state/study-data"

export function DashboardPage() {
  const { data } = useStudyData()
  const [now] = useState(() => Date.now())
  const activeCourses = data.courses.filter((course) => course.status === "active" || course.status === "draft")
  const dueCards = data.flashcards.filter((card) => new Date(card.dueAt).getTime() <= now)
  const pendingSuggestions = data.aiSuggestions.filter((suggestion) => suggestion.status === "pending")
  const weakCards = data.flashcards.filter((card) => card.masteryScore < 55 || card.confidenceScore < 50)
  const totalStudySeconds = data.reviewSessions.reduce((sum, session) => sum + session.durationSeconds, 0)

  return (
    <div className="space-y-6 p-4 md:p-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Stat icon={BookOpen} label="Active courses" value={activeCourses.length} accent="teal" />
        <Stat icon={Clock} label="Due cards" value={dueCards.length} accent="amber" />
        <Stat icon={AlertTriangle} label="Weak cards" value={weakCards.length} accent="rose" />
        <Stat icon={Sparkles} label="AI suggestions" value={pendingSuggestions.length} accent="indigo" />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="space-y-4">
          <div className="flex flex-col gap-3 rounded-lg border bg-card p-4 md:flex-row md:items-center">
            <Search className="size-5 text-muted-foreground" />
            <Input placeholder="Search content, appendices, flashcards, tags, and source links" className="border-0 bg-muted/60" />
            <Button asChild className="md:w-auto">
              <Link to="/search">Search</Link>
            </Button>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {activeCourses.map((course) => {
              const metrics = data.metrics.find((metric) => metric.courseId === course.id)
              return (
                <Card key={course.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <CardTitle>{course.title}</CardTitle>
                        <CardDescription>{course.subject}</CardDescription>
                      </div>
                      <Badge variant={course.status === "active" ? "success" : "secondary"}>{course.status}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="line-clamp-2 text-sm text-muted-foreground">{course.description}</p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Mastery</span>
                        <span>{Math.round(course.masteryScore)}%</span>
                      </div>
                      <Progress value={course.masteryScore} />
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="rounded-md bg-teal-50 p-2 text-teal-800">
                        <Database className="mb-1 size-4" />
                        {metrics?.appendixRecordCount ?? 0} refs
                      </div>
                      <div className="rounded-md bg-amber-50 p-2 text-amber-800">
                        <Brain className="mb-1 size-4" />
                        {metrics?.dueCardCount ?? 0} due
                      </div>
                      <div className="rounded-md bg-rose-50 p-2 text-rose-800">
                        <BarChart3 className="mb-1 size-4" />
                        {metrics?.coveragePercent ?? 0}% cov.
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <CalendarClock className="size-3" />
                        {course.examDate ? `Exam ${formatShortDate(course.examDate)}` : "No exam date"}
                      </div>
                      <Button asChild size="sm">
                        <Link to={`/courses/${course.id}/content`}>Open workspace</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Review Queue</CardTitle>
              <CardDescription>Cards ready for spaced repetition.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {dueCards.slice(0, 4).map((card) => (
                <div key={card.id} className="rounded-md border p-3">
                  <div className="text-sm font-medium">{card.prompt.text}</div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="warning">{card.cardType}</Badge>
                    <span>Mastery {Math.round(card.masteryScore)}%</span>
                  </div>
                </div>
              ))}
              {dueCards.length === 0 && (
                <div className="flex items-center gap-2 rounded-md bg-emerald-50 p-3 text-sm text-emerald-800">
                  <CheckCircle2 className="size-4" />
                  Nothing due right now.
                </div>
              )}
              {activeCourses[0] && (
                <Button asChild className="w-full">
                  <Link to={`/courses/${activeCourses[0].id}/study`}>Start study</Link>
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Validation Inbox</CardTitle>
              <CardDescription>AI outputs wait here before changing source-linked data.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {pendingSuggestions.slice(0, 4).map((suggestion) => (
                <div key={suggestion.id} className="rounded-md border p-3">
                  <div className="text-sm font-medium">{suggestion.title}</div>
                  <p className="mt-1 text-xs text-muted-foreground">{suggestion.summary}</p>
                </div>
              ))}
              {pendingSuggestions.length === 0 && <p className="text-sm text-muted-foreground">No pending suggestions.</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Study Time</CardTitle>
              <CardDescription>{Math.round(totalStudySeconds / 60)} minutes tracked from review sessions.</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>
    </div>
  )
}
