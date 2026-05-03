import {
  BookOpenText,
  ChevronDown,
  ChevronRight,
  Link2,
  Plus,
  Search,
  Sparkles,
} from "lucide-react"
import { type FormEvent, useMemo, useState } from "react"
import { useParams } from "react-router-dom"
import { CourseWorkspaceShell } from "@/components/course/course-workspace-shell"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type { AppendixRecord, ContentBlock, ContentBlockType, CourseNode, CourseNodeType } from "@/domain/types"
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

const childType: Record<CourseNodeType, CourseNodeType> = {
  module: "chapter",
  chapter: "section",
  section: "subsection",
  subsection: "heading",
  heading: "heading",
}

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

const minimapAccent: Record<ContentBlockType, string> = {
  heading: "bg-teal-600",
  paragraph: "bg-slate-300",
  definition: "bg-indigo-500",
  quote: "bg-stone-500",
  example: "bg-emerald-500",
  note: "bg-sky-500",
  warning: "bg-amber-500",
  table: "bg-purple-500",
  image: "bg-rose-500",
  formula: "bg-orange-500",
  question: "bg-cyan-500",
  summary: "bg-lime-600",
}

type DraftMode = "heading" | "block"

type DocumentRow =
  | {
      id: string
      kind: "node"
      node: CourseNode
      searchText: string
    }
  | {
      id: string
      kind: "block"
      block: ContentBlock
      node: CourseNode
      linkedRecords: AppendixRecord[]
      searchText: string
    }

function rowDomId(id: string) {
  return `content-row-${id}`
}

function formatLabel(value: string) {
  return value.replace(/_/g, " ")
}

function headingSize(depth: number) {
  if (depth <= 0) return "text-xl"
  if (depth === 1) return "text-lg"
  return "text-base"
}

function headingIndent(depth: number) {
  return `${Math.min(depth * 1.15, 5)}rem`
}

function blockIndent(depth: number) {
  return `${Math.min(depth * 1.15 + 0.9, 5.8)}rem`
}

function minimapLineWidths(text: string, isHeading: boolean) {
  const sentences = sentenceLines(text)
  const lineCount = isHeading ? 1 : Math.min(5, Math.max(1, sentences.length || Math.ceil(text.length / 92)))

  return Array.from({ length: lineCount }, (_, index) => {
    const sentenceLength = sentences[index]?.length ?? Math.max(24, text.length / lineCount)
    return Math.min(96, Math.max(isHeading ? 44 : 18, sentenceLength * 0.48 + ((index + 1) % 3) * 10))
  })
}

function rowLabel(row: DocumentRow) {
  if (row.kind === "node") return `${row.node.displayNumber} ${row.node.title}`.trim()
  return `${row.block.blockType} ${row.block.plainText}`.trim()
}

export function ContentPage() {
  const { courseId = "" } = useParams()
  const {
    data,
    addCourseNode,
    addContentBlock,
    updateContentBlock,
    toggleBlockCollapse,
    linkContentToAppendix,
    createAiFlashcardSuggestion,
  } = useStudyData()

  const nodes = useMemo(
    () =>
      data.courseNodes
        .filter((node) => node.courseId === courseId)
        .sort((a, b) => a.depth - b.depth || a.position - b.position),
    [courseId, data.courseNodes],
  )
  const courseBlocks = useMemo(
    () =>
      data.contentBlocks
        .filter((block) => block.courseId === courseId)
        .sort((a, b) => a.position - b.position),
    [courseId, data.contentBlocks],
  )
  const appendixRecords = useMemo(
    () => data.appendixRecords.filter((record) => record.courseId === courseId),
    [courseId, data.appendixRecords],
  )
  const nodeById = useMemo(() => new Map(nodes.map((node) => [node.id, node])), [nodes])
  const blocksByNodeId = useMemo(() => {
    const map = new Map<string, ContentBlock[]>()

    for (const block of courseBlocks) {
      const blocks = map.get(block.nodeId) ?? []
      blocks.push(block)
      map.set(block.nodeId, blocks)
    }

    return map
  }, [courseBlocks])
  const linkedRecordsByBlockId = useMemo(() => {
    const map = new Map<string, AppendixRecord[]>()
    const recordsById = new Map(appendixRecords.map((record) => [record.id, record]))

    for (const link of data.entityLinks) {
      if (link.courseId !== courseId) continue

      let blockId: string | undefined
      let recordId: string | undefined

      if (link.fromType === "content_block" && link.toType === "appendix_record") {
        blockId = link.fromId
        recordId = link.toId
      }

      if (link.toType === "content_block" && link.fromType === "appendix_record") {
        blockId = link.toId
        recordId = link.fromId
      }

      const record = recordId ? recordsById.get(recordId) : undefined
      if (!blockId || !record) continue

      const records = map.get(blockId) ?? []
      if (!records.some((item) => item.id === record.id)) records.push(record)
      map.set(blockId, records)
    }

    return map
  }, [appendixRecords, courseId, data.entityLinks])
  const documentRows = useMemo<DocumentRow[]>(() => {
    const rows: DocumentRow[] = []
    const childrenByParent = new Map<string | undefined, CourseNode[]>()
    const visited = new Set<string>()

    for (const node of nodes) {
      const children = childrenByParent.get(node.parentId) ?? []
      children.push(node)
      childrenByParent.set(node.parentId, children)
    }

    childrenByParent.forEach((children) => {
      children.sort((a, b) => a.position - b.position)
    })

    function visit(node: CourseNode) {
      if (visited.has(node.id)) return
      visited.add(node.id)

      rows.push({
        id: node.id,
        kind: "node",
        node,
        searchText: `${node.displayNumber} ${node.title} ${node.nodeType}`.toLowerCase(),
      })

      for (const block of blocksByNodeId.get(node.id) ?? []) {
        rows.push({
          id: block.id,
          kind: "block",
          block,
          node,
          linkedRecords: linkedRecordsByBlockId.get(block.id) ?? [],
          searchText: `${block.displayNumber} ${block.blockType} ${block.plainText} ${node.title}`.toLowerCase(),
        })
      }

      for (const child of childrenByParent.get(node.id) ?? []) {
        visit(child)
      }
    }

    for (const root of childrenByParent.get(undefined) ?? []) {
      visit(root)
    }

    for (const node of nodes) {
      visit(node)
    }

    return rows
  }, [blocksByNodeId, linkedRecordsByBlockId, nodes])

  const [selectedNodeId, setSelectedNodeId] = useState<string | undefined>()
  const [selectedBlockId, setSelectedBlockId] = useState<string | undefined>()
  const [draftBlockType, setDraftBlockType] = useState<ContentBlockType>("paragraph")
  const [draftText, setDraftText] = useState("")
  const [inlineDraft, setInlineDraft] = useState<{ nodeId: string; mode: DraftMode } | null>(null)
  const [search, setSearch] = useState("")
  const [linkRecordId, setLinkRecordId] = useState("")

  const selectedBlock = courseBlocks.find((block) => block.id === selectedBlockId)
  const selectedNode = (selectedBlock ? nodeById.get(selectedBlock.nodeId) : undefined) ?? nodeById.get(selectedNodeId ?? "") ?? nodes[0]
  const activeRowId = selectedBlock?.id ?? selectedNode?.id
  const normalizedSearch = search.trim().toLowerCase()
  const matchedRowIds = useMemo(() => {
    if (!normalizedSearch) return new Set<string>()
    return new Set(documentRows.filter((row) => row.searchText.includes(normalizedSearch)).map((row) => row.id))
  }, [documentRows, normalizedSearch])
  const firstSearchMatchId = normalizedSearch ? documentRows.find((row) => matchedRowIds.has(row.id))?.id : undefined
  const headingOptions = useMemo(
    () => [
      { label: "Jump to heading", value: "" },
      ...nodes.map((node) => ({
        label: `${node.displayNumber} ${node.title}`.trim(),
        value: node.id,
      })),
    ],
    [nodes],
  )
  const linksForSelected = useMemo(
    () =>
      data.entityLinks.filter(
        (link) =>
          selectedBlockId &&
          link.courseId === courseId &&
          ((link.fromType === "content_block" && link.fromId === selectedBlockId) ||
            (link.toType === "content_block" && link.toId === selectedBlockId)),
      ),
    [courseId, data.entityLinks, selectedBlockId],
  )

  function scrollToItem(id: string) {
    document.getElementById(rowDomId(id))?.scrollIntoView({ behavior: "smooth", block: "center" })
  }

  function selectNode(nodeId: string, shouldScroll = true) {
    if (!nodeId) return
    setSelectedNodeId(nodeId)
    setSelectedBlockId(undefined)
    if (shouldScroll) scrollToItem(nodeId)
  }

  function selectBlock(block: ContentBlock, shouldScroll = true) {
    setSelectedNodeId(block.nodeId)
    setSelectedBlockId(block.id)
    if (shouldScroll) scrollToItem(block.id)
  }

  function startInlineDraft(nodeId: string, mode: DraftMode) {
    setInlineDraft({ nodeId, mode })
    setDraftText("")
  }

  function submitInlineDraft(event: FormEvent) {
    event.preventDefault()
    if (!inlineDraft || !draftText.trim()) return

    const node = nodeById.get(inlineDraft.nodeId)
    if (!node) return

    if (inlineDraft.mode === "heading") {
      const child = addCourseNode(courseId, node.id, childType[node.nodeType], draftText.trim())
      setSelectedNodeId(child.id)
      setSelectedBlockId(undefined)
      window.setTimeout(() => scrollToItem(child.id), 0)
    } else {
      const block = addContentBlock({
        courseId,
        nodeId: node.id,
        blockType: draftBlockType,
        text: draftText.trim(),
      })
      setSelectedNodeId(node.id)
      setSelectedBlockId(block.id)
      window.setTimeout(() => scrollToItem(block.id), 0)
    }

    setDraftText("")
    setInlineDraft(null)
  }

  function createFirstModule(event: FormEvent) {
    event.preventDefault()
    if (!draftText.trim()) return

    const node = addCourseNode(courseId, undefined, "module", draftText.trim())
    setDraftText("")
    setInlineDraft(null)
    setSelectedNodeId(node.id)
    window.setTimeout(() => scrollToItem(node.id), 0)
  }

  function renderInlineDraft(node: CourseNode) {
    if (inlineDraft?.nodeId !== node.id) return null

    return (
      <form
        className={cn(
          "mt-3 grid gap-2 rounded-md border border-dashed bg-background/95 p-2",
          inlineDraft.mode === "block" ? "md:grid-cols-[11rem_minmax(0,1fr)_auto_auto]" : "md:grid-cols-[minmax(0,1fr)_auto_auto]",
        )}
        onSubmit={submitInlineDraft}
      >
        {inlineDraft.mode === "block" && (
          <Select
            value={draftBlockType}
            onChange={(event) => setDraftBlockType(event.target.value as ContentBlockType)}
            options={blockTypes.map((type) => ({ label: formatLabel(type), value: type }))}
            className="font-sans"
          />
        )}
        <Input
          value={draftText}
          onChange={(event) => setDraftText(event.target.value)}
          placeholder={inlineDraft.mode === "heading" ? `Add ${formatLabel(childType[node.nodeType])}` : "Write source content"}
          className="font-mono"
          autoFocus
        />
        <Button type="submit" size="sm">
          <Plus />
          Add
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => setInlineDraft(null)}>
          Cancel
        </Button>
      </form>
    )
  }

  function renderSelectedBlockPanel(block: ContentBlock) {
    return (
      <div
        className="mt-3 rounded-md border bg-background/95 p-3 font-sans text-xs shadow-sm"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="grid gap-2 xl:grid-cols-[minmax(0,1fr)_16rem_auto_auto] xl:items-center">
          <p className="min-w-0 text-muted-foreground line-clamp-2">
            <span className="font-medium text-foreground">Selected</span> {block.plainText}
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
            type="button"
            variant="outline"
            size="sm"
            disabled={!linkRecordId}
            onClick={() => {
              linkContentToAppendix(courseId, block.id, linkRecordId)
              setLinkRecordId("")
            }}
          >
            <Link2 />
            Link
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => createAiFlashcardSuggestion(courseId, block.id, "content_block")}
          >
            <Sparkles />
            Suggest
          </Button>
        </div>
        {linksForSelected.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {linksForSelected.map((link) => (
              <Badge key={link.id} variant="outline">
                {link.linkType}: {formatLabel(link.toType)}
              </Badge>
            ))}
          </div>
        )}
      </div>
    )
  }

  function renderNodeRow(row: Extract<DocumentRow, { kind: "node" }>) {
    const { node } = row
    const isActive = activeRowId === node.id
    const isSearchMatch = matchedRowIds.has(node.id)
    const blockCount = blocksByNodeId.get(node.id)?.length ?? 0

    return (
      <section
        key={node.id}
        id={rowDomId(node.id)}
        tabIndex={0}
        className={cn(
          "group scroll-mt-24 border-b bg-card/80 transition-colors focus-within:bg-primary/5",
          isActive && "bg-primary/5",
          isSearchMatch && "bg-amber-50",
        )}
        onFocus={() => selectNode(node.id, false)}
      >
        <div className="grid grid-cols-[4.5rem_minmax(0,1fr)]">
          <button
            type="button"
            className="border-r px-2 py-4 text-right font-mono text-[11px] text-muted-foreground hover:text-foreground"
            onClick={() => selectNode(node.id)}
          >
            {node.displayNumber}
          </button>
          <div className="min-w-0 py-4 pr-3" style={{ paddingLeft: headingIndent(node.depth) }}>
            <div className="flex min-w-0 items-start gap-3">
              <button
                type="button"
                className={cn("min-w-0 flex-1 text-left font-mono font-semibold tracking-normal", headingSize(node.depth))}
                onClick={() => selectNode(node.id)}
              >
                <span className="block truncate">{node.title}</span>
                <span className="mt-1 block text-[11px] font-normal text-muted-foreground">
                  {formatLabel(node.nodeType)} · {blockCount} {blockCount === 1 ? "block" : "blocks"}
                </span>
              </button>
              <div className="flex shrink-0 flex-wrap justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                <Button type="button" variant="ghost" size="sm" onClick={() => startInlineDraft(node.id, "heading")}>
                  <Plus />
                  Heading
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => startInlineDraft(node.id, "block")}>
                  <Plus />
                  Content
                </Button>
              </div>
            </div>
            {renderInlineDraft(node)}
          </div>
        </div>
      </section>
    )
  }

  function renderBlockRow(row: Extract<DocumentRow, { kind: "block" }>) {
    const { block, linkedRecords, node } = row
    const isActive = activeRowId === block.id
    const isSearchMatch = matchedRowIds.has(block.id)
    const isSelected = selectedBlockId === block.id

    return (
      <article
        key={block.id}
        id={rowDomId(block.id)}
        tabIndex={0}
        className={cn(
          "group scroll-mt-24 border-b bg-card/60 transition-colors focus-within:bg-primary/5",
          isActive && "bg-primary/5",
          isSearchMatch && "bg-amber-50",
        )}
        onClick={() => selectBlock(block, false)}
        onFocus={() => selectBlock(block, false)}
      >
        <div className="grid grid-cols-[4.5rem_minmax(0,1fr)]">
          <button
            type="button"
            className="border-r px-2 py-3 text-right font-mono text-[11px] text-muted-foreground hover:text-foreground"
            onClick={(event) => {
              event.stopPropagation()
              selectBlock(block)
            }}
          >
            {block.displayNumber || block.position}
          </button>
          <div className="min-w-0 py-3 pr-3" style={{ paddingLeft: blockIndent(node.depth) }}>
            <div className={cn("border-l-2 pl-3", blockAccent[block.blockType])}>
              <div className="mb-1 flex min-w-0 flex-wrap items-center justify-between gap-2">
                <div className="flex min-w-0 flex-wrap items-center gap-2 font-sans text-[11px] text-muted-foreground">
                  <span className="font-medium uppercase tracking-normal">{formatLabel(block.blockType)}</span>
                  <span>v{block.version}</span>
                  {linkedRecords.map((record) => (
                    <Badge key={record.id} variant="secondary">
                      <Link2 className="mr-1 size-3" />
                      {record.title}
                    </Badge>
                  ))}
                </div>
                <div className="flex shrink-0 flex-wrap justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                  {block.isCollapsible && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={(event) => {
                        event.stopPropagation()
                        toggleBlockCollapse(block.id)
                      }}
                    >
                      {block.isCollapsed ? <ChevronRight /> : <ChevronDown />}
                      {block.isCollapsed ? "Open" : "Fold"}
                    </Button>
                  )}
                  <Button type="button" variant="ghost" size="sm" onClick={() => selectBlock(block, false)}>
                    <Link2 />
                    Links
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => createAiFlashcardSuggestion(courseId, block.id, "content_block")}
                  >
                    <Sparkles />
                    Cards
                  </Button>
                </div>
              </div>
              {block.isCollapsed ? (
                <button
                  type="button"
                  className="block w-full rounded-sm bg-muted/40 px-3 py-2 text-left font-mono text-sm leading-6 text-muted-foreground line-clamp-2"
                  onClick={(event) => {
                    event.stopPropagation()
                    toggleBlockCollapse(block.id)
                  }}
                >
                  {block.plainText}
                </button>
              ) : (
                <Textarea
                  value={block.plainText}
                  onChange={(event) => updateContentBlock(block.id, event.target.value)}
                  className="min-h-24 resize-y rounded-sm border-transparent bg-transparent px-0 font-mono text-sm leading-6 shadow-none focus-visible:border-input focus-visible:bg-background focus-visible:px-3"
                />
              )}
              {isSelected && renderSelectedBlockPanel(block)}
            </div>
          </div>
        </div>
      </article>
    )
  }

  function renderMinimapRow(row: DocumentRow) {
    const isActive = activeRowId === row.id
    const isSearchMatch = matchedRowIds.has(row.id)
    const isNode = row.kind === "node"
    const text = isNode ? row.node.title : row.block.plainText
    const depth = isNode ? row.node.depth : row.node.depth + 1
    const lineClass = isNode ? "bg-teal-700" : minimapAccent[row.block.blockType]
    const hasLinks = row.kind === "block" && row.linkedRecords.length > 0

    return (
      <button
        key={row.id}
        type="button"
        aria-label={rowLabel(row)}
        className={cn(
          "relative mb-1 block w-full rounded-sm border border-transparent px-1 py-0.5 text-left transition-colors hover:bg-muted",
          isActive && "border-primary/70 bg-primary/10",
          isSearchMatch && "bg-amber-100",
        )}
        onClick={() => {
          if (row.kind === "node") selectNode(row.node.id)
          else selectBlock(row.block)
        }}
      >
        <span className="block space-y-[2px]" style={{ paddingLeft: `${Math.min(depth * 0.22, 1.4)}rem` }}>
          {minimapLineWidths(text, isNode).map((width, index) => (
            <span
              key={`${row.id}-${index}`}
              className={cn("block h-[2px] rounded-full", lineClass)}
              style={{ width: `${width}%` }}
            />
          ))}
        </span>
        {hasLinks && <span className="absolute right-1 top-1 size-1.5 rounded-full bg-cyan-600" />}
      </button>
    )
  }

  return (
    <CourseWorkspaceShell active="content">
      <section className="flex h-[calc(100vh-14.5rem)] min-h-[680px] flex-col bg-background">
        <div className="flex flex-col gap-3 border-b bg-card/95 p-3 lg:flex-row lg:items-center">
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-md bg-muted/60 px-3">
            <Search className="size-4 shrink-0 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search full course"
              className="border-0 bg-transparent font-mono"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={!firstSearchMatchId}
              onClick={() => firstSearchMatchId && scrollToItem(firstSearchMatchId)}
            >
              {normalizedSearch ? `${matchedRowIds.size} matches` : "Find"}
            </Button>
          </div>
          <Select
            value={selectedNode?.id ?? ""}
            onChange={(event) => selectNode(event.target.value)}
            options={headingOptions}
            className="lg:w-72"
          />
          <div className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground lg:w-80">
            <BookOpenText className="size-4 shrink-0" />
            <span className="truncate">
              {selectedNode ? `${selectedNode.displayNumber} ${selectedNode.title}` : "No heading selected"}
            </span>
          </div>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_5.5rem]">
          <div className="min-h-0 overflow-auto">
            <div className="mx-auto w-full max-w-6xl px-3 py-4 md:px-6">
              <div className="overflow-hidden rounded-md border bg-card shadow-sm">
                <div className="flex items-center justify-between gap-3 border-b bg-muted/30 px-4 py-2 font-mono text-xs text-muted-foreground">
                  <span className="truncate">content.course</span>
                  <span>{documentRows.length} rows</span>
                </div>
                <div className="font-mono">
                  {documentRows.length > 0 ? (
                    documentRows.map((row) => (row.kind === "node" ? renderNodeRow(row) : renderBlockRow(row)))
                  ) : (
                    <div className="p-6">
                      <form className="grid gap-2 md:grid-cols-[minmax(0,1fr)_auto]" onSubmit={createFirstModule}>
                        <Input
                          value={draftText}
                          onChange={(event) => setDraftText(event.target.value)}
                          placeholder="Create the first module"
                          className="font-mono"
                        />
                        <Button type="submit">
                          <Plus />
                          Add module
                        </Button>
                      </form>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <aside className="hidden min-h-0 border-l bg-card/80 lg:block">
            <div className="h-full overflow-y-auto p-2">
              <div className="min-h-full rounded-sm bg-background/80 p-1 font-mono">{documentRows.map(renderMinimapRow)}</div>
            </div>
          </aside>
        </div>
      </section>
    </CourseWorkspaceShell>
  )
}
