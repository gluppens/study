import { type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface StatProps {
  icon: LucideIcon
  label: string
  value: string | number
  accent?: "teal" | "amber" | "rose" | "indigo" | "emerald"
  className?: string
}

const accents = {
  teal: "bg-teal-100 text-teal-800",
  amber: "bg-amber-100 text-amber-800",
  rose: "bg-rose-100 text-rose-800",
  indigo: "bg-indigo-100 text-indigo-800",
  emerald: "bg-emerald-100 text-emerald-800",
}

export function Stat({ icon: Icon, label, value, accent = "teal", className }: StatProps) {
  return (
    <div className={cn("rounded-lg border bg-card p-4", className)}>
      <div className="flex items-center gap-3">
        <div className={cn("flex size-9 items-center justify-center rounded-md", accents[accent])}>
          <Icon className="size-4" />
        </div>
        <div>
          <div className="text-2xl font-semibold tracking-normal">{value}</div>
          <div className="text-xs text-muted-foreground">{label}</div>
        </div>
      </div>
    </div>
  )
}
