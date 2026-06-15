import { useState } from "react"
import { useComponents } from "@/hooks/useComponents"
import { createComponent, updateComponent, deleteComponent } from "@/api/endpoints/componentsApi"
import { useRole } from "@/hooks/useRole"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ShieldCheck, AlertCircle, Loader2, Plus, Pencil, Trash2 } from "lucide-react"
import { useNavigate } from "react-router-dom"

const COMPONENT_COLORS = [
  { bg: "bg-[#EDE9F8]", text: "text-[#3B1F6A]", dot: "bg-[#7B3FBE]" },
  { bg: "bg-[#E8F0FB]", text: "text-[#1E3A6E]", dot: "bg-[#3B6FBE]" },
  { bg: "bg-[#F0EBF8]", text: "text-[#4A2080]", dot: "bg-[#9B5FDE]" },
  { bg: "bg-[#EAF3EE]", text: "text-[#1A4731]", dot: "bg-[#2E7D52]" },
  { bg: "bg-[#FDF3E7]", text: "text-[#7A3E0A]", dot: "bg-[#D4820A]" },
  { bg: "bg-[#FDE8F0]", text: "text-[#7A1E3E]", dot: "bg-[#C4336E]" },
  { bg: "bg-[#E8F5F5]", text: "text-[#1A4747]", dot: "bg-[#2E8080]" },
  { bg: "bg-[#F5EDE8]", text: "text-[#6E2E1A]", dot: "bg-[#B85030]" },
]

const EMPTY_FORM = { name: "", isqm_reference: "" }

export default function IsqmComponents() {
  const navigate = useNavigate()

  const { components, loading, error, setComponents } = useComponents()
  const { isAdmin } = useRole()

  const [formOpen, setFormOpen]       = useState(false)
  const [deleteOpen, setDeleteOpen]   = useState(false)
  const [selected, setSelected]       = useState(null)   // component being edited/deleted
  const [form, setForm]               = useState(EMPTY_FORM)
  const [saving, setSaving]           = useState(false)
  const [deleting, setDeleting]       = useState(false)
  const [formError, setFormError]     = useState("")

  // ── helpers ──────────────────────────────────────────────
  const openCreate = () => {
    setSelected(null)
    setForm(EMPTY_FORM)
    setFormError("")
    setFormOpen(true)
  }

  const openEdit = (component, e) => {
    e.stopPropagation()
    setSelected(component)
    setForm({ name: component.name, isqm_reference: component.isqm_reference })
    setFormError("")
    setFormOpen(true)
  }

  const openDelete = (component, e) => {
    e.stopPropagation()
    setSelected(component)
    setDeleteOpen(true)
  }

  const handleSave = async () => {
    if (!form.name.trim() || !form.isqm_reference.trim()) {
      setFormError("Both fields are required.")
      return
    }
    setSaving(true)
    setFormError("")
    try {
      if (selected) {
        const res = await updateComponent(selected.id, form)
        setComponents((prev) => prev.map((c) => c.id === selected.id ? res.data : c))
      } else {
        const res = await createComponent(form)
        setComponents((prev) => [...prev, res.data])
      }
      setFormOpen(false)
    } catch {
      setFormError("Something went wrong. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await deleteComponent(selected.id)
      setComponents((prev) => prev.filter((c) => c.id !== selected.id))
      setDeleteOpen(false)
    } catch {
      // keep dialog open, error visible
    } finally {
      setDeleting(false)
    }
  }

  // ── render ────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground gap-2">
        <Loader2 className="size-4 animate-spin" />
        <span className="text-sm">Loading components…</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-destructive gap-2">
        <AlertCircle className="size-4" />
        <span className="text-sm">Failed to load components.</span>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-6">

        {/* Page header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-[#1E0A3C] tracking-tight">
              ISQM 1 Components
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              The 8 components of the System of Quality Management as defined by ISQM 1.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium bg-[#EDE9F8] text-[#3B1F6A] px-3 py-1.5 rounded-full">
              {components.length} Components
            </span>
            {isAdmin && (
              <button
                onClick={()=>navigate("/components/create")}
                className="flex items-center gap-1.5 bg-[#3B1F6A] hover:bg-[#52298F] text-white text-xs font-medium px-3.5 py-2 rounded-lg transition-colors"
              >
                <Plus className="size-3.5" />
                Add Component
              </button>
            )}
          </div>
        </div>

        {/* Grid */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {components.map((component, index) => {
            const color = COMPONENT_COLORS[index % COMPONENT_COLORS.length]
            return (
              <div
                key={component.id}
                className="group relative flex flex-col gap-4 rounded-xl border border-border bg-white p-5 hover:shadow-md hover:border-[#C4B0E8] transition-all duration-200"
              >
                {/* Index + reference badge */}
                <div className="flex items-center justify-between">
                  <div className={`flex size-9 items-center justify-center rounded-lg ${color.bg}`}>
                    <ShieldCheck className={`size-4 ${color.text}`} />
                  </div>
                  <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full ${color.bg} ${color.text}`}>
                    {component.isqm_reference}
                  </span>
                </div>

                {/* Name */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`size-1.5 rounded-full shrink-0 ${color.dot}`} />
                    <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                      Component {index + 1}
                    </span>
                  </div>
                  <h3 className="text-sm font-medium text-[#1E0A3C] leading-snug pr-2">
                    {component.name}
                  </h3>
                </div>

                {/* Admin actions — only visible on hover for admins */}
                {isAdmin && (
                  <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => openEdit(component, e)}
                      className="flex size-7 items-center justify-center rounded-md hover:bg-[#EDE9F8] text-muted-foreground hover:text-[#3B1F6A] transition-colors"
                      title="Edit"
                    >
                      <Pencil className="size-3.5" />
                    </button>
                    <button
                      onClick={(e) => openDelete(component, e)}
                      className="flex size-7 items-center justify-center rounded-md hover:bg-red-50 text-muted-foreground hover:text-red-600 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Create / Edit dialog ── */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#1E0A3C]">
              {selected ? "Edit Component" : "Add Component"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs font-medium text-[#4A3D6A] uppercase tracking-wide">
                Component Name
              </Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Governance and Leadership"
                className="focus-visible:ring-[#7B3FBE]"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ref" className="text-xs font-medium text-[#4A3D6A] uppercase tracking-wide">
                ISQM Reference
              </Label>
              <Input
                id="ref"
                value={form.isqm_reference}
                onChange={(e) => setForm((f) => ({ ...f, isqm_reference: e.target.value }))}
                placeholder="e.g. ISQM 1.16-23"
                className="focus-visible:ring-[#7B3FBE]"
              />
            </div>
            {formError && (
              <p className="text-xs text-red-500">{formError}</p>
            )}
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

      {/* ── Delete confirmation ── */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#1E0A3C]">Delete component?</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-medium text-[#1E0A3C]">{selected?.name}</span> will be permanently
              deleted along with all associated quality objectives. This cannot be undone.
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