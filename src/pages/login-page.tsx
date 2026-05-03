import { BrainCircuit, Github, Mail } from "lucide-react"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { isSupabaseConfigured } from "@/lib/supabase"

export function LoginPage() {
  return (
    <div className="grid min-h-screen place-items-center bg-background p-4 study-grid">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="mb-3 flex size-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <BrainCircuit className="size-6" />
          </div>
          <CardTitle>Sign in to Study</CardTitle>
          <CardDescription>
            Supabase Auth is wired for production. This local build also works with demo persistence.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="you@example.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" placeholder="Password" />
          </div>
          <Button className="w-full" disabled={!isSupabaseConfigured}>
            <Mail />
            {isSupabaseConfigured ? "Continue with email" : "Add Supabase env vars to enable Auth"}
          </Button>
          <Button variant="outline" className="w-full" disabled={!isSupabaseConfigured}>
            <Github />
            Continue with OAuth
          </Button>
          <Button asChild variant="secondary" className="w-full">
            <Link to="/">Use demo workspace</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
