import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useDepts } from "@/hooks/useDept"
import { createDept, updateDept, deleteDept } from "@/api/endpoints/departmentApi"
import { useRole } from "@/hooks/useRole"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose,
} from "@/components/ui/dialog"
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Building2, Plus, Pencil, Trash2, Loader2,
  AlertCircle, GitBranch, ChevronRight, Network,
} from "lucide-react"

const EMPTY_FORM = { name: "", parent_dept: "" }

export default function DepartmentsPage() {
  const { depts, setDepts, loading, error } = useDepts()
  const { isAdmin } = useRole()
  const navigate = useNavigate()

  const [view, setView]             = useState("list") // "list" | "chart"
  const [formOpen, setFormOpen]     = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [selected, setSelected]     = useState(null)
  const [form, setForm]             = useState(EMPTY_FORM)
  const [saving, setSaving]         = useState(false)
  const [deleting, setDeleting]     = useState(false)
  const [formError, setFormError]   = useState("")

  // ── derived ──────────────────────────────────────────
  const rootDepts     = depts.filter((d) => !d.parent_dept)
  const childDepts    = depts.filter((d) => !!d.parent_dept)
  const getChildren   = (id) => depts.filter((d) => d.parent_dept === id)
  const getParentName = (id) => depts.find((d) => d.id === id)?.name ?? "—"

  // ── handlers ─────────────────────────────────────────
  const openCreate = () => {
    setSelected(null)
    setForm(EMPTY_FORM)
    setFormError("")
    setFormOpen(true)
  }

  const openEdit = (dept, e) => {
    e.stopPropagation()
    setSelected(dept)
    setForm({ name: dept.name, parent_dept: dept.parent_dept ?? "" })
    setFormError("")
    setFormOpen(true)
  }

  const openDelete = (dept, e) => {
    e.stopPropagation()
    setSelected(dept)
    setDeleteOpen(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) { setFormError("Department name is required."); return }
    setSaving(true)
    setFormError("")
    try {
      const payload = { name: form.name, parent_dept: form.parent_dept || null }
      if (selected) {
        const res = await updateDept(selected.id, payload)
        setDepts((prev) => prev.map((d) => d.id === selected.id ? res.data : d))
      } else {
        const res = await createDept(payload)
        setDepts((prev) => [...prev, res.data])
      }
      setFormOpen(false)
    } catch (err) {
      setFormError(err?.response?.data?.detail ?? "Something went wrong.")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await deleteDept(selected.id)
      setDepts((prev) => prev.filter((d) => d.id !== selected.id))
      setDeleteOpen(false)
    } catch {
    } finally {
      setDeleting(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-muted-foreground gap-2">
      <Loader2 className="size-4 animate-spin" />
      <span className="text-sm">Loading departments…</span>
    </div>
  )

  if (error) return (
    <div className="flex items-center justify-center h-64 text-destructive gap-2">
      <AlertCircle className="size-4" />
      <span className="text-sm">Failed to load departments.</span>
    </div>
  )

  return (
    <>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-[#1E0A3C] tracking-tight">Departments</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage your organizational structure and reporting hierarchy.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* View toggle */}
            <div className="flex items-center rounded-lg border border-border bg-muted/30 p-1 gap-1">
              <button
                onClick={() => setView("list")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  view === "list"
                    ? "bg-white text-[#3B1F6A] shadow-sm"
                    : "text-muted-foreground hover:text-[#3B1F6A]"
                }`}
              >
                <Building2 className="size-3.5" /> List
              </button>
              <button
                onClick={() => setView("chart")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  view === "chart"
                    ? "bg-white text-[#3B1F6A] shadow-sm"
                    : "text-muted-foreground hover:text-[#3B1F6A]"
                }`}
              >
                <Network className="size-3.5" /> Org Chart
              </button>
            </div>
            {isAdmin && (
              <button
                onClick={openCreate}
                className="flex items-center gap-1.5 bg-[#3B1F6A] hover:bg-[#52298F] text-white text-xs font-medium px-3.5 py-2 rounded-lg transition-colors"
              >
                <Plus className="size-3.5" /> Add Department
              </button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Total Departments", value: depts.length,       icon: Building2,  bg: "bg-[#EDE9F8]",  text: "text-[#3B1F6A]" },
            { label: "Root Departments",  value: rootDepts.length,   icon: GitBranch,  bg: "bg-[#E8F0FB]",  text: "text-[#1E3A6E]" },
            { label: "Sub-Departments",   value: childDepts.length,  icon: ChevronRight, bg: "bg-[#EAF3EE]", text: "text-emerald-700" },
          ].map((stat) => (
            <div key={stat.label} className="flex items-center gap-4 rounded-xl border border-border bg-white p-5">
              <div className={`flex size-10 items-center justify-center rounded-lg ${stat.bg}`}>
                <stat.icon className={`size-5 ${stat.text}`} />
              </div>
              <div>
                <p className="text-2xl font-semibold text-[#1E0A3C]">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Content */}
        {view === "list" ? (
          <ListView
            depts={depts}
            rootDepts={rootDepts}
            getChildren={getChildren}
            getParentName={getParentName}
            isAdmin={isAdmin}
            navigate={navigate}
            onEdit={openEdit}
            onDelete={openDelete}
          />
        ) : (
          <OrgChartView depts={depts} />
        )}
      </div>

      {/* Create / Edit dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#1E0A3C]">
              {selected ? "Edit Department" : "Add Department"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-[#4A3D6A] uppercase tracking-wide">Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Audit"
                className="focus-visible:ring-[#7B3FBE]"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-[#4A3D6A] uppercase tracking-wide">
                Parent Department <span className="normal-case text-muted-foreground">(optional)</span>
              </Label>
              <select
                value={form.parent_dept}
                onChange={(e) => setForm((f) => ({ ...f, parent_dept: e.target.value }))}
                className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-[#7B3FBE]"
              >
                <option value="">— None (root department) —</option>
                {depts
                  .filter((d) => d.id !== selected?.id)
                  .map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
              </select>
            </div>
            {formError && <p className="text-xs text-red-500">{formError}</p>}
          </div>
          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <button className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-muted transition-colors">
                Cancel
              </button>
            </DialogClose>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-[#3B1F6A] hover:bg-[#52298F] text-white rounded-lg transition-colors disabled:opacity-60"
            >
              {saving && <Loader2 className="size-3.5 animate-spin" />}
              {selected ? "Save changes" : "Create"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#1E0A3C]">Delete department?</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-medium text-[#1E0A3C]">{selected?.name}</span> will be permanently
              deleted. Sub-departments may become orphaned. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white"
            >
              {deleting && <Loader2 className="size-3.5 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

// ── List View ─────────────────────────────────────────────────────────────────
function ListView({ depts, rootDepts, getChildren, getParentName, isAdmin, navigate, onEdit, onDelete }) {
  return (
    <div className="rounded-xl border border-border bg-white overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border bg-muted/20">
            <th className="text-left text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-5 py-3">Department</th>
            <th className="text-left text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-5 py-3 hidden md:table-cell">Parent</th>
            <th className="text-left text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-5 py-3 hidden md:table-cell">Sub-Departments</th>
            {isAdmin && <th className="px-5 py-3" />}
          </tr>
        </thead>
        <tbody>
          {depts.length === 0 ? (
            <tr>
              <td colSpan={4} className="text-center text-sm text-muted-foreground py-16">
                No departments yet.
              </td>
            </tr>
          ) : (
            depts.map((dept) => {
              const children = getChildren(dept.id)
              const isRoot   = !dept.parent_dept
              return (
                <tr
                  key={dept.id}
                  onClick={() => navigate(`/departments/${dept.id}`)}
                  className="group border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors cursor-pointer"
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${
                        isRoot ? "bg-[#EDE9F8]" : "bg-muted"
                      }`}>
                        <Building2 className={`size-4 ${isRoot ? "text-[#3B1F6A]" : "text-muted-foreground"}`} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#1E0A3C] capitalize">{dept.name}</p>
                        {isRoot && (
                          <span className="text-[10px] font-medium text-[#7B3FBE]">Root</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 hidden md:table-cell">
                    <span className="text-sm text-muted-foreground capitalize">
                      {dept.parent_dept ? getParentName(dept.parent_dept) : "—"}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 hidden md:table-cell">
                    {children.length > 0 ? (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {children.slice(0, 3).map((c) => (
                          <span key={c.id} className="text-[11px] bg-muted px-2 py-0.5 rounded-full capitalize">
                            {c.name}
                          </span>
                        ))}
                        {children.length > 3 && (
                          <span className="text-[11px] text-muted-foreground">+{children.length - 3} more</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </td>
                  {isAdmin && (
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => onEdit(dept, e)}
                          className="flex size-7 items-center justify-center rounded-md hover:bg-[#EDE9F8] text-muted-foreground hover:text-[#3B1F6A] transition-colors"
                        >
                          <Pencil className="size-3.5" />
                        </button>
                        <button
                          onClick={(e) => onDelete(dept, e)}
                          className="flex size-7 items-center justify-center rounded-md hover:bg-red-50 text-muted-foreground hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              )
            })
          )}
        </tbody>
      </table>
    </div>
  )
}

// ── Org Chart View ────────────────────────────────────────────────────────────
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"
import { useEffect, useMemo } from "react"

function DeptNode({ data }) {
  return (
    <div className={`px-4 py-3 rounded-xl border shadow-sm min-w-[140px] text-center ${
      data.isRoot
        ? "bg-[#3B1F6A] border-[#52298F] text-white"
        : "bg-white border-[#C4B0E8] text-[#1E0A3C]"
    }`}>
      <Handle type="target" position={Position.Top} className="!border-0 !bg-[#7B3FBE]" />
      <div className={`text-[10px] font-semibold uppercase tracking-widest mb-0.5 ${
        data.isRoot ? "text-[#D4B8F0]" : "text-[#7B3FBE]"
      }`}>
        {data.isRoot ? "Root" : "Department"}
      </div>
      <div className="text-sm font-medium capitalize">{data.label}</div>
      <Handle type="source" position={Position.Bottom} className="!border-0 !bg-[#7B3FBE]" />
    </div>
  )
}

const nodeTypes = { dept: DeptNode }

function OrgChartView({ depts }) {
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    if (!depts.length) return { nodes: [], edges: [] }

    // Build tree layout
    const roots    = depts.filter((d) => !d.parent_dept)
    const getKids  = (id) => depts.filter((d) => d.parent_dept === id)

    const nodes = []
    const edges = []

    const HGAP = 200
    const VGAP = 120

    // BFS layout
    let queue  = roots.map((r, i) => ({ dept: r, x: i * HGAP, y: 0 }))
    const seen = new Set()

    while (queue.length) {
      const next = []
      queue.forEach(({ dept, x, y }) => {
        if (seen.has(dept.id)) return
        seen.add(dept.id)

        nodes.push({
          id:       dept.id,
          type:     "dept",
          position: { x, y },
          data:     { label: dept.name, isRoot: !dept.parent_dept },
        })

        const kids = getKids(dept.id)
        const startX = x - ((kids.length - 1) * HGAP) / 2
        kids.forEach((kid, i) => {
          edges.push({
            id:             `e-${dept.id}-${kid.id}`,
            source:         dept.id,
            target:         kid.id,
            type:           "smoothstep",
            style:          { stroke: "#C4B0E8", strokeWidth: 1.5 },
            animated:       false,
          })
          next.push({ dept: kid, x: startX + i * HGAP, y: y + VGAP })
        })
      })
      queue = next
    }

    return { nodes, edges }
  }, [depts])

  const [nodes, , onNodesChange] = useNodesState(initialNodes)
  const [edges, , onEdgesChange] = useEdgesState(initialEdges)

  return (
    <div className="rounded-xl border border-border bg-white overflow-hidden" style={{ height: 520 }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        minZoom={0.3}
      >
        <Background color="#EDE9F8" gap={20} size={1} />
        <Controls className="!border-[#C4B0E8] !shadow-none" />
        <MiniMap
          nodeColor={(n) => n.data?.isRoot ? "#3B1F6A" : "#C4B0E8"}
          maskColor="rgba(237,233,248,0.6)"
          className="!border-[#C4B0E8] !rounded-lg"
        />
      </ReactFlow>
    </div>
  )
}