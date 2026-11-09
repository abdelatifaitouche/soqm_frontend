import { useState, useMemo, Fragment } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import {
  ArrowLeft, AlertCircle, Check, CircleDashed, FileSearch,
  Wrench, ClipboardCheck, CheckCircle2, AlertTriangle,
  ShieldAlert, ListChecks, Plus, Loader2, Calendar,
  ChevronLeft, ChevronRight, Pencil, Lightbulb, ArrowDown,
} from "lucide-react"
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
  SheetDescription, SheetFooter,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useFinding }         from "@/features/findings/hooks/useFinding"
import { useUpdateFinding }   from "@/features/findings/hooks/useUpdateFinding"
import { useDepts }           from "@/features/departments/hooks/useDept"
import { useActions }         from "@/features/findings/hooks/useActions"
import { useEmployeeOptions } from "@/features/employees/hooks/useEmployeeOptions"
import { createAction }       from "@/features/findings/api/actionsApi"
import RootCauseSection       from "@/features/findings/pages/RootCauseAnalysis"

// ── Config ────────────────────────────────────────────────────────────────────

const STATUS_FLOW = ["open", "under_assessment", "remediation_in_progress", "pending_verification", "closed"]

const STATUS_CONFIG = {
  open:                    { label: "Open",                    icon: CircleDashed,   cls: "bg-slate-100 text-slate-600 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700" },
  under_assessment:        { label: "Under assessment",        icon: FileSearch,     cls: "bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:ring-blue-900" },
  remediation_in_progress: { label: "Remediation in progress", icon: Wrench,         cls: "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:ring-amber-900" },
  pending_verification:    { label: "Pending verification",    icon: ClipboardCheck, cls: "bg-violet-50 text-violet-700 ring-violet-200 dark:bg-violet-950/30 dark:text-violet-400 dark:ring-violet-900" },
  closed:                  { label: "Closed",                  icon: CheckCircle2,   cls: "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:ring-emerald-900" },
}

const SEVERITY_CONFIG = {
  deficiency:             { label: "Deficiency",             icon: AlertCircle,   cls: "bg-yellow-50 text-yellow-800 ring-yellow-200 dark:bg-yellow-950/30 dark:text-yellow-400 dark:ring-yellow-900" },
  significant_deficiency: { label: "Significant deficiency", icon: AlertTriangle, cls: "bg-orange-50 text-orange-700 ring-orange-200 dark:bg-orange-950/30 dark:text-orange-400 dark:ring-orange-900" },
  material_deficiency:    { label: "Material deficiency",    icon: ShieldAlert,   cls: "bg-red-50 text-red-700 ring-red-200 dark:bg-red-950/30 dark:text-red-400 dark:ring-red-900" },
}

const ACTION_STATUS_CONFIG = {
  DRAFT:       { label: "Draft",       icon: CircleDashed, cls: "bg-slate-100 text-slate-600 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700", dot: "bg-muted text-muted-foreground" },
  IN_PROGRESS: { label: "In progress", icon: Wrench,       cls: "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:ring-amber-900", dot: "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400" },
  COMPLETED:   { label: "Completed",   icon: CheckCircle2, cls: "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:ring-emerald-900", dot: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400" },
}

const ACTION_FILTERS = [
  { value: "",            label: "All" },
  { value: "DRAFT",       label: "Draft" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "COMPLETED",   label: "Completed" },
]

const SOURCE_LABEL = {
  Gtar: "GTAR",
  external_quality_review: "External quality review",
  external_engagement_system_review: "External engagement system review",
  internal_quality_management_system_review: "Internal quality management system review",
  internal_engagement_review: "Internal engagement review",
  restatements: "Restatements",
  other_quality_events: "Other quality events",
}

const LONG_DESCRIPTION = 600

const FIELD_CLS =
  "w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition-shadow focus:border-ring focus:ring-3 focus:ring-ring/20 disabled:opacity-60"

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatLabel(str) {
  if (!str) return "—"
  return str.toLowerCase().replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase())
}

function parseDate(val) {
  if (!val) return null
  const d = new Date(/^\d{4}-\d{2}-\d{2}$/.test(val) ? `${val}T00:00:00` : val)
  return isNaN(d.getTime()) ? null : d
}

function fmtDate(val) {
  const d = parseDate(val)
  return d ? d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : null
}

function isOverdue(val) {
  const d = parseDate(val)
  if (!d) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return d < today
}

function personName(p) {
  if (!p) return null
  return `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() || null
}

function initials(name) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join("")
}

function extractError(err, fallback) {
  const detail = err?.response?.data?.detail
  if (typeof detail === "string") return detail
  if (Array.isArray(detail)) {
    const msg = detail.map((d) => d.msg).filter(Boolean).join(". ")
    if (msg) return msg
  }
  return fallback
}

function scrollToSection(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" })
}

// What the user should do next, based on the finding's lifecycle and the RCA progress.
function nextStep(status, rcaStatus) {
  if (status === "closed") return { done: true, text: "This finding is closed. Remediation has been carried out and verified." }
  if (status === "pending_verification") return { text: "Remediation is complete and awaiting verification.", target: "actions", targetLabel: "Review actions" }
  if (status === "remediation_in_progress") return { text: "Track the remediation actions through to completion.", target: "actions", targetLabel: "Go to actions" }
  if (rcaStatus === "not_started") return { text: "Start the root cause analysis to understand why this happened.", target: "rca", targetLabel: "Go to analysis" }
  if (rcaStatus === "in_progress") return { text: "Finish the root cause analysis, then plan remediation actions.", target: "rca", targetLabel: "Go to analysis" }
  return { text: "Root cause identified. Add remediation actions to address it.", target: "actions", targetLabel: "Go to actions" }
}

// ── Small components ──────────────────────────────────────────────────────────

function Pill({ cfg, size = "md" }) {
  const Icon = cfg.icon
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center gap-1.5 whitespace-nowrap rounded-full font-medium ring-1 ring-inset",
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs",
        cfg.cls
      )}
    >
      {Icon && <Icon className={size === "sm" ? "size-3" : "size-3.5"} />}
      {cfg.label}
    </span>
  )
}

function Avatar({ name, className }) {
  return (
    <span className={cn("flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary", className)}>
      {initials(name)}
    </span>
  )
}

function PropertyRow({ label, children }) {
  return (
    <div className="flex flex-col gap-1 py-3 first:pt-0 last:pb-0">
      <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words text-sm text-foreground">
        {children ?? <span className="text-muted-foreground">Not set</span>}
      </dd>
    </div>
  )
}

function ExpandableText({ text }) {
  const [expanded, setExpanded] = useState(false)
  const isLong = text.length > LONG_DESCRIPTION
  return (
    <div>
      <p className={cn("max-w-[72ch] whitespace-pre-line break-words text-sm leading-7 text-foreground/90", isLong && !expanded && "line-clamp-6")}>
        {text}
      </p>
      {isLong && (
        <button type="button" onClick={() => setExpanded((v) => !v)} className="mt-2 text-xs font-medium text-primary hover:underline">
          {expanded ? "Show less" : "Show more"}
        </button>
      )}
    </div>
  )
}

function StatusStepper({ status }) {
  const currentIdx = STATUS_FLOW.indexOf(status)
  const isClosed = status === "closed"

  return (
    <ol className="grid grid-cols-5">
      {STATUS_FLOW.map((step, idx) => {
        const done    = idx < currentIdx || isClosed
        const current = idx === currentIdx && !isClosed
        const isLast  = idx === STATUS_FLOW.length - 1
        return (
          <li key={step} className="relative flex flex-col items-center gap-2 text-center" aria-current={current ? "step" : undefined}>
            {!isLast && (
              <span className={cn("absolute left-1/2 top-3.5 h-0.5 w-full", idx < currentIdx ? "bg-primary" : "bg-border")} />
            )}
            <span
              className={cn(
                "relative z-10 flex size-7 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                done && "bg-primary text-primary-foreground",
                current && "bg-card text-primary ring-2 ring-primary",
                !done && !current && "bg-muted text-muted-foreground"
              )}
            >
              {done ? <Check className="size-3.5" strokeWidth={3} /> : idx + 1}
            </span>
            <span
              className={cn(
                "px-1 text-xs leading-tight",
                current ? "font-semibold text-foreground" : done ? "text-foreground/80" : "text-muted-foreground",
                !current && "hidden sm:block"
              )}
            >
              {STATUS_CONFIG[step].label}
            </span>
          </li>
        )
      })}
    </ol>
  )
}

function PageSkeleton() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-12" aria-busy="true">
      <div className="h-4 w-20 animate-pulse rounded bg-muted" />
      <div className="space-y-3">
        <div className="h-6 w-56 animate-pulse rounded-full bg-muted" />
        <div className="h-8 w-2/3 animate-pulse rounded bg-muted" />
      </div>
      <div className="h-32 animate-pulse rounded-xl border border-border bg-card" />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="space-y-6">
          <div className="h-40 animate-pulse rounded-xl border border-border bg-card" />
          <div className="h-56 animate-pulse rounded-xl border border-border bg-card" />
        </div>
        <div className="h-64 animate-pulse rounded-xl border border-border bg-card" />
      </div>
    </div>
  )
}

function ErrorState({ notFound, onBack }) {
  return (
    <div className="mx-auto flex min-h-64 max-w-md items-center justify-center py-12">
      <div className="w-full rounded-xl border border-border bg-card p-8 text-center">
        <div className="mx-auto flex size-11 items-center justify-center rounded-full bg-destructive/10">
          <AlertCircle className="size-5 text-destructive" />
        </div>
        <h2 className="mt-4 text-base font-semibold text-foreground">
          {notFound ? "Finding not found" : "Unable to load finding"}
        </h2>
        <p className="mx-auto mt-1.5 text-sm leading-relaxed text-muted-foreground">
          {notFound ? "It may have been removed, or the link is incorrect." : "Something went wrong. Refresh the page to try again."}
        </p>
        <Button variant="outline" size="lg" className="mt-6 px-4" onClick={onBack}>
          <ArrowLeft /> Back to findings
        </Button>
      </div>
    </div>
  )
}

// ── Edit finding drawer ───────────────────────────────────────────────────────

function EditFindingForm({ finding, onSave, onClose }) {
  const [title, setTitle]             = useState(finding.finding_title ?? "")
  const [source, setSource]           = useState(finding.finding_source ?? "")
  const [description, setDescription] = useState(finding.description ?? "")
  const [saving, setSaving]           = useState(false)
  const [submitted, setSubmitted]     = useState(false)
  const [error, setError]             = useState("")

  const cleanTitle       = title.trim()
  const cleanDescription = description.trim()
  const errors = {
    source:      !source ? "Select a source." : "",
    description: !cleanDescription ? "Describe what was found." : "",
  }
  const hasErrors = Object.values(errors).some(Boolean)

  const changes = {}
  if (cleanTitle !== (finding.finding_title ?? ""))     changes.finding_title  = cleanTitle
  if (source !== (finding.finding_source ?? ""))        changes.finding_source = source
  if (cleanDescription !== (finding.description ?? "")) changes.description    = cleanDescription
  const hasChanges = Object.keys(changes).length > 0

  const submit = async (e) => {
    e.preventDefault()
    setSubmitted(true)
    setError("")
    if (hasErrors) return
    if (!hasChanges) return onClose()
    setSaving(true)
    try {
      await onSave(changes)
      onClose()
    } catch (err) {
      setError(extractError(err, "Couldn't save the changes. Try again."))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} noValidate className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 space-y-5 overflow-y-auto px-4 py-2">
        <div className="space-y-1.5">
          <label htmlFor="finding-title" className="text-sm font-medium text-foreground">Title</label>
          <input
            id="finding-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={saving}
            placeholder="A short name for this finding"
            className={cn(FIELD_CLS, "h-10")}
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="finding-source" className="text-sm font-medium text-foreground">Source</label>
          <select
            id="finding-source"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            disabled={saving}
            aria-invalid={submitted && !!errors.source}
            className={cn(FIELD_CLS, "h-10 cursor-pointer", submitted && errors.source && "border-destructive")}
          >
            {!source && <option value="">Select a source</option>}
            {Object.entries(SOURCE_LABEL).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          {submitted && errors.source && <p className="text-xs text-destructive">{errors.source}</p>}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="finding-description" className="text-sm font-medium text-foreground">Description</label>
          <textarea
            id="finding-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={9}
            disabled={saving}
            aria-invalid={submitted && !!errors.description}
            className={cn(FIELD_CLS, "resize-y py-2 leading-relaxed", submitted && errors.description && "border-destructive")}
          />
          {submitted && errors.description && <p className="text-xs text-destructive">{errors.description}</p>}
        </div>

        <p className="text-xs leading-relaxed text-muted-foreground">Severity, department and status aren't changed here.</p>

        {error && (
          <div role="alert" className="flex items-start gap-2 rounded-lg bg-destructive/5 p-3 text-sm text-destructive">
            <AlertCircle className="mt-0.5 size-4 shrink-0" /> {error}
          </div>
        )}
      </div>

      <SheetFooter className="flex-row justify-end border-t border-border">
        <Button type="button" variant="ghost" size="lg" className="px-4" onClick={onClose} disabled={saving}>Cancel</Button>
        <Button type="submit" size="lg" className="px-4" disabled={saving || !hasChanges}>
          {saving && <Loader2 className="animate-spin" />}
          Save changes
        </Button>
      </SheetFooter>
    </form>
  )
}

function EditFindingDrawer({ open, onOpenChange, finding, onSave }) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Edit finding</SheetTitle>
          <SheetDescription>
            <span className="font-mono">{finding.finding_ref}</span> · Update the title, source or description.
          </SheetDescription>
        </SheetHeader>
        {open && <EditFindingForm finding={finding} onSave={onSave} onClose={() => onOpenChange(false)} />}
      </SheetContent>
    </Sheet>
  )
}

// ── Create action drawer ──────────────────────────────────────────────────────

function CreateActionForm({ findingId, onCreated, onClose }) {
  const [title, setTitle]         = useState("")
  const [date, setDate]           = useState("")
  const [ownerId, setOwnerId]     = useState("")
  const [saving, setSaving]       = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError]         = useState("")

  const { employee_options, employee_loading, employee_error } = useEmployeeOptions()

  const titleError = !title.trim() ? "Give the action a title." : ""

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitted(true)
    setError("")
    if (titleError) return
    setSaving(true)
    try {
      const res = await createAction(findingId, {
        title:                     title.trim(),
        finding_id:                findingId,
        estimated_completion_date: date || null,
        owner_id:                  ownerId || null,
      })
      onCreated(res?.data ?? res)
      onClose()
    } catch (err) {
      setError(extractError(err, "Failed to create the action."))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 space-y-5 overflow-y-auto px-4 py-2">
        <div className="space-y-1.5">
          <label htmlFor="action-title" className="text-sm font-medium text-foreground">Title</label>
          <input
            id="action-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={255}
            disabled={saving}
            autoFocus
            aria-invalid={submitted && !!titleError}
            placeholder="e.g. Update training programme for new standards"
            className={cn(FIELD_CLS, "h-10", submitted && titleError && "border-destructive")}
          />
          {submitted && titleError && <p className="text-xs text-destructive">{titleError}</p>}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="action-owner" className="text-sm font-medium text-foreground">Owner</label>
          <select
            id="action-owner"
            value={ownerId}
            onChange={(e) => setOwnerId(e.target.value)}
            disabled={saving || employee_loading}
            className={cn(FIELD_CLS, "h-10 cursor-pointer")}
          >
            <option value="">{employee_loading ? "Loading employees…" : "Unassigned"}</option>
            {(employee_options ?? []).map((emp) => (
              <option key={emp.id} value={emp.id}>
                {personName(emp) ?? "Unnamed"}{emp.job_title ? ` — ${emp.job_title}` : ""}
              </option>
            ))}
          </select>
          {employee_error && <p className="text-xs text-destructive">Could not load employees.</p>}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="action-date" className="text-sm font-medium text-foreground">Due date</label>
          <input
            id="action-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            disabled={saving}
            className={cn(FIELD_CLS, "h-10")}
          />
          <p className="text-xs text-muted-foreground">Optional. When the action is expected to be completed.</p>
        </div>

        {error && (
          <div role="alert" className="flex items-start gap-2 rounded-lg bg-destructive/5 p-3 text-sm text-destructive">
            <AlertCircle className="mt-0.5 size-4 shrink-0" /> {error}
          </div>
        )}
      </div>

      <SheetFooter className="flex-row justify-end border-t border-border">
        <Button type="button" variant="ghost" size="lg" className="px-4" onClick={onClose} disabled={saving}>Cancel</Button>
        <Button type="submit" size="lg" className="px-4" disabled={saving}>
          {saving ? <Loader2 className="animate-spin" /> : <Plus />}
          Create action
        </Button>
      </SheetFooter>
    </form>
  )
}

function CreateActionDrawer({ open, onOpenChange, findingId, onCreated }) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle>New action</SheetTitle>
          <SheetDescription>Add a remediation action for this finding.</SheetDescription>
        </SheetHeader>
        {open && <CreateActionForm findingId={findingId} onCreated={onCreated} onClose={() => onOpenChange(false)} />}
      </SheetContent>
    </Sheet>
  )
}

// ── Pagination ────────────────────────────────────────────────────────────────

function Pagination({ page, totalPages, onChange }) {
  const pages = useMemo(() => {
    const set = new Set([1, totalPages, page - 1, page, page + 1])
    return [...set].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b)
  }, [page, totalPages])

  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-between border-t border-border/60 px-5 py-3 sm:px-6">
      <p className="text-xs text-muted-foreground">Page {page} of {totalPages}</p>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon-sm" onClick={() => onChange(page - 1)} disabled={page <= 1} aria-label="Previous page">
          <ChevronLeft />
        </Button>
        {pages.map((p, i) => (
          <Fragment key={p}>
            {i > 0 && pages[i - 1] !== p - 1 && <span className="px-0.5 text-xs text-muted-foreground">…</span>}
            <Button
              variant={p === page ? "default" : "ghost"}
              size="icon-sm"
              onClick={() => onChange(p)}
              aria-current={p === page ? "page" : undefined}
              className="text-xs"
            >
              {p}
            </Button>
          </Fragment>
        ))}
        <Button variant="ghost" size="icon-sm" onClick={() => onChange(page + 1)} disabled={page >= totalPages} aria-label="Next page">
          <ChevronRight />
        </Button>
      </div>
    </div>
  )
}

// ── Action plans section ──────────────────────────────────────────────────────

function ActionRow({ action }) {
  const cfg       = ACTION_STATUS_CONFIG[action.status] ?? ACTION_STATUS_CONFIG.DRAFT
  const Icon      = cfg.icon
  const owner     = personName(action.owner)
  const completed = action.status === "COMPLETED"
  const due       = fmtDate(action.estimated_completion_date)
  const overdue   = !completed && isOverdue(action.estimated_completion_date)

  return (
    <li>
      <Link
        to={`/actions/${action.id}`}
        className="group flex items-center gap-3.5 px-5 py-3.5 transition-colors hover:bg-muted/40 focus-visible:bg-muted/40 focus-visible:outline-none sm:px-6"
      >
        <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-full", cfg.dot)}>
          <Icon className="size-4" />
        </span>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground transition-colors group-hover:text-primary" title={action.title}>
            {action.title || "Untitled action"}
          </p>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
            {completed && fmtDate(action.completion_date) ? (
              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="size-3" /> Completed {fmtDate(action.completion_date)}
              </span>
            ) : due ? (
              <span className={cn("inline-flex items-center gap-1", overdue && "font-medium text-red-600 dark:text-red-400")}>
                <Calendar className="size-3" /> {overdue ? "Overdue · " : "Due "}{due}
              </span>
            ) : (
              <span>No due date</span>
            )}
            <span className="sm:hidden">{cfg.label}</span>
          </div>
        </div>

        {owner ? (
          <span className="hidden max-w-40 shrink-0 items-center gap-2 md:flex" title={owner}>
            <Avatar name={owner} />
            <span className="truncate text-xs text-muted-foreground">{owner}</span>
          </span>
        ) : (
          <span className="hidden shrink-0 text-xs text-muted-foreground md:block">Unassigned</span>
        )}

        <span className="hidden sm:block">
          <Pill cfg={cfg} size="sm" />
        </span>

        <ChevronRight className="size-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
      </Link>
    </li>
  )
}

function ActionPlansSection({ findingId }) {
  const [page, setPage]             = useState(1)
  const [statusFilter, setStatus]   = useState("")
  const [createOpen, setCreateOpen] = useState(false)
  const [added, setAdded]           = useState(0) // created here since the last fetch
  const { items, total, totalPages, loading, error, setItems } = useActions(findingId, page, statusFilter)

  const shownTotal = total + added
  const showFilter = shownTotal > 0 || statusFilter !== ""

  const changeFilter = (value) => { setStatus(value); setPage(1); setAdded(0) }
  const changePage   = (value) => { setPage(value); setAdded(0) }

  const handleCreated = (newAction) => {
    if (!newAction) return
    if (!statusFilter || newAction.status === statusFilter) setItems((prev) => [newAction, ...prev])
    setAdded((n) => n + 1)
  }

  return (
    <>
      <section id="actions" className="scroll-mt-6 overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex flex-wrap items-start justify-between gap-3 px-5 pt-5 sm:px-6">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-foreground">
              Action plans
              {shownTotal > 0 && <span className="ml-1.5 font-normal text-muted-foreground">{shownTotal}</span>}
            </h2>
            <p className="mt-0.5 text-sm text-muted-foreground">Remediation actions that address this finding.</p>
          </div>
          {(shownTotal > 0 || statusFilter) && (
            <Button size="lg" className="shrink-0 px-3" onClick={() => setCreateOpen(true)}>
              <Plus /> Add action
            </Button>
          )}
        </div>

        {showFilter && (
          <div className="px-5 pt-4 sm:px-6">
            <div role="tablist" aria-label="Filter actions by status" className="inline-flex max-w-full overflow-x-auto rounded-lg bg-muted p-0.5">
              {ACTION_FILTERS.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  role="tab"
                  aria-selected={statusFilter === f.value}
                  onClick={() => changeFilter(f.value)}
                  className={cn(
                    "whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                    statusFilter === f.value
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {loading ? (
          <ul className="mt-4 divide-y divide-border/60 border-t border-border/60" aria-busy="true">
            {[1, 2, 3].map((i) => (
              <li key={i} className="flex items-center gap-3.5 px-5 py-3.5 sm:px-6">
                <span className="size-8 animate-pulse rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 w-1/2 animate-pulse rounded bg-muted" />
                  <div className="h-3 w-1/4 animate-pulse rounded bg-muted" />
                </div>
              </li>
            ))}
          </ul>
        ) : error ? (
          <div className="m-5 flex items-center justify-center gap-2 rounded-lg bg-destructive/5 py-8 text-sm text-destructive sm:m-6">
            <AlertCircle className="size-4" /> Failed to load actions. Refresh to try again.
          </div>
        ) : items.length === 0 ? (
          <div className="m-5 flex flex-col items-center gap-2 rounded-lg border border-dashed border-border px-6 py-10 text-center sm:m-6">
            <div className="flex size-10 items-center justify-center rounded-full bg-muted">
              <ListChecks className="size-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">
              {statusFilter ? "No matching actions" : "No action plans yet"}
            </p>
            <p className="max-w-xs text-xs leading-relaxed text-muted-foreground">
              {statusFilter
                ? "No actions have this status. Try another filter."
                : "Add remediation actions to address the root cause of this finding."}
            </p>
            {!statusFilter && (
              <Button size="lg" className="mt-2 px-4" onClick={() => setCreateOpen(true)}>
                <Plus /> Add first action
              </Button>
            )}
          </div>
        ) : (
          <>
            <ul className="mt-4 divide-y divide-border/60 border-t border-border/60">
              {items.map((action) => <ActionRow key={action.id} action={action} />)}
            </ul>
            <Pagination page={page} totalPages={totalPages} onChange={changePage} />
          </>
        )}
      </section>

      <CreateActionDrawer
        open={createOpen}
        onOpenChange={setCreateOpen}
        findingId={findingId}
        onCreated={handleCreated}
      />
    </>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

function FindingDetails() {
  const { id }   = useParams()
  const navigate = useNavigate()
  const { finding: fetched, loading, error } = useFinding(id)
  const { depts, loading: deptsLoading }     = useDepts()
  const { update }                           = useUpdateFinding(id)

  const [overrides, setOverrides] = useState({})
  const [editOpen, setEditOpen]   = useState(false)

  // Drop local edits whenever a fresh finding arrives from the API.
  const [syncedFinding, setSyncedFinding] = useState(fetched)
  if (fetched !== syncedFinding) {
    setSyncedFinding(fetched)
    setOverrides({})
  }

  if (loading) return <PageSkeleton />
  if (error || !fetched) return <ErrorState notFound={!error} onBack={() => navigate("/findings")} />

  const finding = { ...fetched, ...overrides }

  const handleSave = async (changes) => {
    await update(changes)
    setOverrides((prev) => ({ ...prev, ...changes, updated_at: new Date().toISOString() }))
  }

  const deptList  = Array.isArray(depts) ? depts : depts?.items ?? []
  const deptName  = deptList.find((d) => d.id === finding.department)?.name
  const status    = STATUS_CONFIG[finding.status] ?? { label: formatLabel(finding.status), icon: CircleDashed, cls: STATUS_CONFIG.open.cls }
  const severity  = finding.deficiency_severity
    ? SEVERITY_CONFIG[finding.deficiency_severity] ?? { label: formatLabel(finding.deficiency_severity), icon: AlertCircle, cls: SEVERITY_CONFIG.deficiency.cls }
    : null
  const rcaStatus = finding.root_cause_analysis?.cause_analysis_status ?? "not_started"
  const step      = nextStep(finding.status, rcaStatus)

  return (
    <main className="mx-auto max-w-6xl space-y-6 pb-16">
      <button
        type="button"
        onClick={() => navigate("/findings")}
        className="group inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
        Findings
      </button>

      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-muted px-2 py-1 font-mono text-xs font-medium text-muted-foreground">
              {finding.finding_ref}
            </span>
            <Pill cfg={status} />
            {severity && <Pill cfg={severity} />}
          </div>
          <h1 className="break-words text-2xl font-semibold leading-tight tracking-tight text-foreground">
            {finding.finding_title || finding.finding_ref || "Untitled finding"}
          </h1>
        </div>

        <Button variant="outline" size="lg" className="shrink-0 px-3.5" onClick={() => setEditOpen(true)}>
          <Pencil /> Edit
        </Button>
      </header>

      {/* Progress */}
      <section className="rounded-xl border border-border bg-card p-5 sm:p-6">
        <StatusStepper status={finding.status} />

        <div
          className={cn(
            "mt-5 flex flex-col gap-3 rounded-lg p-3.5 sm:flex-row sm:items-center sm:justify-between",
            step.done ? "bg-emerald-50 dark:bg-emerald-950/20" : "bg-muted/60"
          )}
        >
          <div className="flex min-w-0 items-start gap-2.5">
            {step.done ? (
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <Lightbulb className="mt-0.5 size-4 shrink-0 text-primary" />
            )}
            <p className={cn("text-sm leading-relaxed", step.done ? "text-emerald-800 dark:text-emerald-300" : "text-foreground")}>
              {step.text}
            </p>
          </div>
          {step.target && (
            <Button variant="outline" size="lg" className="shrink-0 px-3" onClick={() => scrollToSection(step.target)}>
              {step.targetLabel} <ArrowDown />
            </Button>
          )}
        </div>
      </section>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        {/* Main column */}
        <div className="min-w-0 space-y-6">
          <section className="rounded-xl border border-border bg-card p-5 sm:p-6">
            <h2 className="mb-3 text-base font-semibold text-foreground">Description</h2>
            {finding.description ? (
              <ExpandableText text={finding.description} />
            ) : (
              <p className="text-sm italic text-muted-foreground">No description provided.</p>
            )}
          </section>

          <div id="rca" className="scroll-mt-6">
            <RootCauseSection
              rca={finding.root_cause_analysis}
              findingId={finding.id}
              onSaved={(rca) => setOverrides((prev) => ({ ...prev, root_cause_analysis: rca }))}
            />
          </div>

          <ActionPlansSection findingId={finding.id} />
        </div>

        {/* Properties sidebar */}
        <aside className="rounded-xl border border-border bg-card p-5 lg:sticky lg:top-6">
          <h2 className="mb-4 text-sm font-semibold text-foreground">Details</h2>
          <dl className="divide-y divide-border/60">
            <PropertyRow label="Source">
              {finding.finding_source ? SOURCE_LABEL[finding.finding_source] ?? formatLabel(finding.finding_source) : null}
            </PropertyRow>
            <PropertyRow label="Department">
              {deptName ?? <span className="text-muted-foreground">{deptsLoading ? "Loading…" : "Unknown department"}</span>}
            </PropertyRow>
            <PropertyRow label="Identified">{fmtDate(finding.created_at)}</PropertyRow>
            <PropertyRow label="Last updated">{fmtDate(finding.updated_at)}</PropertyRow>
          </dl>
        </aside>
      </div>

      <EditFindingDrawer open={editOpen} onOpenChange={setEditOpen} finding={finding} onSave={handleSave} />
    </main>
  )
}

export default FindingDetails
