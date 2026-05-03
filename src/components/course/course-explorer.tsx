import { ChevronRight, FolderTree, Plus } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { CourseNode, CourseNodeType } from "@/domain/types"
import { cn } from "@/lib/utils"
import { useStudyData } from "@/state/study-data"

interface CourseExplorerProps {
  courseId: string
  selectedNodeId?: string
  onSelectNode: (nodeId: string) => void
}

const childType: Record<CourseNodeType, CourseNodeType> = {
  module: "chapter",
  chapter: "section",
  section: "subsection",
  subsection: "heading",
  heading: "heading",
}

export function CourseExplorer({ courseId, selectedNodeId, onSelectNode }: CourseExplorerProps) {
  const { data, addCourseNode } = useStudyData()
  const [newTitle, setNewTitle] = useState("")
  const nodes = data.courseNodes
    .filter((node) => node.courseId === courseId)
    .sort((a, b) => a.depth - b.depth || a.position - b.position)

  const selected = nodes.find((node) => node.id === selectedNodeId)

  function renderNode(node: CourseNode) {
    const children = nodes.filter((child) => child.parentId === node.id).sort((a, b) => a.position - b.position)

    return (
      <div key={node.id}>
        <button
          className={cn(
            "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted",
            selectedNodeId === node.id && "bg-primary/10 text-primary",
          )}
          style={{ paddingLeft: `${0.5 + node.depth * 0.85}rem` }}
          onClick={() => onSelectNode(node.id)}
        >
          <ChevronRight className={cn("size-3 shrink-0", children.length === 0 && "opacity-0")} />
          <span className="font-mono text-xs text-muted-foreground">{node.displayNumber}</span>
          <span className="truncate">{node.title}</span>
        </button>
        {children.map(renderNode)}
      </div>
    )
  }

  return (
    <aside className="flex min-h-0 flex-col border-r bg-card md:w-72">
      <div className="flex items-center justify-between border-b p-3">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <FolderTree className="size-4" />
          Course tree
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-auto p-2">{nodes.filter((node) => !node.parentId).map(renderNode)}</div>
      <form
        className="space-y-2 border-t p-3"
        onSubmit={(event) => {
          event.preventDefault()
          if (!newTitle.trim()) return
          const type = selected ? childType[selected.nodeType] : "module"
          const node = addCourseNode(courseId, selected?.id, type, newTitle.trim())
          setNewTitle("")
          onSelectNode(node.id)
        }}
      >
        <Input value={newTitle} onChange={(event) => setNewTitle(event.target.value)} placeholder="Add child node" />
        <Button type="submit" size="sm" className="w-full">
          <Plus />
          Add node
        </Button>
      </form>
    </aside>
  )
}
