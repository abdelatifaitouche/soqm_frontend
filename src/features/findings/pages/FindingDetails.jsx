import { useState, useMemo, useEffect, Fragment } from "react"
import { useParams, useNavigate } from "react-router-dom"
import {
  ArrowLeft, AlertCircle, Check, CircleDashed, FileSearch,
  Wrench, ClipboardCheck, CheckCircle2, AlertTriangle,
  ShieldAlert, ListChecks, Plus, Loader2, X, Calendar,
  ChevronLeft, ChevronRight, CheckSquare, Pencil,
} from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet"
import { useFinding } from "@/features/findings/hooks/useFinding"
import { useUpdateFinding } from "@/features/findings/hooks/useUpdateFinding"
import { useDepts } from "@/features/departments/hooks/useDept"
import { useActions } from "@/features/findings/hooks/useActions"
import { createAction } from "@/features/findings/api/actionsApi"
import RootCauseSection from "@/features/findings/pages/RootCauseAnalysis"

// ── Config ────────────────────────────────────────────────────────────────────

const STATUS_FLOW = ["open", "under_assessment", "remediation_in_progress", "pending_verification", "closed"]

const STATUS_CONFIG = {
  open:                    { label: "Open",                    icon: CircleDashed,   cls: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-900/40 dark:text-slate-400 dark:border-slate-800" },
  under_assessment:        { label: "Under assessment",        icon: FileSearch,     cls: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900" },
  remediation_in_progress: { label: "Remediation in progress", icon: Wrench,         cls: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900" },
  pending_verification:    { label: "Pending verification",    icon: ClipboardCheck, cls: "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/30 dark:text-violet-400 dark:border-violet-900" },
  closed:                  { label: "Closed",                  icon: CheckCircle2,   cls: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900" },
}

const SEVERITY_CONFIG = {
  deficiency:             { label: "Deficiency",             icon: AlertCircle,  cls: "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950/30 dark:text-yellow-400 dark:border-yellow-900" },
  significant_deficiency: { label: "Significant deficiency", icon: AlertTriangle, cls: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/30 dark:text-orange-400 dark:border-orange-900" },
  material_deficiency:    { label: "Material deficiency",    icon: ShieldAlert,   cls: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900" },
}

const ACTION_STATUS_CONFIG = {
  DRAFT:       { label: "Draft",       icon: CircleDashed, cls: "bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700" },
  IN_PROGRESS: { label: "In progress", icon: Wrench,       cls: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900" },
  COMPLETED:   { label: "Completed",   icon: CheckSquare,  cls: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900" },
}

const SOURCE_LABEL = {
  Gtar: "GTAR",
  external_quality_review: "External quality review",
  external_engagement_system_review: "External engagement system review",
  internal_quality_management_system_review: "Internal quality management system review",
  internal_engagement_review: "Internal engagement review",
  restatements: "Restatements",
  other_quality_events: "Other quality events",
}

const PILL = "inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full border whitespace-nowrap"
const INPUT = "w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-[#7B3FBE] transition-colors disabled:opacity-60"
const SELECT_CLS = "h-9 rounded-lg border border-input bg-card px-3 text-xs text-foreground outline-none focus:ring-2 focus:ring-[#7B3FBE] transition-colors cursor-pointer"

function formatLabel(str) {
  if (!str) return "—"
  return str.toLowerCase().replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

function fmtDate(val) {
  if (!val) return "—"
  const d = new Date(/^\d{4}-\d{2}-\d{2}$/.test(val) ? `${val}T00:00:00` : val)
  if (isNaN(d.getTime())) return "—"
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
}

// FastAPI can return `detail` as a string or as a list of validation errors.
function extractError(err, fallback) {
  const detail = err?.response?.data?.detail
  if (typeof detail === "string") return detail
  if (Array.isArray(detail)) {
    const msg = detail.map((d) => d.msg).filter(Boolean).join(". ")
    if (msg) return msg
  }
  return fallback
}

// ── Shared ────────────────────────────────────────────────────────────────────

function Section({ title, aside, children, className = "" }) {
  return (
    <section className={`rounded-xl border border-border bg-card ${className}`}>
      <div className="flex items-center justify-between gap-3 px-5 pt-4 pb-3 border-b border-border">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        {aside}
      </div>
      <div className="px-5 py-5">{children}</div>
    </section>
  )
}

function DetailRow({ label, children }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5 border-b border-border/60 last:border-0">
      <dt className="text-xs text-muted-foreground shrink-0">{label}</dt>
      <dd className="text-sm text-foreground text-right">{children}</dd>
    </div>
  )
}

// ── Status stepper ────────────────────────────────────────────────────────────

function StatusStepper({ status }) {
  const currentIdx = STATUS_FLOW.indexOf(status)
  return (
    <ol className="flex">
      {STATUS_FLOW.map((step, idx) => {
        const done   = idx < currentIdx
        const active = idx === currentIdx
        const isLast = idx === STATUS_FLOW.length - 1
        return (
          <li key={step} className="relative flex-1 flex flex-col items-center gap-2" aria-current={active ? "step" : undefined}>
            {!isLast && (
              <span className={`absolute top-[9px] left-1/2 w-full h-0.5 rounded-full ${done ? "bg-[#3B1F6A]" : "bg-border"}`} />
            )}
            <span className={`relative z-10 flex items-center justify-center size-5 rounded-full border-2 transition-colors ${
              done   ? "bg-[#3B1F6A] border-[#3B1F6A] text-white" :
              active ? "bg-card border-[#3B1F6A] ring-4 ring-[#EDE9F8] dark:ring-violet-500/15" :
                       "bg-card border-border"
            }`}>
              {done   && <Check className="size-3" strokeWidth={3} />}
              {active && <span className="size-2 rounded-full bg-[#3B1F6A] dark:bg-[#7B3FBE]" />}
            </span>
            <span className={`text-xs text-center leading-tight px-1 ${
              active ? "font-semibold text-[#3B1F6A] dark:text-[#a78bdb]" :
              done   ? "text-foreground/70" : "text-muted-foreground/70"
            }`}>
              {STATUS_CONFIG[step].label}
            </span>
          </li>
        )
      })}
    </ol>
  )
}

// ── Edit finding drawer ───────────────────────────────────────────────────────
// Mounted only while open, so it always starts from the latest saved values.
// Only fields that changed are sent.

function EditFindingForm({ finding, onSave, onClose }) {
  const [title, setTitle] = useState(finding.finding_title ?? "")
  const [source, setSource] = useState(finding.finding_source ?? "")
  const [description, setDescription] = useState(finding.description ?? "")
  const [saving, setSaving] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState("")

  const cleanTitle = title.trim()
  const cleanDescription = description.trim()

  const errors = {
    source: !source ? "Select a source." : "",
    description: !cleanDescription ? "Describe what was found." : "",
  }
  const hasErrors = Object.values(errors).some(Boolean)

  const changes = {}
  if (cleanTitle !== (finding.finding_title ?? "")) changes.finding_title = cleanTitle
  if (source !== (finding.finding_source ?? "")) changes.finding_source = source
  if (cleanDescription !== (finding.description ?? "")) changes.description = cleanDescription
  const hasChanges = Object.keys(changes).length > 0

  const submit = async (e) => {
    e.preventDefault()
    setSubmitted(true)
    setError("")
    if (hasErrors) return
    if (!hasChanges) { onClose(); return }

    setSaving(true)
    try {
      await onSave(changes)
      onClose()
    } catch (err) {
      setError(extractError(err, "Couldn’t save the changes. Try again."))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col flex-1 min-h-0">
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-5">
        <div>
          <label htmlFor="finding-title" className="block text-sm font-medium text-foreground mb-1.5">Title</label>
          <input
            id="finding-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={saving}
            placeholder="A short name for this finding"
            className={INPUT}
          />
        </div>

        <div>
          <label htmlFor="finding-source" className="block text-sm font-medium text-foreground mb-1.5">
            Source <span className="text-muted-foreground font-normal">*</span>
          </label>
          <select
            id="finding-source"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            disabled={saving}
            className={`${INPUT} cursor-pointer ${submitted && errors.source ? "border-red-400" : ""}`}
          >
            {!source && <option value="">Select a source</option>}
            {Object.entries(SOURCE_LABEL).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          {submitted && errors.source && <p className="text-xs text-red-600 mt-1.5">{errors.source}</p>}
        </div>

        <div>
          <label htmlFor="finding-description" className="block text-sm font-medium text-foreground mb-1.5">
            Description <span className="text-muted-foreground font-normal">*</span>
          </label>
          <textarea
            id="finding-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={8}
            disabled={saving}
            className={`${INPUT} resize-y leading-relaxed ${submitted && errors.description ? "border-red-400" : ""}`}
          />
          {submitted && errors.description && <p className="text-xs text-red-600 mt-1.5">{errors.description}</p>}
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">
          Severity, department and status aren’t changed here.
        </p>

        {error && (
          <div role="alert" className="flex items-start gap-2 text-sm text-red-600">
            <AlertCircle className="size-4 shrink-0 mt-0.5" />
            {error}
          </div>
        )}
      </div>

      <SheetFooter>
        <button
          type="button"
          onClick={onClose}
          disabled={saving}
          className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors disabled:opacity-60"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving || !hasChanges}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#3B1F6A] rounded-lg hover:bg-[#52298F] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving && <Loader2 className="size-4 animate-spin" />}
          Save changes
        </button>
      </SheetFooter>
    </form>
  )
}

function EditFindingDrawer({ open, onOpenChange, finding, onSave }) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg flex flex-col">
        <SheetHeader>
          <SheetTitle className="font-mono">{finding.finding_ref}</SheetTitle>
          <SheetDescription>Update the title, source or description of this finding.</SheetDescription>
        </SheetHeader>
        {open && <EditFindingForm finding={finding} onSave={onSave} onClose={() => onOpenChange(false)} />}
      </SheetContent>
    </Sheet>
  )
}

// ── Create action modal ───────────────────────────────────────────────────────

function CreateActionModal({ findingId, onClose, onCreated }) {
  const [title, setTitle]   = useState("")
  const [date, setDate]     = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState("")

  const handleSubmit = async () => {
    if (!title.trim()) { setError("Title is required."); return }
    setSaving(true); setError("")
    try {
      const res = await createAction(findingId, {
        title:                    title.trim(),
        finding_id:               findingId,
        estimated_completion_date: date || null,
      })
      onCreated(res.data ?? res)
      onClose()
    } catch (err) {
      setError(err?.response?.data?.detail ?? "Failed to create action.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md bg-card rounded-2xl border border-border shadow-2xl overflow-hidden">
        <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-4 border-b border-border">
          <div>
            <h2 className="text-base font-semibold text-foreground">New action plan</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Add a remediation action for this finding</p>
          </div>
          <button onClick={onClose}
            className="flex size-7 items-center justify-center rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0">
            <X className="size-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">
              Title <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Update training programme for new standards"
              disabled={saving}
              className={INPUT}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              autoFocus
            />
          </div>

          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">
              <span className="flex items-center gap-1">
                <Calendar className="size-3" /> Estimated completion
              </span>
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              disabled={saving}
              className={INPUT}
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-xs text-destructive">
              <AlertCircle className="size-3.5 shrink-0" /> {error}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border">
          <button onClick={onClose} disabled={saving}
            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors disabled:opacity-60">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={saving}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-[#3B1F6A] hover:bg-[#52298F] rounded-lg transition-colors disabled:opacity-60">
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
            Create action
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Pagination ────────────────────────────────────────────────────────────────

function Pagination({ page, totalPages, onChange }) {
  // Hooks run before the early return so the hook order never changes between renders.
  const pages = useMemo(() => {
    const set = new Set([1, totalPages, page - 1, page, page + 1])
    return [...set].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b)
  }, [page, totalPages])

  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-between pt-4 border-t border-border mt-4">
      <p className="text-xs text-muted-foreground">Page {page} of {totalPages}</p>
      <div className="flex items-center gap-1">
        <button onClick={() => onChange(page - 1)} disabled={page <= 1} aria-label="Previous page"
          className="flex size-7 items-center justify-center rounded-md border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-40 transition-colors">
          <ChevronLeft className="size-3.5" />
        </button>
        {pages.map((p, i) => (
          <Fragment key={p}>
            {i > 0 && pages[i - 1] !== p - 1 && (
              <span className="text-xs text-muted-foreground px-0.5">…</span>
            )}
            <button onClick={() => onChange(p)} aria-current={p === page ? "page" : undefined}
              className={`flex size-7 items-center justify-center rounded-md text-xs font-medium transition-colors ${
                p === page ? "bg-[#3B1F6A] text-white" : "border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}>
              {p}
            </button>
          </Fragment>
        ))}
        <button onClick={() => onChange(page + 1)} disabled={page >= totalPages} aria-label="Next page"
          className="flex size-7 items-center justify-center rounded-md border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-40 transition-colors">
          <ChevronRight className="size-3.5" />
        </button>
      </div>
    </div>
  )
}

// ── Action plans section ──────────────────────────────────────────────────────

function ActionPlansSection({ findingId }) {
  const [page, setPage]         = useState(1)
  const [statusFilter, setStatus] = useState("")
  const [createOpen, setCreateOpen] = useState(false)
  const navigate = useNavigate()
  const { items, total, totalPages, loading, error, setItems } = useActions(findingId, page, statusFilter)

  const handleCreated = (newAction) => {
    setItems((prev) => [newAction, ...prev])
  }

  const actionStatuses = Object.keys(ACTION_STATUS_CONFIG)

  return (
    <>
      <Section
        title={`Action plans${total > 0 ? ` (${total})` : ""}`}
        aside={
          <div className="flex items-center gap-2">
            {total > 0 && (
              <select
                value={statusFilter}
                onChange={(e) => { setStatus(e.target.value); setPage(1) }}
                className={SELECT_CLS}
              >
                <option value="">All statuses</option>
                {actionStatuses.map((s) => (
                  <option key={s} value={s}>{ACTION_STATUS_CONFIG[s].label}</option>
                ))}
              </select>
            )}
            <button
              onClick={() => setCreateOpen(true)}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-[#3B1F6A] hover:bg-[#52298F] text-white transition-colors"
            >
              <Plus className="size-3" /> Add action
            </button>
          </div>
        }
      >
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            <span className="text-sm">Loading actions…</span>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center gap-2 py-10 text-destructive">
            <AlertCircle className="size-4" />
            <span className="text-sm">Failed to load actions.</span>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center text-center gap-3 py-10">
            <div className="flex size-10 items-center justify-center rounded-xl bg-muted">
              <ListChecks className="size-4 text-muted-foreground/40" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">No action plans yet</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs leading-relaxed">
                {statusFilter ? "No actions match this filter." : "Remediation actions with owners and due dates will be tracked here."}
              </p>
            </div>
            {!statusFilter && (
              <button onClick={() => setCreateOpen(true)}
                className="text-xs font-medium px-4 py-2 rounded-lg bg-[#3B1F6A] hover:bg-[#52298F] text-white transition-colors mt-1">
                Add first action
              </button>
            )}
          </div>
        ) : (
          <>
            <ul className="space-y-2">
              {items.map((action) => {
                const stCfg = ACTION_STATUS_CONFIG[action.status] ?? ACTION_STATUS_CONFIG.DRAFT
                const StIcon = stCfg.icon
                return (
                  <li
                    key={action.id}
                    onClick={() => navigate(`/actions/${action.id}`)}
                    className="flex items-center gap-4 px-4 py-3.5 rounded-xl border border-border bg-card hover:bg-muted/30 transition-colors cursor-pointer min-w-0"
                  >
                    <div className="flex-1 min-w-0 space-y-1">
                      <p className="text-sm font-medium text-foreground truncate max-w-full" title={action.title}>
                        {action.title}
                      </p>
                      <div className="flex items-center gap-3 flex-wrap">
                        {action.estimated_completion_date && (
                          <div className="flex items-center gap-1">
                            <Calendar className="size-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              Due {fmtDate(action.estimated_completion_date)}
                            </span>
                          </div>
                        )}
                        {action.completion_date ? (
                          <div className="flex items-center gap-1">
                            <CheckSquare className="size-3 text-emerald-500" />
                            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                              Completed {fmtDate(action.completion_date)}
                            </span>
                          </div>
                        ) : action.status !== "DRAFT" && action.status !== "CANCELLED" && (
                          <span className="text-xs text-muted-foreground/50 italic">Not yet completed</span>
                        )}
                      </div>
                    </div>
                    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${stCfg.cls}`}>
                      <StIcon className="size-2.5" />
                      {stCfg.label}
                    </span>
                  </li>
                )
              })}
            </ul>
            <Pagination page={page} totalPages={totalPages} onChange={setPage} />
          </>
        )}
      </Section>

      {createOpen && (
        <CreateActionModal
          findingId={findingId}
          onClose={() => setCreateOpen(false)}
          onCreated={handleCreated}
        />
      )}
    </>
  )
}

// ── Page skeleton ─────────────────────────────────────────────────────────────

function PageSkeleton() {
  return (
    <div className="max-w-6xl mx-auto space-y-6" aria-busy="true">
      <div className="h-5 w-24 rounded bg-muted animate-pulse" />
      <div className="rounded-xl border border-border bg-card p-8 space-y-4">
        <div className="h-12 w-32 rounded bg-muted animate-pulse" />
        <div className="h-6 w-64 rounded bg-muted animate-pulse" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
        <div className="h-48 rounded-xl border border-border bg-card animate-pulse" />
        <div className="h-48 rounded-xl border border-border bg-card animate-pulse" />
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

function FindingDetails() {
  const { id }   = useParams()
  const navigate = useNavigate()
  const { finding: fetched, loading, error } = useFinding(id)
  const { depts, loading: deptsLoading }     = useDepts()
  const { update }                           = useUpdateFinding(id)

  // The update endpoint returns 204 (no body), so after a save we apply the
  // changes we sent on top of the fetched finding. A fresh fetch replaces them.
  const [overrides, setOverrides] = useState({})
  const [editOpen, setEditOpen]   = useState(false)

  useEffect(() => { setOverrides({}) }, [fetched])

  if (loading) return <PageSkeleton />

  if (error || !fetched) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2 text-destructive">
          <AlertCircle className="size-4" />
          <p className="text-sm font-semibold text-foreground">
            {error ? "Couldn't load this finding." : "Finding not found."}
          </p>
        </div>
        <button onClick={() => navigate("/findings")}
          className="text-xs text-[#3B1F6A] dark:text-[#a78bdb] hover:underline">
          Back to findings
        </button>
      </div>
    </div>
  )

  const finding = { ...fetched, ...overrides }

  const handleSave = async (changes) => {
    await update(changes) // throws on failure; the drawer shows the error and stays open
    setOverrides((prev) => ({ ...prev, ...changes, updated_at: new Date().toISOString() }))
  }

  const deptList   = Array.isArray(depts) ? depts : depts?.items ?? []
  const deptName   = deptList.find((d) => d.id === finding.department)?.name

  const status     = STATUS_CONFIG[finding.status] ?? { label: formatLabel(finding.status), icon: CircleDashed, cls: STATUS_CONFIG.open.cls }
  const StatusIcon = status.icon
  const severity   = finding.deficiency_severity
    ? SEVERITY_CONFIG[finding.deficiency_severity] ?? { label: formatLabel(finding.deficiency_severity), icon: AlertCircle, cls: SEVERITY_CONFIG.deficiency.cls }
    : null
  const SeverityIcon = severity?.icon

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <button onClick={() => navigate("/findings")}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors group">
          <ArrowLeft className="size-4 group-hover:-translate-x-0.5 transition-transform" />
          Findings
        </button>

        <button
          onClick={() => setEditOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
        >
          <Pencil className="size-3.5" />
          Edit
        </button>
      </div>

      {/* Header card */}
      <header className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="p-6 sm:p-8">
          <p className="text-sm text-muted-foreground mb-1">Finding</p>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground font-mono leading-none">
            {finding.finding_ref}
          </h1>
          {finding.finding_title && (
            <p className="mt-3 text-lg font-medium text-foreground/90 leading-snug break-words">
              {finding.finding_title}
            </p>
          )}

          <div className="flex items-center gap-2 flex-wrap mt-5">
            <span className={`${PILL} ${status.cls}`}>
              <StatusIcon className="size-3" /> {status.label}
            </span>
            {severity && (
              <span className={`${PILL} ${severity.cls}`}>
                <SeverityIcon className="size-3" /> {severity.label}
              </span>
            )}
            <span className="text-sm text-muted-foreground ml-1">
              {SOURCE_LABEL[finding.finding_source] ?? formatLabel(finding.finding_source)}
            </span>
          </div>
        </div>
        <div className="border-t border-border bg-muted/20 px-6 sm:px-8 py-5">
          <StatusStepper status={finding.status} />
        </div>
      </header>

      {/* Content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-6 items-start min-w-0">
        <div className="min-w-0 space-y-6">
          <Section title="Description">
            <p className="text-[15px] text-foreground/90 leading-7 max-w-[68ch] whitespace-pre-line">
              {finding.description || <span className="italic text-muted-foreground">No description provided</span>}
            </p>
          </Section>

          <RootCauseSection rca={finding.root_cause_analysis} findingId={finding.id} />

          <ActionPlansSection findingId={finding.id} />
        </div>

        <aside className="space-y-6">
          <Section title="Details">
            <dl className="-my-1">
              <DetailRow label="Source">
                {SOURCE_LABEL[finding.finding_source] ?? formatLabel(finding.finding_source)}
              </DetailRow>
              <DetailRow label="Department">
                {deptName ?? (
                  <span className="text-muted-foreground">
                    {deptsLoading ? "Loading…" : "Unknown department"}
                  </span>
                )}
              </DetailRow>
              <DetailRow label="Identified">{fmtDate(finding.created_at)}</DetailRow>
              <DetailRow label="Last updated">{fmtDate(finding.updated_at)}</DetailRow>
            </dl>
          </Section>
        </aside>
      </div>

      <EditFindingDrawer open={editOpen} onOpenChange={setEditOpen} finding={finding} onSave={handleSave} />
    </div>
  )
}

export default FindingDetails