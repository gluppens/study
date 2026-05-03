import { Database, Image, Link2, Plus, Sparkles, TableProperties } from "lucide-react"
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
import type { Language } from "@/domain/types"
import { formatDate } from "@/lib/utils"
import { useStudyData } from "@/state/study-data"

export function AppendicesPage() {
  const { courseId = "" } = useParams()
  const { data, addAppendixTable, addAppendixRecord, createAiFlashcardSuggestion } = useStudyData()
  const course = data.courses.find((item) => item.id === courseId)
  const tables = data.appendixTables.filter((table) => table.courseId === courseId).sort((a, b) => a.position - b.position)
  const [selectedTableId, setSelectedTableId] = useState(tables[0]?.id ?? "")
  const selectedTable = tables.find((table) => table.id === selectedTableId) ?? tables[0]
  const records = data.appendixRecords.filter((record) => record.appendixTableId === selectedTable?.id)
  const [newTableName, setNewTableName] = useState("")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [language, setLanguage] = useState<Language>(course?.mainLanguage ?? "en")
  const [tags, setTags] = useState("")
  const sources = data.sources.filter((source) => source.courseId === courseId)
  const links = useMemo(() => data.entityLinks.filter((link) => link.courseId === courseId), [courseId, data.entityLinks])

  function submitRecord(event: FormEvent) {
    event.preventDefault()
    if (!selectedTable || !title.trim()) return
    addAppendixRecord({
      courseId,
      appendixTableId: selectedTable.id,
      title: title.trim(),
      shortDescription: description.trim(),
      language,
      tags: tags.split(",").map((tag) => tag.trim()).filter(Boolean),
    })
    setTitle("")
    setDescription("")
    setTags("")
  }

  return (
    <CourseWorkspaceShell active="appendices">
      <div className="grid min-h-[calc(100vh-14.5rem)] lg:grid-cols-[18rem_1fr]">
        <aside className="border-r bg-card p-4">
          <div className="mb-4 flex items-center gap-2 font-semibold">
            <Database className="size-4" />
            Appendix tables
          </div>
          <div className="space-y-1">
            {tables.map((table) => (
              <button
                key={table.id}
                className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm hover:bg-muted ${
                  selectedTable?.id === table.id ? "bg-primary/10 text-primary" : "text-muted-foreground"
                }`}
                onClick={() => setSelectedTableId(table.id)}
              >
                <span>{table.name}</span>
                <Badge variant={table.isDefault ? "secondary" : "outline"}>{table.tableType}</Badge>
              </button>
            ))}
          </div>
          <form
            className="mt-5 space-y-2 border-t pt-4"
            onSubmit={(event) => {
              event.preventDefault()
              if (!newTableName.trim()) return
              const table = addAppendixTable(courseId, newTableName.trim())
              setSelectedTableId(table.id)
              setNewTableName("")
            }}
          >
            <Label htmlFor="newTable">Custom table</Label>
            <Input id="newTable" value={newTableName} onChange={(event) => setNewTableName(event.target.value)} placeholder="e.g. Formulas" />
            <Button type="submit" size="sm" className="w-full">
              <TableProperties />
              Add table
            </Button>
          </form>
        </aside>

        <section className="min-w-0 space-y-5 p-4 md:p-6">
          {selectedTable && (
            <>
              <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-semibold tracking-normal">{selectedTable.name}</h2>
                    {selectedTable.tableType === "images" && <Image className="size-5 text-rose-600" />}
                  </div>
                  <p className="text-sm text-muted-foreground">{selectedTable.description}</p>
                </div>
                <Badge variant="outline">{records.length} records</Badge>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Create Appendix Record</CardTitle>
                  <CardDescription>Appendix items are editable source-of-truth records linked back to content and cards.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form className="grid gap-4 md:grid-cols-2" onSubmit={submitRecord}>
                    <div className="space-y-2">
                      <Label htmlFor="recordTitle">Title</Label>
                      <Input id="recordTitle" value={title} onChange={(event) => setTitle(event.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="recordLanguage">Language</Label>
                      <Select
                        id="recordLanguage"
                        value={language}
                        onChange={(event) => setLanguage(event.target.value as Language)}
                        options={[
                          { label: "English", value: "en" },
                          { label: "Dutch", value: "nl" },
                          { label: "French", value: "fr" },
                        ]}
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="description">Short description</Label>
                      <Textarea id="description" value={description} onChange={(event) => setDescription(event.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tags">Tags</Label>
                      <Input id="tags" value={tags} onChange={(event) => setTags(event.target.value)} placeholder="comma, separated" />
                    </div>
                    <div className="flex items-end">
                      <Button type="submit">
                        <Plus />
                        Add record
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              <div className="grid gap-4 xl:grid-cols-2">
                {records.map((record) => {
                  const linkedBlocks = links.filter(
                    (link) => link.toType === "appendix_record" && link.toId === record.id && link.fromType === "content_block",
                  )
                  const relatedCards = data.flashcards.filter((card) => card.relatedAppendixRecordId === record.id)
                  const source = sources.find((item) => item.id === record.sourceId)

                  return (
                    <Card key={record.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <CardTitle>{record.title}</CardTitle>
                            <CardDescription>{record.recordType}</CardDescription>
                          </div>
                          <Badge variant={record.createdMethod === "ai_suggested" ? "warning" : "secondary"}>{record.language.toUpperCase()}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground">{record.shortDescription}</p>
                        <div className="flex flex-wrap gap-2">
                          {record.tags.map((tag) => (
                            <Badge key={tag} variant="outline">{tag}</Badge>
                          ))}
                          {record.aliases.map((alias) => (
                            <Badge key={alias} variant="secondary">{alias}</Badge>
                          ))}
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                          <div className="rounded-md border p-2">
                            <Link2 className="mb-1 size-4" />
                            {linkedBlocks.length} content links
                          </div>
                          <div className="rounded-md border p-2">{relatedCards.length} flashcards</div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Source: {source?.title ?? "No source linked"} · Updated {formatDate(record.updatedAt)}
                        </div>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => createAiFlashcardSuggestion(courseId, record.id, "appendix_record")}
                        >
                          <Sparkles />
                          Suggest cards
                        </Button>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </>
          )}
        </section>
      </div>
    </CourseWorkspaceShell>
  )
}
