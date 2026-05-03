import { Download, FileJson, Table } from "lucide-react"
import { useParams } from "react-router-dom"
import { CourseWorkspaceShell } from "@/components/course/course-workspace-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { exportCourseJson, flashcardsToCsv } from "@/domain/import-export"
import { downloadTextFile } from "@/lib/utils"
import { useStudyData } from "@/state/study-data"

export function ExportPage() {
  const { courseId = "" } = useParams()
  const { data } = useStudyData()
  const course = data.courses.find((item) => item.id === courseId)
  const safeTitle = course?.title.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "course"

  return (
    <CourseWorkspaceShell active="export">
      <div className="mx-auto max-w-4xl space-y-5 p-4 md:p-6">
        <div>
          <h2 className="text-2xl font-semibold tracking-normal">Export</h2>
          <p className="text-sm text-muted-foreground">Export traceable course data and flashcards. Rich PDF/Word exports are later-phase work.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="mb-2 flex size-10 items-center justify-center rounded-md bg-teal-50 text-teal-800">
                <FileJson className="size-5" />
              </div>
              <CardTitle>Full Course JSON</CardTitle>
              <CardDescription>Includes course, hierarchy, blocks, appendices, sources, cards, and links.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => downloadTextFile(`${safeTitle}.json`, exportCourseJson(data, courseId))}>
                <Download />
                Export JSON
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="mb-2 flex size-10 items-center justify-center rounded-md bg-amber-50 text-amber-800">
                <Table className="size-5" />
              </div>
              <CardTitle>Flashcards CSV</CardTitle>
              <CardDescription>Works as a simple CSV export and a basis for Anki-compatible mapping.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="secondary" onClick={() => downloadTextFile(`${safeTitle}-flashcards.csv`, flashcardsToCsv(data, courseId), "text/csv")}>
                <Download />
                Export CSV
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {["PDF export", "Word export", "Anki package export"].map((item) => (
            <div key={item} className="rounded-lg border bg-card p-4">
              <div className="font-medium">{item}</div>
              <p className="mt-1 text-sm text-muted-foreground">Deferred until the document model and export layouts stabilize.</p>
            </div>
          ))}
        </div>
      </div>
    </CourseWorkspaceShell>
  )
}
