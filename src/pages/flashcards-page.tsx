import { AlertTriangle, Check, Link2, Plus, Sparkles, X } from "lucide-react"
import { type FormEvent, useMemo, useState } from "react"
import { useParams } from "react-router-dom"
import { CourseWorkspaceShell } from "@/components/course/course-workspace-shell"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type { FlashcardSource, FlashcardType, Language } from "@/domain/types"
import { formatDate } from "@/lib/utils"
import { useStudyData } from "@/state/study-data"

const cardTypes: FlashcardType[] = ["basic", "definition", "cloze", "true_false", "person", "image"]

export function FlashcardsPage() {
  const { courseId = "" } = useParams()
  const { data, addFlashcard, resolveSuggestion, pendingMutations } = useStudyData()
  const course = data.courses.find((item) => item.id === courseId)
  const cards = data.flashcards.filter((card) => card.courseId === courseId)
  const suggestions = data.aiSuggestions.filter((suggestion) => suggestion.courseId === courseId && suggestion.status === "pending")
  const appendixRecords = data.appendixRecords.filter((record) => record.courseId === courseId)
  const contentBlocks = data.contentBlocks.filter((block) => block.courseId === courseId)
  const [cardType, setCardType] = useState<FlashcardType>("basic")
  const [language, setLanguage] = useState<Language>(course?.mainLanguage ?? "en")
  const [prompt, setPrompt] = useState("")
  const [answer, setAnswer] = useState("")
  const [tags, setTags] = useState("")
  const [sourceValue, setSourceValue] = useState("")

  const sourceOptions = useMemo(
    () => [
      { label: "No source link", value: "" },
      ...contentBlocks.map((block) => ({
        label: `Content: ${block.plainText.slice(0, 60)}`,
        value: `content_block:${block.id}`,
      })),
      ...appendixRecords.map((record) => ({
        label: `Appendix: ${record.title}`,
        value: `appendix_record:${record.id}`,
      })),
    ],
    [appendixRecords, contentBlocks],
  )

  async function submitCard(event: FormEvent) {
    event.preventDefault()
    const [sourceTargetType, sourceTargetId] = sourceValue.split(":") as [FlashcardSource["sourceTargetType"], string]
    const sourceBlock = contentBlocks.find((block) => block.id === sourceTargetId)
    const sourceRecord = appendixRecords.find((record) => record.id === sourceTargetId)

    await addFlashcard({
      courseId,
      cardType,
      prompt: prompt.trim(),
      answer: answer.trim(),
      sourceTargetType: sourceValue ? sourceTargetType : undefined,
      sourceTargetId: sourceValue ? sourceTargetId : undefined,
      sourceExcerpt: sourceBlock?.plainText ?? sourceRecord?.shortDescription ?? "",
      relatedAppendixRecordId: sourceTargetType === "appendix_record" ? sourceTargetId : undefined,
      tags: tags.split(",").map((tag) => tag.trim()).filter(Boolean),
      language,
    })

    setPrompt("")
    setAnswer("")
    setTags("")
    setSourceValue("")
  }

  return (
    <CourseWorkspaceShell active="flashcards">
      <div className="space-y-5 p-4 md:p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-normal">Flashcards</h2>
            <p className="text-sm text-muted-foreground">Cards are derived learning objects. Link them back to source material.</p>
          </div>
          <div className="flex gap-2">
            <Badge variant="warning">{cards.filter((card) => card.sourceWarning).length} unlinked</Badge>
            <Badge variant="danger">{cards.filter((card) => card.staleStatus !== "fresh").length} stale</Badge>
          </div>
        </div>

        <section className="grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
          <Card>
            <CardHeader>
              <CardTitle>Create Flashcard</CardTitle>
              <CardDescription>Manual cards can be saved without a link, but they will show a warning.</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={submitCard}>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Card type</Label>
                    <Select value={cardType} onChange={(event) => setCardType(event.target.value as FlashcardType)} options={cardTypes.map((type) => ({ label: type.replace("_", " "), value: type }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Language</Label>
                    <Select
                      value={language}
                      onChange={(event) => setLanguage(event.target.value as Language)}
                      options={[
                        { label: "English", value: "en" },
                        { label: "Dutch", value: "nl" },
                        { label: "French", value: "fr" },
                      ]}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Question / prompt</Label>
                  <Textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Answer</Label>
                  <Textarea value={answer} onChange={(event) => setAnswer(event.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Source link</Label>
                  <Select value={sourceValue} onChange={(event) => setSourceValue(event.target.value)} options={sourceOptions} />
                </div>
                <div className="space-y-2">
                  <Label>Tags</Label>
                  <Input value={tags} onChange={(event) => setTags(event.target.value)} placeholder="comma, separated" />
                </div>
                <Button type="submit" disabled={pendingMutations > 0}>
                  <Plus />
                  {pendingMutations > 0 ? "Saving..." : "Save card"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="space-y-4">
            {suggestions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="size-4" />
                    AI Suggestion Inbox
                  </CardTitle>
                  <CardDescription>Accepting a suggestion creates derived flashcards with source links where available.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {suggestions.map((suggestion) => (
                    <div key={suggestion.id} className="rounded-md border p-3">
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div>
                          <div className="font-medium">{suggestion.title}</div>
                          <p className="text-sm text-muted-foreground">{suggestion.summary}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" disabled={pendingMutations > 0} onClick={() => void resolveSuggestion(suggestion.id, "accepted")}>
                            <Check />
                            Accept
                          </Button>
                          <Button size="sm" variant="outline" disabled={pendingMutations > 0} onClick={() => void resolveSuggestion(suggestion.id, "deferred")}>
                            Defer
                          </Button>
                          <Button size="sm" variant="ghost" disabled={pendingMutations > 0} onClick={() => void resolveSuggestion(suggestion.id, "rejected")}>
                            <X />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            <div className="grid gap-4">
              {cards.map((card) => {
                const sources = data.flashcardSources.filter((source) => source.flashcardId === card.id)
                return (
                  <Card key={card.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <CardTitle>{card.prompt.text}</CardTitle>
                          <CardDescription>{card.cardType.replace("_", " ")}</CardDescription>
                        </div>
                        <div className="flex flex-wrap justify-end gap-2">
                          {card.sourceWarning && (
                            <Badge variant="warning">
                              <AlertTriangle className="mr-1 size-3" />
                              source needed
                            </Badge>
                          )}
                          {card.staleStatus !== "fresh" && <Badge variant="danger">{card.staleStatus}</Badge>}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="rounded-md bg-muted/50 p-3 text-sm">{card.answer.text}</div>
                      <div className="flex flex-wrap gap-2">
                        {card.tags.map((tag) => (
                          <Badge key={tag} variant="outline">{tag}</Badge>
                        ))}
                        <Badge variant="secondary">{card.language.toUpperCase()}</Badge>
                      </div>
                      <div className="grid gap-2 text-xs text-muted-foreground md:grid-cols-4">
                        <div className="rounded-md border p-2">Mastery {Math.round(card.masteryScore)}%</div>
                        <div className="rounded-md border p-2">Confidence {Math.round(card.confidenceScore)}%</div>
                        <div className="rounded-md border p-2">Due {formatDate(card.dueAt)}</div>
                        <div className="rounded-md border p-2">
                          <Link2 className="mb-1 size-4" />
                          {sources.length} sources
                        </div>
                      </div>
                      {card.sourceExcerpt && <p className="border-l-4 border-primary/40 pl-3 text-sm text-muted-foreground">{card.sourceExcerpt}</p>}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        </section>
      </div>
    </CourseWorkspaceShell>
  )
}
