import { useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useRisk } from "@/hooks/useRisk"
import { useRole } from "@/hooks/useRole"
import { updateRisk, deleteRisk } from "@/api/endpoints/riskApi"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet"
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  Target,
  Pencil,
  Trash2,
  Save,
  Calendar,
  ArrowRight,
  Check,
  Eye,
} from "lucide-react"

// ============================================================
// CONSTANTS
// ============================================================

const SIG_LABELS = { 1: "Low", 2: "Medium", 3: "High" }
const OCC_LABELS = { 1: "Low", 2: "Medium", 3: "High" }

// Matches backend RiskStatus enum
const MAIN_FLOW = ["identified", "assessed", "treatment_planned", "mitigated", "closed"]

const STATUS_LABEL = {
  identified: "Identified",
  assessed: "Assessed",
  treatment_planned: "Treatment planned",
  mitigated: "Mitigated",
  accepted: "Accepted",
  closed: "Closed",
  under_review: "Under review",
}

const ALL_STATUSES = Object.keys(STATUS_LABEL)

function getZone(significance, occurrence) {
  const score = significance * occurrence
  if (score >= 6) return "critical"
  if (score >= 3) return "high"
  return "low"
}

const ZONE = {
  critical: { label: "Critical", dot: "bg-red-500", text: "text-red-600" },
  high: { label: "High", dot: "bg-amber-500", text: "text-amber-600" },
  low: { label: "Low", dot: "bg-emerald-500", text: "text-emerald-600" },
}

function formatDate(str) {
  if (!str) return "—"
  return new Date(str).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
}

// ============================================================
// WORKFLOW STEPPER
// ============================================================

function WorkflowStepper({ status }) {
  const isSideState = status === "accepted" || status === "under_review"
  const currentIndex = MAIN_FLOW.indexOf(status)
  // accepted terminates the flow early (in place of "closed"); under_review sits mid-flow at "assessed"
  const effectiveIndex =
    status === "accepted" ? MAIN_FLOW.length - 1 : status === "under_review" ? 1 : currentIndex

  return (
    <div className="space-y-3">
      <div className="flex items-center">
        {MAIN_FLOW.map((step, i) => {
          const isLast = i === MAIN_FLOW.length - 1
          const done = i < effectiveIndex
          const active = i === effectiveIndex
          const label = isLast && status === "accepted" ? "Accepted" : STATUS_LABEL[step]

          return (
            <div key={step} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-2">
                <div
                  className={`flex items-center justify-center size-7 rounded-full text-[11px] font-semibold transition-colors ${
                    done
                      ? "bg-violet-600 text-white"
                      : active
                        ? "bg-violet-50 dark:bg-violet-500/10 text-violet-600 ring-2 ring-violet-600"
                        : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400"
                  }`}
                >
                  {done ? <Check className="size-3.5" /> : i + 1}
                </div>
                <span
                  className={`text-[10px] font-medium whitespace-nowrap ${
                    active ? "text-violet-600" : done ? "text-zinc-900 dark:text-white" : "text-zinc-400"
                  }`}
                >
                  {label}
                </span>
              </div>
              {!isLast && (
                <div
                  className={`h-0.5 flex-1 mx-2 -mt-4 rounded-full transition-colors ${
                    done ? "bg-violet-600" : "bg-zinc-200 dark:bg-zinc-800"
                  }`}
                />
              )}
            </div>
          )
        })}
      </div>

      {isSideState && (
        <div className="flex items-center gap-1.5 pt-1">
          <span className="size-1.5 rounded-full bg-violet-500 animate-pulse" />
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            Currently marked as <span className="font-medium text-zinc-700 dark:text-zinc-300">{STATUS_LABEL[status]}</span>
          </span>
        </div>
      )}
    </div>
  )
}

// ============================================================
// COMPONENT HOVER CARD
// ============================================================

function ComponentHoverCard({ component }) {
  return (
    <div className="group relative">
      <div className="flex items-center justify-between gap-2 py-2 cursor-default border-b border-transparent hover:border-zinc-200 dark:hover:border-zinc-800 transition-colors">
        <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">{component.name}</p>
        <Eye className="size-3.5 text-zinc-300 group-hover:text-zinc-500 transition-colors shrink-0" />
      </div>

      <div className="absolute left-0 top-full mt-2 w-72 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 pointer-events-none group-hover:pointer-events-auto">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-lg p-4">
          <p className="text-sm font-semibold text-zinc-900 dark:text-white mb-2">{component.name}</p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed line-clamp-4">
            {component.description || "No description"}
          </p>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// EDIT DRAWER
// ============================================================

function EditDrawer({ open, onOpenChange, risk, onSaved }) {
  const [form, setForm] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  // (Re)initialize form whenever the drawer opens with fresh risk data
  if (open && !form) {
    setForm({
      risk_discreption: risk.risk_discreption ?? "",
      significance: risk.significance,
      occurence: risk.occurence,
      status: risk.status,
      next_review_date: risk.next_review_date ?? "",
      date_last_assessed: risk.date_last_assessed ?? "",
    })
  }

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const handleClose = (val) => {
    if (!val) setForm(null)
    onOpenChange(val)
  }

  const handleSave = async () => {
    setSaving(true)
    setError("")
    try {
      const res = await updateRisk(risk.id, {
        ...form,
        significance: Number(form.significance),
        occurence: Number(form.occurence),
      })
      onSaved(res.data)
      handleClose(false)
    } catch (err) {
      setError(err?.response?.data?.detail ?? "Failed to save changes.")
    } finally {
      setSaving(false)
    }
  }

  if (!form) return null

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent className="sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle className="font-mono">{risk.risk_ref}</SheetTitle>
          <SheetDescription>Update risk assessment details</SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-1 space-y-5 py-2">
          <div>
            <label className="text-xs font-medium text-zinc-500 mb-1.5 block">Description</label>
            <textarea
              value={form.risk_discreption}
              onChange={set("risk_discreption")}
              rows={4}
              className="w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-transparent px-3 py-2 text-sm text-zinc-900 dark:text-white outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-white resize-none"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-zinc-500 mb-1.5 block">Status</label>
            <select
              value={form.status}
              onChange={set("status")}
              className="w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-transparent px-3 py-2 text-sm text-zinc-900 dark:text-white outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-white"
            >
              {ALL_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABEL[s]}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-zinc-500 mb-1.5 block">Significance</label>
              <select
                value={form.significance}
                onChange={set("significance")}
                className="w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-transparent px-3 py-2 text-sm text-zinc-900 dark:text-white outline-none focus:ring-1 focus:ring-violet-600"
              >
                {[1, 2, 3].map((v) => (
                  <option key={v} value={v}>
                    {v} — {SIG_LABELS[v]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-500 mb-1.5 block">Occurrence</label>
              <select
                value={form.occurence}
                onChange={set("occurence")}
                className="w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-transparent px-3 py-2 text-sm text-zinc-900 dark:text-white outline-none focus:ring-1 focus:ring-violet-600"
              >
                {[1, 2, 3].map((v) => (
                  <option key={v} value={v}>
                    {v} — {OCC_LABELS[v]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-zinc-500 mb-1.5 block">Last assessed</label>
              <input
                type="date"
                value={form.date_last_assessed || ""}
                onChange={set("date_last_assessed")}
                className="w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-transparent px-3 py-2 text-sm text-zinc-900 dark:text-white outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-white"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-500 mb-1.5 block">Next review</label>
              <input
                type="date"
                value={form.next_review_date || ""}
                onChange={set("next_review_date")}
                className="w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-transparent px-3 py-2 text-sm text-zinc-900 dark:text-white outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-white"
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-xs text-red-600">
              <AlertCircle className="size-3.5 shrink-0" />
              {error}
            </div>
          )}
        </div>

        <SheetFooter>
          <button
            onClick={() => handleClose(false)}
            className="px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-zinc-900 dark:bg-white dark:text-zinc-900 rounded-md hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors disabled:opacity-60"
          >
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            Save changes
          </button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

// ============================================================
// MAIN PAGE
// ============================================================

export default function RiskDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isAdmin } = useRole()
  const { risk, setRisk, loading, error } = useRisk(id)

  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await deleteRisk(id)
      navigate("/risks")
    } finally {
      setDeleting(false)
    }
  }

  if (loading)
    return (
      <div className="flex items-center justify-center h-64 gap-2 text-zinc-400">
        <Loader2 className="size-4 animate-spin" />
        <span className="text-sm">Loading…</span>
      </div>
    )

  if (error || !risk)
    return (
      <div className="flex items-center justify-center h-64 gap-2 text-red-600">
        <AlertCircle className="size-4" />
        <span className="text-sm">Risk not found</span>
      </div>
    )

  const zone = getZone(risk.significance, risk.occurence)
  const z = ZONE[zone]

  return (
    <>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate("/risks")}
            className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="size-4" />
            Risks
          </button>

          {isAdmin && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setEditOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-md transition-colors"
              >
                <Pencil className="size-3.5" />
                Edit
              </button>
              <button
                onClick={() => setDeleteOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-md transition-colors"
              >
                <Trash2 className="size-3.5" />
                Delete
              </button>
            </div>
          )}
        </div>

        {/* Title row */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-semibold font-mono text-zinc-900 dark:text-white">
                {risk.risk_ref}
              </h1>
              <span className="flex items-center gap-1.5 text-sm">
                <span className={`size-1.5 rounded-full ${z.dot}`} />
                <span className={`font-medium ${z.text}`}>{z.label} risk</span>
              </span>
            </div>
            <p className="text-sm text-zinc-500">
              Identified {formatDate(risk.date_identified)}
              {risk.date_last_assessed && ` · Last assessed ${formatDate(risk.date_last_assessed)}`}
            </p>
          </div>

          <div className="text-right shrink-0">
            <p className="text-3xl font-semibold text-zinc-900 dark:text-white leading-none">
              {risk.score}
              <span className="text-base text-zinc-400 font-normal">/9</span>
            </p>
            {risk.residual_score != null && (
              <p className="text-xs text-zinc-400 mt-1">Residual {risk.residual_score}</p>
            )}
          </div>
        </div>

        {/* Workflow */}
        <div className="py-6 border-y border-zinc-100 dark:border-zinc-900">
          <WorkflowStepper status={risk.status} />
        </div>

        {/* Content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-10">
          {/* Left: main content */}
          <div className="space-y-8">
            {/* Description */}
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-400 mb-2">Description</p>
              <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
                {risk.risk_discreption || <span className="italic text-zinc-400">No description provided</span>}
              </p>
            </div>

            {/* Significance / Occurrence — read only, numeric 1-3 scale */}
            <div className="grid grid-cols-2 gap-8">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-zinc-400 mb-2">Significance</p>
                <div className="flex items-center gap-2.5">
                  <span className="text-xl font-semibold text-zinc-900 dark:text-white">{risk.significance}</span>
                  <span className="text-xs text-zinc-400">/ 3</span>
                  <div className="flex gap-1 ml-1">
                    {[1, 2, 3].map((i) => (
                      <span
                        key={i}
                        className={`size-1.5 rounded-full ${
                          i <= risk.significance ? "bg-violet-600" : "bg-zinc-200 dark:bg-zinc-700"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-zinc-400">{SIG_LABELS[risk.significance]}</span>
                </div>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-zinc-400 mb-2">Occurrence</p>
                <div className="flex items-center gap-2.5">
                  <span className="text-xl font-semibold text-zinc-900 dark:text-white">{risk.occurence}</span>
                  <span className="text-xs text-zinc-400">/ 3</span>
                  <div className="flex gap-1 ml-1">
                    {[1, 2, 3].map((i) => (
                      <span
                        key={i}
                        className={`size-1.5 rounded-full ${
                          i <= risk.occurence ? "bg-violet-600" : "bg-zinc-200 dark:bg-zinc-700"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-zinc-400">{OCC_LABELS[risk.occurence]}</span>
                </div>
              </div>
            </div>

            {/* Dates — inline, no big boxes */}
            <div className="flex items-center gap-8 text-sm">
              <div className="flex items-center gap-2 text-zinc-500">
                <Calendar className="size-3.5" />
                <span>Next review</span>
                <span className="font-medium text-zinc-900 dark:text-white">
                  {formatDate(risk.next_review_date)}
                </span>
              </div>
            </div>
          </div>

          {/* Right: sidebar */}
          <div className="space-y-8">
            {/* Component */}
            {risk.component && (
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-zinc-400 mb-2">Component</p>
                <ComponentHoverCard component={risk.component} />
              </div>
            )}

            {/* Objectives */}
            {risk.objectives && risk.objectives.length > 0 && (
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-zinc-400 mb-3">
                  Objectives ({risk.objectives.length})
                </p>
                <div className="space-y-1">
                  {risk.objectives.map((obj) => (
                    <button
                      key={obj.id}
                      onClick={() => navigate(`/objectives/${obj.id}`)}
                      className="group w-full flex items-center justify-between gap-2 py-2 border-b border-zinc-100 dark:border-zinc-900 last:border-0 text-left"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Target className="size-3.5 text-zinc-300 shrink-0" />
                        <span className="text-sm text-zinc-700 dark:text-zinc-300 truncate">
                          Objective {obj.objective_reference}
                        </span>
                      </div>
                      <ArrowRight className="size-3.5 text-zinc-300 group-hover:text-zinc-600 group-hover:translate-x-0.5 transition-all shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Drawer */}
      <EditDrawer open={editOpen} onOpenChange={setEditOpen} risk={risk} onSaved={setRisk} />

      {/* Delete Dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete risk?</AlertDialogTitle>
            <AlertDialogDescription>
              Risk <span className="font-mono font-semibold">{risk.risk_ref}</span> will be permanently
              deleted. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting && <Loader2 className="size-4 animate-spin mr-2" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}