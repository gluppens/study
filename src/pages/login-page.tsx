import { BrainCircuit, LogOut, Mail } from "lucide-react"
import { type FormEvent, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { isSupabaseConfigured } from "@/lib/supabase"
import { useStudyData } from "@/state/study-data"

type AuthMode = "sign-in" | "sign-up"

export function LoginPage() {
  const navigate = useNavigate()
  const {
    mode,
    session,
    pendingMutations,
    lastError,
    signInWithPassword,
    signUpWithPassword,
    signOut,
    activateDemoWorkspace,
    activateLiveWorkspace,
  } = useStudyData()
  const [authMode, setAuthMode] = useState<AuthMode>("sign-in")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [notice, setNotice] = useState<string | null>(null)

  async function submit(event: FormEvent) {
    event.preventDefault()
    setNotice(null)
    let nextSession: Awaited<ReturnType<typeof signInWithPassword>>

    try {
      nextSession =
        authMode === "sign-in"
          ? await signInWithPassword(email.trim(), password)
          : await signUpWithPassword(email.trim(), password)
    } catch {
      return
    }

    if (nextSession) {
      navigate("/")
      return
    }

    setNotice("Check your email to confirm the account, then sign in.")
  }

  return (
    <div className="grid min-h-screen place-items-center bg-background p-4 study-grid">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="mb-3 flex size-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <BrainCircuit className="size-6" />
          </div>
          <CardTitle>Sign in to Study</CardTitle>
          <CardDescription>
            Use Supabase live mode for saved private workspaces, or open the separate local demo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {session && mode === "live" ? (
            <div className="space-y-3">
              <div className="rounded-md border bg-muted/40 p-3 text-sm">
                Signed in as <span className="font-medium">{session.user.email}</span>
              </div>
              <Button asChild className="w-full">
                <Link to="/">Open live workspace</Link>
              </Button>
              <Button variant="outline" className="w-full" onClick={() => void signOut()}>
                <LogOut />
                Sign out
              </Button>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={submit}>
              <div className="grid grid-cols-2 rounded-md border bg-muted/40 p-1">
                <Button
                  type="button"
                  variant={authMode === "sign-in" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setAuthMode("sign-in")}
                >
                  Sign in
                </Button>
                <Button
                  type="button"
                  variant={authMode === "sign-up" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setAuthMode("sign-up")}
                >
                  Sign up
                </Button>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  minLength={6}
                  required
                />
              </div>
              <Button className="w-full" type="submit" disabled={!isSupabaseConfigured || pendingMutations > 0}>
                <Mail />
                {!isSupabaseConfigured
                  ? "Add Supabase env vars to enable Auth"
                  : pendingMutations > 0
                    ? "Working..."
                    : authMode === "sign-in"
                      ? "Continue with email"
                      : "Create account"}
              </Button>
            </form>
          )}

          {notice && <div className="rounded-md bg-amber-50 p-3 text-sm text-amber-900">{notice}</div>}
          {lastError && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{lastError}</div>}

          <Button
            variant="secondary"
            className="w-full"
            onClick={() => {
              activateDemoWorkspace()
              navigate("/")
            }}
          >
            Use demo workspace
          </Button>
          {isSupabaseConfigured && mode === "demo" && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                activateLiveWorkspace()
              }}
            >
              Return to live sign in
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
