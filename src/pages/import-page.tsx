import { FileInput, Upload } from "lucide-react"
import { type FormEvent, useState } from "react"
import { useParams } from "react-router-dom"
import { CourseWorkspaceShell } from "@/components/course/course-workspace-shell"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useStudyData } from "@/state/study-data"

export function ImportPage() {
  const { courseId = "" } = useParams()
  const { data, importTextToNode, pendingMutations } = useStudyData()
  const nodes = data.courseNodes.filter((node) => node.courseId === courseId)
  const [nodeId, setNodeId] = useState(nodes[0]?.id ?? "")
  const [text, setText] = useState("")
  const [importedCount, setImportedCount] = useState<number | null>(null)

  async function submit(event: FormEvent) {
    event.preventDefault()
    const count = await importTextToNode(courseId, nodeId, text)
    setImportedCount(count)
    setText("")
  }

  return (
    <CourseWorkspaceShell active="import">
      <div className="mx-auto max-w-4xl space-y-5 p-4 md:p-6">
        <div>
          <h2 className="text-2xl font-semibold tracking-normal">Import</h2>
          <p className="text-sm text-muted-foreground">MVP import starts with pasted text and simple splitting into headings and paragraphs.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileInput className="size-4" />
              Paste Text
            </CardTitle>
            <CardDescription>Large material is split first. AI structure detection is intentionally deferred.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={submit}>
              <div className="space-y-2">
                <Label>Target hierarchy node</Label>
                <Select
                  value={nodeId}
                  onChange={(event) => setNodeId(event.target.value)}
                  options={nodes.map((node) => ({ label: `${node.displayNumber} ${node.title}`, value: node.id }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Pasted material</Label>
                <Textarea value={text} onChange={(event) => setText(event.target.value)} className="min-h-72 font-mono" />
              </div>
              <Button type="submit" disabled={!text.trim() || pendingMutations > 0}>
                <Upload />
                {pendingMutations > 0 ? "Importing..." : "Import blocks"}
              </Button>
              {importedCount !== null && <Badge variant="success">{importedCount} blocks imported</Badge>}
            </form>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-3">
          {["PDF import", "Word import", "CSV/Excel appendix import"].map((item) => (
            <div key={item} className="rounded-lg border bg-card p-4">
              <div className="font-medium">{item}</div>
              <p className="mt-1 text-sm text-muted-foreground">Planned for the next import phase with user-reviewed structure extraction.</p>
            </div>
          ))}
        </div>
      </div>
    </CourseWorkspaceShell>
  )
}
