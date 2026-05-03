import {
  BarChart3,
  BookOpenText,
  Brain,
  Database,
  Download,
  FileInput,
  Layers3,
  Library,
} from "lucide-react"
import { type ReactNode } from "react"
import { NavLink, Navigate, useParams } from "react-router-dom"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { cn, formatShortDate } from "@/lib/utils"
import { useStudyData } from "@/state/study-data"

interface CourseWorkspaceShellProps {
  children: ReactNode
  active: "overview" | "content" | "appendices" | "flashcards" | "study" | "analytics" | "import" | "export"
}

const tabs = [
  { id: "overview", label: "Overview", icon: Library, path: "" },
  { id: "content", label: "Content", icon: BookOpenText, path: "content" },
  { id: "appendices", label: "Appendices", icon: Database, path: "appendices" },
  { id: "flashcards", label: "Flashcards", icon: Layers3, path: "flashcards" },
  { id: "study", label: "Study", icon: Brain, path: "study" },
  { id: "analytics", label: "Analytics", icon: BarChart3, path: "analytics" },
  { id: "import", label: "Import", icon: FileInput, path: "import" },
  { id: "export", label: "Export", icon: Download, path: "export" },
] as const

export function CourseWorkspaceShell({ children, active }: CourseWorkspaceShellProps) {
  const { courseId } = useParams()
  const { data } = useStudyData()
  const course = data.courses.find((item) => item.id === courseId)
  const metrics = data.metrics.find((item) => item.courseId === courseId)

  if (!course || !courseId) return <Navigate to="/courses" replace />

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      <div className="border-b bg-card">
        <div className="px-4 py-4 md:px-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge>{course.status}</Badge>
                <Badge variant="outline">{course.mainLanguage.toUpperCase()}</Badge>
                <Badge variant="secondary">{course.difficultyLevel}</Badge>
                {course.examDate && <Badge variant="warning">Exam {formatShortDate(course.examDate)}</Badge>}
              </div>
              <div>
                <h1 className="text-2xl font-semibold tracking-normal">{course.title}</h1>
                <p className="max-w-3xl text-sm text-muted-foreground">{course.description}</p>
              </div>
            </div>
            <div className="w-full max-w-md space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Course mastery</span>
                <span>{Math.round(course.masteryScore)}%</span>
              </div>
              <Progress value={course.masteryScore} />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{metrics?.dueCardCount ?? 0} due</span>
                <span>{metrics?.coveragePercent ?? 0}% coverage</span>
              </div>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto px-3 md:px-5">
          <nav className="flex min-w-max gap-1">
            {tabs.map((tab) => (
              <NavLink
                key={tab.id}
                to={`/courses/${courseId}${tab.path ? `/${tab.path}` : ""}`}
                className={cn(
                  "flex items-center gap-2 border-b-2 border-transparent px-3 py-3 text-sm font-medium text-muted-foreground hover:text-foreground",
                  active === tab.id && "border-primary text-primary",
                )}
              >
                <tab.icon className="size-4" />
                {tab.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>
      {children}
    </div>
  )
}
