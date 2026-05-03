import { BookPlus, Filter, Search } from "lucide-react"
import { Link } from "react-router-dom"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { formatDate } from "@/lib/utils"
import { useStudyData } from "@/state/study-data"

export function CoursesPage() {
  const { data } = useStudyData()

  return (
    <div className="space-y-5 p-4 md:p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">Course Library</h1>
          <p className="text-sm text-muted-foreground">Create and reopen source-linked learning workspaces.</p>
        </div>
        <Button asChild>
          <Link to="/courses/new">
            <BookPlus />
            New course
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-3 rounded-lg border bg-card p-3 md:flex-row">
        <div className="flex flex-1 items-center gap-2 rounded-md bg-muted/60 px-3">
          <Search className="size-4 text-muted-foreground" />
          <Input placeholder="Filter by title, subject, language, tag" className="border-0 bg-transparent" />
        </div>
        <Button variant="outline">
          <Filter />
          Filters
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {data.courses.map((course) => {
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
                <p className="line-clamp-3 text-sm text-muted-foreground">{course.description}</p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">{course.mainLanguage.toUpperCase()}</Badge>
                  <Badge variant="outline">{course.difficultyLevel}</Badge>
                  {course.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Mastery</span>
                    <span>{Math.round(course.masteryScore)}%</span>
                  </div>
                  <Progress value={course.masteryScore} />
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs text-muted-foreground">
                  <div className="rounded-md border p-2">{metrics?.contentBlockCount ?? 0} blocks</div>
                  <div className="rounded-md border p-2">{metrics?.appendixRecordCount ?? 0} refs</div>
                  <div className="rounded-md border p-2">{metrics?.flashcardCount ?? 0} cards</div>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-muted-foreground">Updated {formatDate(course.updatedAt)}</span>
                  <Button asChild size="sm">
                    <Link to={`/courses/${course.id}/content`}>Open</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
