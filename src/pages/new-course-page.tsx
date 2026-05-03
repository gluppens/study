import { ArrowLeft, BookPlus } from "lucide-react"
import { type FormEvent, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type { DifficultyLevel, Language } from "@/domain/types"
import { useStudyData } from "@/state/study-data"

export function NewCoursePage() {
  const navigate = useNavigate()
  const { createCourse, pendingMutations } = useStudyData()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [subject, setSubject] = useState("")
  const [mainLanguage, setMainLanguage] = useState<Language>("en")
  const [difficultyLevel, setDifficultyLevel] = useState<DifficultyLevel>("intermediate")
  const [examDate, setExamDate] = useState("")
  const [targetDate, setTargetDate] = useState("")

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    const course = await createCourse({
      title: title.trim() || "Untitled course",
      description: description.trim(),
      subject: subject.trim() || "General",
      mainLanguage,
      difficultyLevel,
      examDate,
      targetDate,
    })
    navigate(`/courses/${course.id}/content`)
  }

  return (
    <div className="mx-auto max-w-3xl p-4 md:p-6">
      <div className="mb-5">
        <Button asChild variant="ghost" size="sm">
          <Link to="/courses">
            <ArrowLeft />
            Back to library
          </Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Create Course</CardTitle>
          <CardDescription>
            Start with metadata and a default academic hierarchy. You can refine the tree inside the workspace.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-5" onSubmit={onSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" value={title} onChange={(event) => setTitle(event.target.value)} required />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" value={description} onChange={(event) => setDescription(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input id="subject" value={subject} onChange={(event) => setSubject(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="language">Main language</Label>
                <Select
                  id="language"
                  value={mainLanguage}
                  onChange={(event) => setMainLanguage(event.target.value as Language)}
                  options={[
                    { label: "English", value: "en" },
                    { label: "Dutch", value: "nl" },
                    { label: "French", value: "fr" },
                  ]}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="difficulty">Difficulty</Label>
                <Select
                  id="difficulty"
                  value={difficultyLevel}
                  onChange={(event) => setDifficultyLevel(event.target.value as DifficultyLevel)}
                  options={[
                    { label: "Intro", value: "intro" },
                    { label: "Intermediate", value: "intermediate" },
                    { label: "Advanced", value: "advanced" },
                  ]}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="targetDate">Target date</Label>
                <Input id="targetDate" type="date" value={targetDate} onChange={(event) => setTargetDate(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="examDate">Exam date</Label>
                <Input id="examDate" type="date" value={examDate} onChange={(event) => setExamDate(event.target.value)} />
              </div>
            </div>
            <Button type="submit" disabled={pendingMutations > 0}>
              <BookPlus />
              {pendingMutations > 0 ? "Creating..." : "Create course"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
