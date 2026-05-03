import { Search } from "lucide-react"
import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useStudyData } from "@/state/study-data"

export function SearchPage() {
  const { data } = useStudyData()
  const [query, setQuery] = useState("")
  const q = query.toLowerCase().trim()
  const results = useMemo(() => {
    if (!q) return []

    return [
      ...data.contentBlocks
        .filter((block) => block.plainText.toLowerCase().includes(q))
        .map((block) => ({
          id: block.id,
          type: "Content",
          title: block.plainText.slice(0, 90),
          preview: block.plainText,
          href: `/courses/${block.courseId}/content`,
        })),
      ...data.appendixRecords
        .filter((record) => `${record.title} ${record.shortDescription} ${record.tags.join(" ")}`.toLowerCase().includes(q))
        .map((record) => ({
          id: record.id,
          type: "Appendix",
          title: record.title,
          preview: record.shortDescription,
          href: `/courses/${record.courseId}/appendices`,
        })),
      ...data.flashcards
        .filter((card) => `${card.prompt.text} ${card.answer.text} ${card.tags.join(" ")}`.toLowerCase().includes(q))
        .map((card) => ({
          id: card.id,
          type: "Flashcard",
          title: card.prompt.text,
          preview: card.answer.text,
          href: `/courses/${card.courseId}/flashcards`,
        })),
    ]
  }, [data.appendixRecords, data.contentBlocks, data.flashcards, q])

  return (
    <div className="space-y-5 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal">Global Search</h1>
        <p className="text-sm text-muted-foreground">Search across content, appendices, flashcards, tags, and metadata.</p>
      </div>
      <div className="flex items-center gap-2 rounded-lg border bg-card px-3">
        <Search className="size-4 text-muted-foreground" />
        <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search the study graph" className="border-0 bg-transparent" />
      </div>
      <div className="space-y-3">
        {results.map((result) => (
          <Link key={`${result.type}-${result.id}`} to={result.href}>
            <Card className="transition-colors hover:bg-muted/40">
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="line-clamp-1">{result.title}</CardTitle>
                    <CardDescription className="line-clamp-2">{result.preview}</CardDescription>
                  </div>
                  <Badge variant="outline">{result.type}</Badge>
                </div>
              </CardHeader>
            </Card>
          </Link>
        ))}
        {q && results.length === 0 && <Card><CardContent className="pt-5 text-sm text-muted-foreground">No results found.</CardContent></Card>}
      </div>
    </div>
  )
}
