import {
  BarChart3,
  BookOpen,
  BrainCircuit,
  Database,
  Home,
  LibraryBig,
  LogIn,
  LogOut,
  PanelLeftClose,
  Search,
  Sparkles,
} from "lucide-react"
import { useMemo, useState } from "react"
import { NavLink, Outlet, useLocation } from "react-router-dom"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { useStudyData } from "@/state/study-data"

const navItems = [
  { to: "/", label: "Dashboard", icon: Home },
  { to: "/courses", label: "Courses", icon: LibraryBig },
  { to: "/search", label: "Search", icon: Search },
  { to: "/login", label: "Auth", icon: LogIn },
]

export function AppShell() {
  const [open, setOpen] = useState(false)
  const { data, mode, pendingMutations, signOut, user, lastError } = useStudyData()
  const location = useLocation()
  const activeCourse = useMemo(() => {
    const match = location.pathname.match(/\/courses\/([^/]+)/)
    return data.courses.find((course) => course.id === match?.[1])
  }, [data.courses, location.pathname])

  return (
    <div className="min-h-screen bg-background">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-72 border-r bg-card transition-transform lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center justify-between px-4">
            <NavLink to="/" className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <BrainCircuit className="size-5" />
              </div>
              <div>
                <div className="text-base font-semibold">Study</div>
                <div className="text-xs text-muted-foreground">Source-linked learning</div>
              </div>
            </NavLink>
            <Button className="lg:hidden" variant="ghost" size="icon" onClick={() => setOpen(false)}>
              <PanelLeftClose />
            </Button>
          </div>
          <Separator />
          <nav className="flex-1 space-y-1 p-3">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground",
                    isActive && "bg-primary/10 text-primary",
                  )
                }
              >
                <item.icon className="size-4" />
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="space-y-3 border-t p-4">
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="rounded-md bg-teal-50 p-2 text-teal-800">
                <BookOpen className="mx-auto mb-1 size-4" />
                {data.courses.length}
              </div>
              <div className="rounded-md bg-amber-50 p-2 text-amber-800">
                <Database className="mx-auto mb-1 size-4" />
                {data.appendixRecords.length}
              </div>
              <div className="rounded-md bg-rose-50 p-2 text-rose-800">
                <BarChart3 className="mx-auto mb-1 size-4" />
                {data.flashcards.length}
              </div>
            </div>
            <Badge variant={mode === "live" ? "success" : "warning"} className="w-full justify-center">
              {mode === "live" ? "Live Supabase" : "Demo persistence"}
            </Badge>
            {lastError && <div className="rounded-md bg-destructive/10 p-2 text-xs text-destructive">{lastError}</div>}
          </div>
        </div>
      </aside>
      {open && <button aria-label="Close menu" className="fixed inset-0 z-30 bg-black/30 lg:hidden" onClick={() => setOpen(false)} />}
      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b bg-background/90 px-4 backdrop-blur md:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Button className="lg:hidden" variant="outline" size="icon" onClick={() => setOpen(true)}>
              <PanelLeftClose className="rotate-180" />
            </Button>
            <div className="min-w-0">
              <div className="truncate text-sm text-muted-foreground">
                {activeCourse ? activeCourse.subject : "Workspace"}
              </div>
              <div className="truncate text-lg font-semibold">
                {activeCourse ? activeCourse.title : "Learning command center"}
              </div>
            </div>
          </div>
          <div className="hidden items-center gap-2 sm:flex">
            {pendingMutations > 0 && <Badge variant="outline">Saving...</Badge>}
            <Badge variant="secondary">
              <Sparkles className="mr-1 size-3" />
              Suggestion-safe AI
            </Badge>
            {mode === "live" && user && (
              <Button variant="outline" size="sm" onClick={() => void signOut()}>
                <LogOut />
                Sign out
              </Button>
            )}
          </div>
        </header>
        <main className="min-h-[calc(100vh-4rem)]">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
