import { Navigate, Route, Routes } from "react-router-dom"
import type { ReactNode } from "react"
import { AppShell } from "@/components/layout/app-shell"
import { AnalyticsPage } from "@/pages/analytics-page"
import { AppendicesPage } from "@/pages/appendices-page"
import { ContentPage } from "@/pages/content-page"
import { CourseOverviewPage } from "@/pages/course-overview-page"
import { CoursesPage } from "@/pages/courses-page"
import { DashboardPage } from "@/pages/dashboard-page"
import { ExportPage } from "@/pages/export-page"
import { FlashcardsPage } from "@/pages/flashcards-page"
import { ImportPage } from "@/pages/import-page"
import { LoginPage } from "@/pages/login-page"
import { NewCoursePage } from "@/pages/new-course-page"
import { SearchPage } from "@/pages/search-page"
import { StudyPage } from "@/pages/study-page"
import { StudySessionPage } from "@/pages/study-session-page"
import { useStudyData } from "@/state/study-data"

function RequireWorkspace({ children }: { children: ReactNode }) {
  const { authReady, isLoading, mode, session } = useStudyData()

  if (mode === "live" && authReady && !session) return <Navigate to="/login" replace />

  if (mode === "live" && (!authReady || isLoading)) {
    return (
      <div className="grid min-h-screen place-items-center bg-background p-4">
        <div className="rounded-md border bg-card px-4 py-3 text-sm text-muted-foreground">Loading live workspace...</div>
      </div>
    )
  }

  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <RequireWorkspace>
            <AppShell />
          </RequireWorkspace>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="courses" element={<CoursesPage />} />
        <Route path="courses/new" element={<NewCoursePage />} />
        <Route path="courses/:courseId" element={<CourseOverviewPage />} />
        <Route path="courses/:courseId/content" element={<ContentPage />} />
        <Route path="courses/:courseId/appendices" element={<AppendicesPage />} />
        <Route path="courses/:courseId/flashcards" element={<FlashcardsPage />} />
        <Route path="courses/:courseId/study" element={<StudyPage />} />
        <Route path="courses/:courseId/study/session/:sessionId" element={<StudySessionPage />} />
        <Route path="courses/:courseId/analytics" element={<AnalyticsPage />} />
        <Route path="courses/:courseId/import" element={<ImportPage />} />
        <Route path="courses/:courseId/export" element={<ExportPage />} />
        <Route path="search" element={<SearchPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
