import {
  BookOpenText,
  ChevronDown,
  ChevronRight,
  Link2,
  Plus,
  Search,
  Sparkles,
  Target,
} from "lucide-react"
import { type FormEvent, useMemo, useState } from "react"
import { useParams } from "react-router-dom"
import { CourseExplorer } from "@/components/course/course-explorer"
import { CourseWorkspaceShell } from "@/components/course/course-workspace-shell"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type { ContentBlockType } from "@/domain/types"
import { cn, sentenceLines } from "@/lib/utils"
import { useStudyData } from "@/state/study-data"

const blockTypes: ContentBlockType[] = [
  "heading",
  "paragraph",
  "definition",
  "quote",
  "example",
  "note",
  "warning",
  "table",
  "image",
  "formula",
  "question",
  "summary",
]

const blockAccent: Record<ContentBlockType, string> = {
  heading: "border-l-teal-600",
  paragraph: "border-l-slate-300",
  definition: "border-l-indigo-500",
  quote: "border-l-stone-500",
  example: "border-l-emerald-500",
  note: "border-l-sky-500",
  warning: "border-l-amber-500",
  table: "border-l-purple-500",
  image: "border-l-rose-500",
  formula: "border-l-orange-500",
  question: "border-l-cyan-500",
  summary: "border-l-lime-600",
}

export function ContentPage() {
  const { courseId = "" } = useParams()
  const {
    data,
    addContentBlock,
    updateContentBlock,
    toggleBlockCollapse,
    linkContentToAppendix,
    createAiFlashcardSuggestion,
  } = useStudyData()
  const nodes = data.courseNodes.filter((node) => node.courseId === courseId)
  const [selectedNodeId, setSelectedNodeId] = useState(nodes[0]?.id)
  const [selectedBlockId, setSelectedBlockId] = useState<string | undefined>()
  const [blockType, setBlockType] = useState<ContentBlockType>("paragraph")
  const [text, setText] = useState("")
  const [search, setSearch] = useState("")
  const [linkRecordId, setLinkRecordId] = useState("")

  const selectedNode = nodes.find((node) => node.id === selectedNodeId) ?? nodes[0]
  const blocks = data.contentBlocks
    .filter((block) => block.courseId === courseId && (!selectedNode || block.nodeId === selectedNode.id))
    .sort((a, b) => a.position - b.position)
  const filteredBlocks = search.trim()
    ? blocks.filter((block) => block.plainText.toLowerCase().includes(search.toLowerCase()))
    : blocks
  const selectedBlock = data.contentBlocks.find((block) => block.id === selectedBlockId)
  const appendixRecords = data.appendixRecords.filter((record) => record.courseId === courseId)
  const linksForSelected = data.entityLinks.filter(
    (link) =>
      selectedBlockId &&
      link.courseId === courseId &&
      ((link.fromType === "content_block" && link.fromId === selectedBlockId) ||
        (link.toType === "content_block" && link.toId === selectedBlockId)),
  )
  const outlineBlocks = useMemo(
    () => data.contentBlocks.filter((block) => block.courseId === courseId && block.blockType === "heading"),
    [courseId, data.contentBlocks],
  )

  function addBlock(event: FormEvent) {
    event.preventDefault()
    if (!selectedNode || !text.trim()) return
    const block = addContentBlock({ courseId, nodeId: selectedNode.id, blockType, text: text.trim() })
    setText("")
    setSelectedBlockId(block.id)
  }

  return (
    <CourseWorkspaceShell active="content">
      <div className="flex h-[calc(100vh-14.5rem)] min-h-[680px] flex-col md:flex-row">
        <CourseExplorer courseId={courseId} selectedNodeId={selectedNode?.id} onSelectNode={setSelectedNodeId} />

        <section className="flex min-w-0 flex-1 flex-col">
          <div className="flex flex-col gap-3 border-b bg-card p-3 lg:flex-row lg:items-center">
            <div className="flex min-w-0 flex-1 items-center gap-2 rounded-md bg-muted/60 px-3">
              <Search className="size-4 text-muted-foreground" />
              <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search in this section" className="border-0 bg-transparent" />
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <BookOpenText className="size-4" />
              <span className="truncate">
                {selectedNode ? `${selectedNode.displayNumber} ${selectedNode.title}` : "No node selected"}
              </span>
            </div>
          </div>

          <div className="grid min-h-0 flex-1 lg:grid-cols-[1fr_18rem]">
            <div className="min-h-0 overflow-auto bg-background">
              <div className="mx-auto max-w-4xl space-y-4 p-4 md:p-6">
                <div className="rounded-lg border bg-card p-4">
                  <form className="grid gap-3 md:grid-cols-[11rem_1fr_auto]" onSubmit={addBlock}>
                    <Select
                      value={blockType}
                      onChange={(event) => setBlockType(event.target.value as ContentBlockType)}
                      options={blockTypes.map((type) => ({ label: type.replace("_", " "), value: type }))}
                    />
                    <Input value={text} onChange={(event) => setText(event.target.value)} placeholder="Write a new source-of-truth block" />
                    <Button type="submit">
                      <Plus />
                      Add block
                    </Button>
                  </form>
                </div>

                {filteredBlocks.map((block) => {
                  const linkedRecords = data.entityLinks
                    .filter((link) => link.fromType === "content_block" && link.fromId === block.id && link.toType === "appendix_record")
                    .map((link) => appendixRecords.find((record) => record.id === link.toId))
                    .filter(Boolean)

                  return (
                    <article
                      key={block.id}
                      className={cn(
                        "rounded-lg border border-l-4 bg-card p-4 transition-colors",
                        blockAccent[block.blockType],
                        selectedBlockId === block.id && "ring-2 ring-primary/30",
                      )}
                      onClick={() => setSelectedBlockId(block.id)}
                    >
                      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-2">
                          {block.isCollapsible ? (
                            <Button variant="ghost" size="icon" onClick={() => toggleBlockCollapse(block.id)}>
                              {block.isCollapsed ? <ChevronRight /> : <ChevronDown />}
                            </Button>
                          ) : (
                            <span className="size-9" />
                          )}
                          <Badge variant="outline">{block.blockType}</Badge>
                          {block.displayNumber && <span className="font-mono text-xs text-muted-foreground">{block.displayNumber}</span>}
                          <span className="text-xs text-muted-foreground">v{block.version}</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {linkedRecords.map((record) => (
                            <Badge key={record!.id} variant="secondary">
                              <Link2 className="mr-1 size-3" />
                              {record!.title}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      {!block.isCollapsed && (
                        <div className="grid gap-4 xl:grid-cols-[1fr_18rem]">
                          <Textarea
                            value={block.plainText}
                            onChange={(event) => updateContentBlock(block.id, event.target.value)}
                            className="min-h-28 font-mono text-sm"
                          />
                          <div className="rounded-md bg-muted/50 p-3 text-sm">
                            {sentenceLines(block.plainText).map((sentence) => (
                              <span key={sentence} className="sentence-line">
                                {sentence}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </article>
                  )
                })}
              </div>
            </div>

            <aside className="hidden min-h-0 border-l bg-card lg:flex lg:flex-col">
              <div className="border-b p-4">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Target className="size-4" />
                  Outline and links
                </div>
              </div>
              <div className="min-h-0 flex-1 space-y-5 overflow-auto p-4">
                <div>
                  <Label>Jump to heading</Label>
                  <div className="mt-2 space-y-1">
                    {outlineBlocks.map((block) => (
                      <button
                        key={block.id}
                        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs hover:bg-muted"
                        onClick={() => setSelectedBlockId(block.id)}
                      >
                        <span className="font-mono text-muted-foreground">{block.displayNumber}</span>
                        <span className="truncate">{block.plainText}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Density minimap</Label>
                  <div className="mt-2 h-40 rounded-md border bg-muted/30 p-2">
                    {blocks.map((block) => (
                      <button
                        key={block.id}
                        className={cn(
                          "mb-1 block h-2 rounded-sm",
                          block.blockType === "definition"
                            ? "bg-indigo-500"
                            : block.blockType === "example"
                              ? "bg-emerald-500"
                              : block.blockType === "image"
                                ? "bg-rose-500"
                                : block.blockType === "heading"
                                  ? "bg-teal-600"
                                  : "bg-slate-300",
                        )}
                        style={{ width: `${Math.min(100, Math.max(18, block.plainText.length / 2))}%` }}
                        onClick={() => setSelectedBlockId(block.id)}
                      />
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Selected block links</Label>
                  {selectedBlock ? (
                    <>
                      <p className="rounded-md bg-muted/50 p-2 text-xs text-muted-foreground line-clamp-4">
                        {selectedBlock.plainText}
                      </p>
                      <Select
                        value={linkRecordId}
                        onChange={(event) => setLinkRecordId(event.target.value)}
                        options={[
                          { label: "Choose appendix record", value: "" },
                          ...appendixRecords.map((record) => ({ label: record.title, value: record.id })),
                        ]}
                      />
                      <Button
                        variant="outline"
                        className="w-full"
                        disabled={!linkRecordId}
                        onClick={() => {
                          linkContentToAppendix(courseId, selectedBlock.id, linkRecordId)
                          setLinkRecordId("")
                        }}
                      >
                        <Link2 />
                        Link appendix record
                      </Button>
                      <Button
                        className="w-full"
                        variant="secondary"
                        onClick={() => createAiFlashcardSuggestion(courseId, selectedBlock.id, "content_block")}
                      >
                        <Sparkles />
                        Suggest flashcards
                      </Button>
                      <div className="space-y-1">
                        {linksForSelected.map((link) => (
                          <div key={link.id} className="rounded-md border p-2 text-xs">
                            {link.linkType}: {link.toType}
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">Select a block to inspect links.</p>
                  )}
                </div>
              </div>
            </aside>
          </div>
        </section>
      </div>
    </CourseWorkspaceShell>
  )
}
