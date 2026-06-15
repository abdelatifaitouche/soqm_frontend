import { useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useObjective } from "@/hooks/useObjective"
import { useComponents } from "@/hooks/useComponents"
import { useRole } from "@/hooks/useRole"
import { updateObjective, deleteObjective } from "@/api/endpoints/objectivesApi"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  ArrowLeft, Loader2, AlertCircle, Target, Calendar,
  Pencil, Trash2, Save, X, FileText, Clock, LayoutGrid,
} from "lucide-react"

// ── State config ──────────────────────────────────────────────────────────────
const STATE_CONFIG = {
  draft:        { label: "Draft",        bg: "bg-gray-100 dark:bg-muted",            text: "text-gray-600 dark:text-muted-foreground", dot: "bg-gray-400" },
  approved:     { label: "Approved",     bg: "bg-emerald-50 dark:bg-emerald-950/30", text: "text-emerald-700 dark:text-emerald-400",   dot: "bg-emerald-500" },
  active:       { label: "Active",       bg: "bg-blue-50 dark:bg-blue-950/30",       text: "text-blue-700 dark:text-blue-400",         dot: "bg-blue-500" },
  under_review: { label: "Under Review", bg: "bg-amber-50 dark:bg-amber-950/30",     text: "text-amber-700 dark:text-amber-400",       dot: "bg-amber-500" },
  revised:      { label: "Revised",      bg: "bg-purple-50 dark:bg-purple-950/30",   text: "text-purple-700 dark:text-purple-400",     dot: "bg-purple-500" },
  achieved:     { label: "Achieved",     bg: "bg-teal-50 dark:bg-teal-950/30",       text: "text-teal-700 dark:text-teal-400",         dot: "bg-teal-500" },
  superseded:   { label: "Superseded",   bg: "bg-orange-50 dark:bg-orange-950/30",   text: "text-orange-700 dark:text-orange-400",     dot: "bg-orange-500" },
  suspended:    { label: "Suspended",    bg: "bg-red-50 dark:bg-red-950/30",         text: "text-red-700 dark:text-red-400",           dot: "bg-red-500" },
  archived:     { label: "Archived",     bg: "bg-gray-100 dark:bg-muted",            text: "text-gray-500 dark:text-muted-foreground", dot: "bg-gray-400" },
}

const ALL_STATES = Object.keys(STATE_CONFIG)

function StateBadge({ status }) {
  const cfg = STATE_CONFIG[status] ?? STATE_CONFIG.draft
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.text}`}>
      <span className={`size-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  )
}

function formatDate(dateStr) {
  if (!dateStr) return "—"
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric", month: "long", year: "numeric",
  })
}

function formatDateTime(dateStr) {
  if (!dateStr) return "—"
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  })
}

// ── Diff helper — only returns fields that changed ────────────────────────────
function diffForm(form, original) {
  return Object.fromEntries(
    Object.entries(form).filter(([key, val]) => {
      if (key === "review_date") {
        return val !== (original[key]?.split("T")[0] ?? "")
      }
      return val !== original[key]
    })
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ObjectiveDetails() {
  const { id }      = useParams()
  const navigate    = useNavigate()
  const { isAdmin } = useRole()
  const { objective, setObjective, loading, error } = useObjective(id)
  const { components } = useComponents()

  const [editing, setEditing]       = useState(false)
  const [form, setForm]             = useState(null)
  const [saving, setSaving]         = useState(false)
  const [saveError, setSaveError]   = useState("")
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting]     = useState(false)

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const startEdit = () => {
    setForm({
      objective_text: objective.objective_text,
      description:    objective.description ?? "",
      review_date:    objective.review_date?.split("T")[0] ?? "",
      component_id:   objective.component_id,
      status:         objective.status,
    })
    setSaveError("")
    setEditing(true)
  }

  const handleSave = async () => {
    if (!form.objective_text?.trim()) { setSaveError("Objective text is required."); return }
    if (!form.component_id)           { setSaveError("Component is required."); return }

    const changes = diffForm(form, objective)

    if (Object.keys(changes).length === 0) {
      setEditing(false)
      return
    }

    setSaving(true)
    setSaveError("")
    try {
      const res = await updateObjective(id, changes)
      setObjective(res.data)
      setEditing(false)
    } catch (err) {
      const data = err?.response?.data
      setSaveError(data?.detail ?? data?.message ?? "Failed to save. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await deleteObjective(id)
      navigate("/objectives")
    } finally {
      setDeleting(false)
    }
  }

  const linkedComponent = components.find((c) =>
    c.id === (editing ? form?.component_id : objective?.component_id)
  )

  // ── States ────────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="flex items-center justify-center h-64 text-muted-foreground gap-2">
      <Loader2 className="size-4 animate-spin" />
      <span className="text-sm">Loading objective…</span>
    </div>
  )

  if (error || !objective) return (
    <div className="flex items-center justify-center h-64 text-destructive gap-2">
      <AlertCircle className="size-4" />
      <span className="text-sm">Objective not found.</span>
    </div>
  )

  return (
    <>
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Back + actions */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate("/objectives")}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="size-3.5" /> Back to Objectives
          </button>

          {isAdmin && !editing && (
            <div className="flex items-center gap-2">
              <button
                onClick={startEdit}
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-[#C4B0E8] bg-[#EDE9F8] text-[#3B1F6A] hover:bg-[#DDD5F5] dark:bg-accent dark:border-border dark:text-foreground transition-colors"
              >
                <Pencil className="size-3.5" /> Edit
              </button>
              <button
                onClick={() => setDeleteOpen(true)}
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-950/30 dark:border-red-900 dark:text-red-400 transition-colors"
              >
                <Trash2 className="size-3.5" /> Delete
              </button>
            </div>
          )}

          {isAdmin && editing && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setEditing(false)}
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors"
              >
                <X className="size-3.5" /> Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-1.5 text-xs font-medium px-4 py-1.5 rounded-lg bg-[#3B1F6A] hover:bg-[#52298F] text-white transition-colors disabled:opacity-60"
              >
                {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
                Save changes
              </button>
            </div>
          )}
        </div>

        {/* Header card */}
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-start gap-4">
            <div className="flex size-11 items-center justify-center rounded-xl bg-[#EDE9F8] dark:bg-accent shrink-0">
              <Target className="size-5 text-[#7B3FBE]" />
            </div>
            <div className="flex-1 min-w-0 space-y-2">
              {editing ? (
                <textarea
                  value={form.objective_text}
                  onChange={set("objective_text")}
                  rows={2}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm font-medium text-foreground outline-none focus:ring-2 focus:ring-[#7B3FBE] resize-none"
                />
              ) : (
                <h1 className="text-base font-semibold text-foreground leading-snug">
                  {objective.objective_text}
                </h1>
              )}
              <div className="flex items-center gap-2 flex-wrap">
                {editing ? (
                  <select
                    value={form.status}
                    onChange={set("status")}
                    className="h-8 rounded-lg border border-input bg-background px-2.5 text-xs text-foreground outline-none focus:ring-2 focus:ring-[#7B3FBE]"
                  >
                    {ALL_STATES.map((s) => (
                      <option key={s} value={s}>{STATE_CONFIG[s].label}</option>
                    ))}
                  </select>
                ) : (
                  <StateBadge status={objective.status} />
                )}
                <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <Clock className="size-3" />
                  Updated {formatDateTime(objective.updated_at)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Component card */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <div className="flex items-center gap-2">
            <LayoutGrid className="size-4 text-[#7B3FBE]" />
            <h2 className="text-sm font-semibold text-foreground">ISQM Component</h2>
          </div>

          {editing ? (
            <select
              value={form.component_id}
              onChange={set("component_id")}
              className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-[#7B3FBE]"
            >
              <option value="" disabled>Select a component…</option>
              {[...components]
                .sort((a, b) => a.display_order - b.display_order)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.display_order}. {c.name}
                  </option>
                ))}
            </select>
          ) : null}

          {linkedComponent ? (
            <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-[#EDE9F8] dark:bg-accent border border-[#C4B0E8] dark:border-border">
              <div className="flex size-8 items-center justify-center rounded-md bg-[#3B1F6A] shrink-0">
                <Target className="size-4 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-[#1E0A3C] dark:text-foreground truncate">
                  {linkedComponent.name}
                </p>
                <p className="text-[11px] text-[#7B3FBE] dark:text-muted-foreground mt-0.5">
                  {linkedComponent.isqm_reference}
                </p>
              </div>
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ${
                linkedComponent.is_active
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
                  : "bg-gray-100 text-gray-500 dark:bg-muted dark:text-muted-foreground"
              }`}>
                {linkedComponent.is_active ? "Active" : "Inactive"}
              </span>
            </div>
          ) : (
            !editing && (
              <p className="text-sm text-muted-foreground">No component linked.</p>
            )
          )}
        </div>

        {/* Details card */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-5">
          <div className="flex items-center gap-2">
            <FileText className="size-4 text-[#7B3FBE]" />
            <h2 className="text-sm font-semibold text-foreground">Details</h2>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Description
            </Label>
            {editing ? (
              <textarea
                value={form.description}
                onChange={set("description")}
                rows={2}
                placeholder="Additional context…"
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-[#7B3FBE] resize-none placeholder:text-muted-foreground"
              />
            ) : (
              <p className="text-sm text-foreground leading-relaxed">
                {objective.description || (
                  <span className="text-muted-foreground">No description provided.</span>
                )}
              </p>
            )}
          </div>

          <div className="border-t border-border" />

          {/* Review date */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Review Date
            </Label>
            {editing ? (
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
                <Input
                  type="date"
                  value={form.review_date}
                  onChange={set("review_date")}
                  className="pl-9 focus-visible:ring-[#7B3FBE]"
                />
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-foreground">
                <Calendar className="size-3.5 text-muted-foreground" />
                {formatDate(objective.review_date)}
              </div>
            )}
          </div>

          {saveError && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900">
              <AlertCircle className="size-3.5 text-red-500 shrink-0" />
              <p className="text-xs text-red-600 dark:text-red-400">{saveError}</p>
            </div>
          )}
        </div>

        {/* Placeholder — future linked risks */}
        <div className="rounded-xl border border-dashed border-border bg-card/50 p-6 text-center">
          <p className="text-sm text-muted-foreground">
            Risks and processes linked to this objective will appear here.
          </p>
        </div>

      </div>

      {/* Delete confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Delete objective?</AlertDialogTitle>
            <AlertDialogDescription>
              This objective will be permanently deleted along with all linked risks and processes.
              This cannot be undone.
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