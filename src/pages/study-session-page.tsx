import { ArrowLeft, CheckCircle2, RotateCcw } from "lucide-react"
import { useMemo, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { CourseWorkspaceShell } from "@/components/course/course-workspace-shell"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import type { Flashcard, ReviewRating } from "@/domain/types"
import { useStudyData } from "@/state/study-data"

function cardsForMode(cards: Flashcard[], mode: string) {
  if (mode === "due") return cards.filter((card) => new Date(card.dueAt).getTime() <= Date.now())
  if (mode === "new") return cards.filter((card) => card.reviewCount === 0)
  if (mode === "weak") return cards.filter((card) => card.masteryScore < 55 || card.confidenceScore < 50 || card.lapses >= 2)
  if (mode === "image") return cards.filter((card) => card.cardType === "image")
  if (mode === "random") return [...cards].sort(() => Math.random() - 0.5)
  return cards
}

export function StudySessionPage() {
  const { courseId = "", sessionId = "due" } = useParams()
  const { data, reviewFlashcard } = useStudyData()
  const [index, setIndex] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [answer, setAnswer] = useState("")
  const allCards = data.flashcards.filter((card) => card.courseId === courseId)
  const sessionCards = useMemo(() => cardsForMode(allCards, sessionId), [allCards, sessionId])
  const card = sessionCards[index]
  const progress = sessionCards.length ? (index / sessionCards.length) * 100 : 100

  function rate(rating: ReviewRating) {
    if (!card) return
    reviewFlashcard(courseId, card.id, rating, answer)
    setAnswer("")
    setRevealed(false)
    setIndex((current) => Math.min(current + 1, sessionCards.length))
  }

  return (
    <CourseWorkspaceShell active="study">
      <div className="mx-auto max-w-3xl space-y-5 p-4 md:p-6">
        <div className="flex items-center justify-between gap-3">
          <Button asChild variant="ghost" size="sm">
            <Link to={`/courses/${courseId}/study`}>
              <ArrowLeft />
              Modes
            </Link>
          </Button>
          <Badge variant="secondary">{sessionId} session</Badge>
        </div>
        <Progress value={progress} />

        {!card ? (
          <Card>
            <CardHeader>
              <div className="mb-2 flex size-12 items-center justify-center rounded-md bg-emerald-100 text-emerald-800">
                <CheckCircle2 className="size-6" />
              </div>
              <CardTitle>Session complete</CardTitle>
              <CardDescription>You worked through this queue. Updated due dates and mastery are saved locally.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link to={`/courses/${courseId}/analytics`}>View analytics</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center gap-2">
                <Badge>{card.cardType.replace("_", " ")}</Badge>
                <Badge variant="outline">{card.language.toUpperCase()}</Badge>
                {card.staleStatus !== "fresh" && <Badge variant="danger">{card.staleStatus}</Badge>}
              </div>
              <CardTitle className="text-xl leading-snug">{card.prompt.text}</CardTitle>
              <CardDescription>{card.hint || "Type your answer, reveal, then grade your recall."}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea value={answer} onChange={(event) => setAnswer(event.target.value)} placeholder="Your answer" className="min-h-32" />
              {revealed && (
                <div className="space-y-3">
                  <div className="rounded-md bg-muted/60 p-4">
                    <div className="mb-1 text-xs font-medium uppercase text-muted-foreground">Expected answer</div>
                    <div className="text-sm">{card.answer.text}</div>
                  </div>
                  {card.explanation && (
                    <div className="rounded-md border-l-4 border-primary bg-card p-4 text-sm text-muted-foreground">{card.explanation}</div>
                  )}
                </div>
              )}
              <div className="flex flex-col gap-2 sm:flex-row">
                {!revealed ? (
                  <Button className="w-full" onClick={() => setRevealed(true)}>
                    Reveal answer
                  </Button>
                ) : (
                  <>
                    <Button variant="destructive" className="w-full" onClick={() => rate("again")}>
                      <RotateCcw />
                      Again
                    </Button>
                    <Button variant="outline" className="w-full" onClick={() => rate("hard")}>
                      Hard
                    </Button>
                    <Button variant="secondary" className="w-full" onClick={() => rate("good")}>
                      Good
                    </Button>
                    <Button className="w-full" onClick={() => rate("easy")}>
                      Easy
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </CourseWorkspaceShell>
  )
}
