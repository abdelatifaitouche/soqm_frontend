import { useState, useMemo, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useRisk } from "@/features/risks/hooks/useRisk"
import { useRole } from "@/features/auth/hooks/useRole"
import { useRiskResponses } from "@/features/risks/hooks/useRiskResponses"
import {
  updateRisk,
  deleteRisk,
  fetchComponentResponses,
  addResponseToRisk,
  removeResponseFromRisk,
} from "@/features/risks/api/riskApi"
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
  ArrowRight,
  Check,
  Eye,
  UserRound,
  Repeat,
  ChevronLeft,
  ChevronRight,
  Plus,
  ShieldCheck,
  AlertTriangle,
  CircleDashed,
  Rocket,
  ClipboardCheck,
  CheckCircle2,
  Archive,
  Hand,
  Bot,
  Blend,
  Layers,
  Unlink,
} from "lucide-react"

import ObjectivesSection from "@/features/risks/components/ObjectiveSection"

// ============================================================
// CONSTANTS
// ============================================================

const LEVEL_LABELS = { 1: "Low", 2: "Medium", 3: "High" }

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

function getZone(significance, occurrence) {
  const score = significance * occurrence
  if (score >= 6) return "critical"
  if (score >= 3) return "high"
  return "low"
}

// Zone tokens. `cell` = resting tint in the matrix, `cellActive` = where this risk sits.
const ZONE = {
  critical: {
    label: "Critical",
    dot: "bg-red-500",
    bar: "bg-red-500",
    text: "text-red-600 dark:text-red-400",
    cell: "bg-red-500/10 text-red-700/60 dark:text-red-300/50",
    cellActive: "bg-red-500 text-white",
  },
  high: {
    label: "High",
    dot: "bg-amber-500",
    bar: "bg-amber-500",
    text: "text-amber-600 dark:text-amber-400",
    cell: "bg-amber-500/10 text-amber-700/60 dark:text-amber-300/50",
    cellActive: "bg-amber-500 text-white",
  },
  low: {
    label: "Low",
    dot: "bg-emerald-500",
    bar: "bg-emerald-500",
    text: "text-emerald-600 dark:text-emerald-400",
    cell: "bg-emerald-500/10 text-emerald-700/60 dark:text-emerald-300/50",
    cellActive: "bg-emerald-500 text-white",
  },
}

// Date-only strings ("2027-01-01") are parsed as local midnight so they never
// shift a day in negative-offset time zones.
function parseDate(str) {
  if (!str) return null
  return new Date(/^\d{4}-\d{2}-\d{2}$/.test(str) ? `${str}T00:00:00` : str)
}

function formatDate(str) {
  const d = parseDate(str)
  if (!d) return "—"
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
}

function daysUntil(str) {
  const d = parseDate(str)
  if (!d) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.round((d - today) / 86400000)
}

// Generic label fallback for anything not covered by a config map below.
function formatLabel(str) {
  if (!str) return "—"
  return str.toLowerCase().replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

const SELECT_CLS =
  "h-9 rounded-lg border border-input bg-card px-3 text-xs text-foreground outline-none focus:ring-2 focus:ring-[#7B3FBE] transition-colors cursor-pointer"

const FIELD_CLS =
  "w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-[#7B3FBE]"

// Matches backend ResponseType enum
const RESPONSE_TYPE_CONFIG = {
  DETECTIVE: {
    label: "Detective",
    icon: Eye,
    chip: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900",
  },
  PREVENTIVE: {
    label: "Preventive",
    icon: ShieldCheck,
    chip: "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/30 dark:text-violet-400 dark:border-violet-900",
  },
  CORRECTIVE: {
    label: "Corrective",
    icon: AlertTriangle,
    chip: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900",
  },
}

// Matches backend response status enum
const STATUS_CONFIG = {
  DRAFT:       { label: "Draft",       icon: CircleDashed,   pill: "bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-900/40 dark:text-slate-400 dark:border-slate-800" },
  PLANNED:     { label: "Planned",     icon: Rocket,         pill: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/30 dark:text-sky-400 dark:border-sky-900" },
  IMPLEMENTED: { label: "Implemented", icon: ClipboardCheck, pill: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900" },
  EFFECTIVE:   { label: "Effective",   icon: CheckCircle2,   pill: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900" },
  RETIRED:     { label: "Retired",     icon: Archive,        pill: "bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900" },
}

// Matches backend ExecutionType enum
const EXECUTION_CONFIG = {
  MANUAL:    { label: "Manual",    icon: Hand,  pill: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-900/40 dark:text-slate-400 dark:border-slate-800" },
  AUTOMATED: { label: "Automated", icon: Bot,   pill: "bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/30 dark:text-cyan-400 dark:border-cyan-900" },
  HYBRID:    { label: "Hybrid",    icon: Blend, pill: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/30 dark:text-indigo-400 dark:border-indigo-900" },
}

// Matches backend Frequency enum
const FREQUENCY_LABEL = {
  continuous: "Continuous",
  daily: "Daily",
  weekly: "Weekly",
  biweekly: "Biweekly",
  monthly: "Monthly",
  bimonthly: "Bimonthly",
  quarterly: "Quarterly",
  semiannually: "Semiannually",
  annually: "Annually",
  ad_hoc: "Ad hoc",
  event_driven: "Event driven",
}

const RESPONSE_STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  ...Object.entries(STATUS_CONFIG).map(([value, cfg]) => ({ value, label: cfg.label })),
]

const PILL_BASE = "inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full border"

function ResponseStatusPill({ status }) {
  const cfg = STATUS_CONFIG[status] ?? { label: formatLabel(status), icon: CircleDashed, pill: "bg-slate-100 text-slate-500 border-slate-200" }
  const Icon = cfg.icon
  return (
    <span className={`${PILL_BASE} ${cfg.pill}`}>
      <Icon className="size-3" />
      {cfg.label}
    </span>
  )
}

function ResponseTypeChip({ type }) {
  const cfg = RESPONSE_TYPE_CONFIG[type] ?? { label: formatLabel(type), icon: CircleDashed, chip: "bg-slate-100 text-slate-500 border-slate-200" }
  const Icon = cfg.icon
  return (
    <span className={`${PILL_BASE} ${cfg.chip}`}>
      <Icon className="size-3" />
      {cfg.label}
    </span>
  )
}

function ExecutionChip({ type }) {
  const cfg = EXECUTION_CONFIG[type] ?? { label: formatLabel(type), icon: Hand, pill: "bg-slate-100 text-slate-500 border-slate-200" }
  const Icon = cfg.icon
  return (
    <span className={`${PILL_BASE} ${cfg.pill}`}>
      <Icon className="size-3" />
      {cfg.label}
    </span>
  )
}

function frequencyLabel(freq) {
  return FREQUENCY_LABEL[(freq || "").toLowerCase()] ?? formatLabel(freq)
}

// ============================================================
// SECTION SHELL
// ============================================================

function Section({ title, count, action, children, className = "" }) {
  return (
    <section className={`rounded-xl border border-border bg-card ${className}`}>
      <div className="flex items-center justify-between gap-3 px-5 pt-4 pb-3">
        <h2 className="text-sm font-semibold text-foreground">
          {title}
          {count ? <span className="ml-1.5 font-normal text-muted-foreground">{count}</span> : null}
        </h2>
        {action}
      </div>
      <div className="px-5 pb-5">{children}</div>
    </section>
  )
}

// ============================================================
// LEVEL METER — quiet three-segment indicator for a 1–3 rating
// ============================================================

function LevelMeter({ label, level, barClass }) {
  return (
    <div className="flex items-center gap-4" role="img" aria-label={`${label}: ${LEVEL_LABELS[level]}`}>
      <span className="w-24 text-sm text-muted-foreground">{label}</span>
      <div className="flex gap-1.5">
        {[1, 2, 3].map((n) => (
          <span
            key={n}
            className={`h-1.5 w-9 rounded-full transition-colors ${n <= level ? barClass : "bg-border"}`}
          />
        ))}
      </div>
      <span className="w-16 text-sm font-medium text-foreground">{LEVEL_LABELS[level]}</span>
    </div>
  )
}

// ============================================================
// WORKFLOW STEPPER
// ============================================================

function WorkflowStepper({ status }) {
  const isSideState = status === "accepted" || status === "under_review"
  const currentIndex = MAIN_FLOW.indexOf(status)
  const effectiveIndex =
    status === "accepted" ? MAIN_FLOW.length - 1 : status === "under_review" ? 1 : currentIndex

  return (
    <div className="space-y-3">
      <ol className="flex">
        {MAIN_FLOW.map((step, i) => {
          const isLast = i === MAIN_FLOW.length - 1
          const done = i < effectiveIndex
          const active = i === effectiveIndex
          const label = isLast && status === "accepted" ? "Accepted" : STATUS_LABEL[step]

          return (
            <li key={step} className="relative flex-1 flex flex-col items-center gap-2" aria-current={active ? "step" : undefined}>
              {!isLast && (
                <span
                  className={`absolute top-[9px] left-1/2 w-full h-0.5 rounded-full ${done ? "bg-[#3B1F6A]" : "bg-border"}`}
                />
              )}
              <span
                className={`relative z-10 flex items-center justify-center size-[20px] rounded-full border-2 transition-colors ${
                  done
                    ? "bg-[#3B1F6A] border-[#3B1F6A] text-white"
                    : active
                      ? "bg-card border-[#3B1F6A] ring-4 ring-[#EDE9F8] dark:ring-violet-500/15"
                      : "bg-card border-border"
                }`}
              >
                {done && <Check className="size-3" strokeWidth={3} />}
                {active && <span className="size-2 rounded-full bg-[#3B1F6A] dark:bg-[#7B3FBE]" />}
              </span>
              <span
                className={`text-xs text-center leading-tight px-1 ${
                  active
                    ? "font-semibold text-[#3B1F6A] dark:text-[#a67be0]"
                    : done
                      ? "text-foreground/70"
                      : "text-muted-foreground/70"
                }`}
              >
                {label}
              </span>
            </li>
          )
        })}
      </ol>

      {isSideState && (
        <p className="text-xs text-muted-foreground text-center">
          Currently marked as <span className="font-medium text-foreground">{STATUS_LABEL[status]}</span>
        </p>
      )}
    </div>
  )
}

// ============================================================
// KEY DATES
// ============================================================

function ReviewBadge({ date }) {
  const d = daysUntil(date)
  if (d === null) return null
  if (d < 0)
    return <span className="text-[11px] font-medium text-red-600 dark:text-red-400">Overdue by {Math.abs(d)}d</span>
  if (d === 0)
    return <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400">Due today</span>
  if (d <= 30)
    return <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400">In {d}d</span>
  return <span className="text-[11px] text-muted-foreground">In {d}d</span>
}

function DateRow({ label, value, extra }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-2.5 border-b border-border/60 last:border-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm text-foreground flex items-baseline gap-2">
        {extra}
        <span className={value ? "" : "text-muted-foreground"}>{formatDate(value)}</span>
      </dd>
    </div>
  )
}

// ============================================================
// COMPONENT HOVER CARD
// ============================================================

function ComponentHoverCard({ component }) {
  return (
    <div className="group relative">
      <div className="flex items-center gap-3 cursor-default">
        <div className="flex items-center justify-center size-8 rounded-lg bg-[#EDE9F8] dark:bg-accent shrink-0">
          <Layers className="size-4 text-[#7B3FBE]" />
        </div>
        <p className="text-sm font-medium text-foreground truncate flex-1">{component.name}</p>
        <Eye className="size-3.5 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors shrink-0" />
      </div>

      <div className="absolute left-0 top-full mt-2 w-72 max-w-[calc(100vw-3rem)] z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible group-focus-within:opacity-100 group-focus-within:visible transition-all duration-150">
        <div className="bg-card border border-border rounded-lg shadow-lg p-4">
          <p className="text-sm font-semibold text-foreground mb-1.5">{component.name}</p>
          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-4">
            {component.description || "No description"}
          </p>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// RESPONSES SECTION
// ============================================================

function TablePagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null

  const set = new Set([1, totalPages, page - 1, page, page + 1])
  const pages = [...set].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b)

  return (
    <div className="flex items-center justify-center gap-1 py-3 border-t border-border">
      <button
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        aria-label="Previous page"
        className="flex items-center justify-center size-8 rounded-lg border border-input bg-card text-muted-foreground hover:text-foreground hover:bg-muted/40 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronLeft className="size-3.5" />
      </button>

      {pages.map((p, i) => {
        const prev = pages[i - 1]
        const gap = prev !== undefined && p - prev > 1
        return (
          <span key={p} className="flex items-center">
            {gap && <span className="px-1.5 text-xs text-muted-foreground/50">…</span>}
            <button
              onClick={() => onChange(p)}
              aria-current={p === page ? "page" : undefined}
              className={`flex items-center justify-center size-8 rounded-lg text-xs font-semibold transition-colors ${
                p === page
                  ? "bg-[#3B1F6A] text-white"
                  : "border border-input bg-card text-muted-foreground hover:text-foreground hover:bg-muted/40"
              }`}
            >
              {p}
            </button>
          </span>
        )
      })}

      <button
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        aria-label="Next page"
        className="flex items-center justify-center size-8 rounded-lg border border-input bg-card text-muted-foreground hover:text-foreground hover:bg-muted/40 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronRight className="size-3.5" />
      </button>
    </div>
  )
}

// ------------------------------------------------------------
// Add-response drawer
// ------------------------------------------------------------

const DRAWER_PAGE_SIZE = 10

function AddResponseDrawer({ open, onOpenChange, riskId, componentId, linkedIds, onAdded }) {
  const [page, setPage] = useState(1)
  const [data, setData] = useState({ items: [], total: 0, size: DRAWER_PAGE_SIZE })
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState("")
  const [reloadKey, setReloadKey] = useState(0)
  const [addingId, setAddingId] = useState(null)
  const [addError, setAddError] = useState("")
  const [addedIds, setAddedIds] = useState(() => new Set()) // linked during this drawer session

  useEffect(() => {
    if (!open || !componentId) return
    let cancelled = false
    setLoading(true)
    setLoadError("")
    fetchComponentResponses(componentId, { page, size: DRAWER_PAGE_SIZE })
      .then((res) => {
        if (cancelled) return
        setData({
          items: res?.items ?? [],
          total: res?.total ?? 0,
          size: res?.size ?? DRAWER_PAGE_SIZE,
        })
      })
      .catch(() => { if (!cancelled) setLoadError("Couldn’t load responses. Try again.") })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [open, page, reloadKey, componentId])

  const handleOpenChange = (val) => {
    if (!val) {
      setPage(1)
      setAddError("")
      setAddedIds(new Set())
    }
    onOpenChange(val)
  }

  const handleAdd = async (response) => {
    setAddingId(response.id)
    setAddError("")
    try {
      await addResponseToRisk(riskId, response.id)
      setAddedIds((s) => new Set(s).add(response.id))
      onAdded(response)
    } catch (err) {
      setAddError(err?.response?.data?.detail ?? "Couldn’t link this response. Try again.")
    } finally {
      setAddingId(null)
    }
  }

  const items = data.items
  const totalPages = Math.max(1, Math.ceil((data.total ?? 0) / (data.size || DRAWER_PAGE_SIZE)))

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className="sm:max-w-lg flex flex-col">
        <SheetHeader>
          <SheetTitle>Add existing response</SheetTitle>
          <SheetDescription>
            Responses from this risk’s component. Pick one to link it to this risk.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 py-2">
          {addError && (
            <div className="flex items-center gap-2 text-xs text-red-600 mb-3">
              <AlertCircle className="size-3.5 shrink-0" />
              {addError}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              <span className="text-sm">Loading responses…</span>
            </div>
          ) : loadError ? (
            <div className="flex flex-col items-center gap-2 py-16">
              <p className="text-sm text-destructive">{loadError}</p>
              <button
                onClick={() => setReloadKey((k) => k + 1)}
                className="text-xs font-medium text-[#7B3FBE] hover:underline"
              >
                Retry
              </button>
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-16 text-center">
              <div className="flex size-10 items-center justify-center rounded-xl bg-muted">
                <ShieldCheck className="size-4 text-muted-foreground/40" />
              </div>
              <p className="text-sm text-muted-foreground">No responses found for this component.</p>
            </div>
          ) : (
            <ul className="divide-y divide-border/60">
              {items.map((r) => {
                const adding = addingId === r.id
                const linked = linkedIds.has(r.id) || addedIds.has(r.id)
                return (
                  <li key={r.id} className={`flex items-start gap-3 py-3.5 ${linked ? "opacity-70" : ""}`}>
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] font-semibold text-[#7B3FBE] bg-[#EDE9F8] dark:bg-accent dark:text-foreground px-2 py-0.5 rounded-md font-mono">
                          {r.response_ref}
                        </span>
                        <ResponseStatusPill status={r.status} />
                        <ResponseTypeChip type={r.response_type} />
                      </div>
                      <p className="text-sm text-foreground/90 leading-snug line-clamp-2">
                        {r.response_name || <span className="italic text-muted-foreground">Untitled response</span>}
                      </p>
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Repeat className="size-3" />
                          {frequencyLabel(r.frequency)}
                        </span>
                        <ExecutionChip type={r.execution_type} />
                        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                          <UserRound className="size-3" />
                          {r.owner ? `${r.owner.first_name} ${r.owner.last_name}` : "Unassigned"}
                        </span>
                      </div>
                    </div>

                    {linked ? (
                      <span className="shrink-0 flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 text-emerald-600 dark:text-emerald-400">
                        <Check className="size-3.5" /> Linked
                      </span>
                    ) : (
                      <button
                        onClick={() => handleAdd(r)}
                        disabled={addingId !== null}
                        className="shrink-0 flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-border bg-card hover:bg-muted text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {adding ? <Loader2 className="size-3 animate-spin" /> : <Plus className="size-3" />}
                        Add
                      </button>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-xs text-muted-foreground">Page {page} of {totalPages}</p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => p - 1)}
                disabled={page <= 1 || loading}
                aria-label="Previous page"
                className="flex size-7 items-center justify-center rounded-md border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="size-3.5" />
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= totalPages || loading}
                aria-label="Next page"
                className="flex size-7 items-center justify-center rounded-md border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="size-3.5" />
              </button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

// ------------------------------------------------------------
// Responses section
// ------------------------------------------------------------

function ResponsesSection({ riskId, componentId }) {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState("")

  const filters = useMemo(() => ({ ...(status && { status }) }), [status])
  const orderBy = useMemo(() => ({ order_by: "created_at", direction: "desc" }), [])

  // NOTE: useRiskResponses must return a `refetch` function (see README note in chat)
  const { responses, total, totalPages, loading, error, refetch } = useRiskResponses(
    riskId,
    filters,
    page,
    orderBy
  )

  // Add
  const [addOpen, setAddOpen] = useState(false)
  const linkedIds = useMemo(() => new Set((responses ?? []).map((r) => r.id)), [responses])
  const canAdd = !!componentId

  // Remove
  const [responseToRemove, setResponseToRemove] = useState(null)
  const [removing, setRemoving] = useState(false)
  const [removeError, setRemoveError] = useState("")

  const openRemove = (response) => {
    setRemoveError("")
    setResponseToRemove(response)
  }

  const closeRemove = (open) => {
    if (open || removing) return // don't close mid-request
    setResponseToRemove(null)
    setRemoveError("")
  }

  const handleRemove = async (e) => {
    e.preventDefault() // keep the dialog open until the request settles
    if (!responseToRemove) return
    setRemoving(true)
    setRemoveError("")
    try {
      await removeResponseFromRisk(riskId, responseToRemove.id)
      setResponseToRemove(null)
      // Removed the last row of a later page → step back instead of showing an empty page
      if (responses.length === 1 && page > 1) setPage((p) => p - 1)
      else refetch()
    } catch (err) {
      setRemoveError(err?.response?.data?.detail ?? "Couldn’t remove this response. Try again.")
    } finally {
      setRemoving(false)
    }
  }

  const addResponse = () => setAddOpen(true)
  const createResponse = () => navigate(`/responses/create?risk_id=${riskId}`)

  return (
    <>
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-wrap gap-3">
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              Responses
              {total ? <span className="ml-1.5 font-normal text-muted-foreground">{total}</span> : null}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">Treatment responses recorded for this risk</p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1) }}
              aria-label="Filter responses by status"
              className={SELECT_CLS}
            >
              {RESPONSE_STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>

            <button
              onClick={addResponse}
              disabled={!canAdd}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg border border-border bg-card hover:bg-muted text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="size-3.5" /> Add existing
            </button>

            <button
              onClick={createResponse}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg bg-[#3B1F6A] hover:bg-[#52298F] text-white transition-colors"
            >
              <Plus className="size-3.5" /> New response
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /><span className="text-sm">Loading responses…</span>
          </div>
        ) : error ? (
          <div className="py-12 text-center text-destructive text-sm">Couldn’t load responses. Refresh to try again.</div>
        ) : !responses?.length ? (
          <div className="py-14 text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              {status ? "No responses match this filter." : "No responses yet. Add one to start treating this risk."}
            </p>
            {!status && (
              <button
                onClick={addResponse}
                disabled={!canAdd}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-[#7B3FBE] hover:underline mt-1 disabled:opacity-50"
              >
                <Plus className="size-3.5" /> Add existing response
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px]">
                <thead>
                  <tr className="border-b border-border bg-muted/20">
                    {["Ref", "Name", "Status", "Type", "Frequency", "Execution", "Owner", ""].map((h, i) => (
                      <th key={i} className="text-left text-xs font-medium text-muted-foreground px-4 py-3">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {responses.map((r) => (
                    <tr
                      key={r.id}
                      onClick={() => navigate(`/responses/${r.id}`)}
                      className="group cursor-pointer border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors"
                    >
                      <td className="px-4 py-3.5">
                        <span className="text-[11px] font-semibold text-[#7B3FBE] bg-[#EDE9F8] dark:bg-accent dark:text-foreground px-2 py-0.5 rounded-md font-mono">
                          {r.response_ref}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 max-w-[200px]">
                        <span className="text-sm text-foreground truncate block" title={r.response_name || ""}>
                          {r.response_name || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5"><ResponseStatusPill status={r.status} /></td>
                      <td className="px-4 py-3.5"><ResponseTypeChip type={r.response_type} /></td>
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Repeat className="size-3" />
                          {frequencyLabel(r.frequency)}
                        </span>
                      </td>
                      <td className="px-4 py-3.5"><ExecutionChip type={r.execution_type} /></td>
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                          <UserRound className="size-3" />
                          {r.owner ? `${r.owner.first_name} ${r.owner.last_name}` : "Unassigned"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 w-px">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Always visible at low contrast so it works on touch devices too */}
                          <button
                            onClick={(e) => { e.stopPropagation(); openRemove(r) }}
                            aria-label={`Remove response ${r.response_ref} from this risk`}
                            title="Remove from risk"
                            className="flex size-8 items-center justify-center rounded-lg text-muted-foreground/50 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 focus-visible:text-red-600 transition-colors"
                          >
                            <Unlink className="size-3.5" />
                          </button>
                          <ArrowRight className="size-4 text-muted-foreground/30 group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <TablePagination page={page} totalPages={totalPages} onChange={setPage} />
          </>
        )}
      </div>

      <AddResponseDrawer
        open={addOpen}
        onOpenChange={setAddOpen}
        riskId={riskId}
        componentId={componentId}
        linkedIds={linkedIds}
        onAdded={refetch}
      />

      <AlertDialog open={!!responseToRemove} onOpenChange={(open) => !open && closeRemove(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove response from this risk?</AlertDialogTitle>
            <AlertDialogDescription>
              Response <span className="font-mono font-semibold">{responseToRemove?.response_ref}</span> will be
              unlinked from this risk. The response itself isn’t deleted and can be linked again later.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {removeError && (
            <div className="flex items-center gap-2 text-xs text-red-600">
              <AlertCircle className="size-3.5 shrink-0" />
              {removeError}
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={removing}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemove} disabled={removing} className="bg-red-600 hover:bg-red-700">
              {removing && <Loader2 className="size-4 animate-spin mr-2" />}
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

// ============================================================
// EDIT DRAWER
// ============================================================

function EditDrawer({ open, onOpenChange, risk, onSaved }) {
  const [form, setForm] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  if (open && !form) {
    setForm({
      risk_description: risk.risk_description ?? "",
      risk_rational: risk.risk_rational ?? "",
      significance: risk.significance,
      occurence: risk.occurence,
      next_review_date: risk.next_review_date ?? "",
    })
  }

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const handleClose = (val) => {
    if (!val) {
      setForm(null)
      setError("")
    }
    onOpenChange(val)
  }

  const handleSave = async () => {
    setSaving(true)
    setError("")
    try {
      const res = await updateRisk(risk.id, {
        risk_description: form.risk_description,
        risk_rational: form.risk_rational,
        significance: Number(form.significance),
        occurence: Number(form.occurence),
        next_review_date: form.next_review_date || null,
      })
      onSaved(res)
      handleClose(false)
    } catch (err) {
      setError(err?.response?.data?.detail ?? "Couldn’t save changes. Check the fields and try again.")
    } finally {
      setSaving(false)
    }
  }

  if (!form) return null

  const previewZone = ZONE[getZone(Number(form.significance), Number(form.occurence))]
  const previewScore = Number(form.significance) * Number(form.occurence)

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent className="sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle className="font-mono">{risk.risk_ref}</SheetTitle>
          <SheetDescription>Update risk assessment details</SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 space-y-5 py-2">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Description</label>
            <textarea
              value={form.risk_description}
              onChange={set("risk_description")}
              rows={4}
              className={`${FIELD_CLS} resize-none`}
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Rationale</label>
            <textarea
              value={form.risk_rational}
              onChange={set("risk_rational")}
              rows={4}
              placeholder="Why was this risk rated the way it was?"
              className={`${FIELD_CLS} resize-none`}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Significance</label>
              <select value={form.significance} onChange={set("significance")} className={FIELD_CLS}>
                {[1, 2, 3].map((v) => (
                  <option key={v} value={v}>{v} — {LEVEL_LABELS[v]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Occurrence</label>
              <select value={form.occurence} onChange={set("occurence")} className={FIELD_CLS}>
                {[1, 2, 3].map((v) => (
                  <option key={v} value={v}>{v} — {LEVEL_LABELS[v]}</option>
                ))}
              </select>
            </div>
          </div>

          <p className="flex items-center gap-2 text-xs text-muted-foreground -mt-2">
            <span className={`size-1.5 rounded-full ${previewZone.dot}`} />
            Score {previewScore} · <span className={`font-medium ${previewZone.text}`}>{previewZone.label}</span>
          </p>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Next review</label>
            <input type="date" value={form.next_review_date || ""} onChange={set("next_review_date")} className={FIELD_CLS} />
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
            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#3B1F6A] rounded-md hover:bg-[#52298F] transition-colors disabled:opacity-60"
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
  const [deleteError, setDeleteError] = useState("")

  const handleDelete = async (e) => {
    e.preventDefault() // keep the dialog open until the request finishes
    setDeleting(true)
    setDeleteError("")
    try {
      await deleteRisk(id)
      navigate("/risks")
    } catch (err) {
      setDeleteError(err?.response?.data?.detail ?? "Couldn’t delete this risk. Try again.")
    } finally {
      setDeleting(false)
    }
  }

  if (loading)
    return (
      <div className="flex items-center justify-center h-64 gap-2 text-muted-foreground">
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
      <div className="max-w-6xl mx-auto space-y-6 pb-16">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate("/risks")}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="size-4" />
            Risks
          </button>

          {isAdmin && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setEditOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
              >
                <Pencil className="size-3.5" />
                Edit
              </button>
              <button
                onClick={() => setDeleteOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-md transition-colors"
              >
                <Trash2 className="size-3.5" />
                Delete
              </button>
            </div>
          )}
        </div>

        {/* Masthead: identity on the left, the matrix on the right */}
        <header className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-8 p-6 sm:p-8">
            <div className="min-w-0">
              <p className="text-sm text-muted-foreground mb-1">Risk</p>
              <h1 className="text-5xl font-semibold tracking-tight text-foreground font-mono leading-none mb-5">
                {risk.risk_ref}
              </h1>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-6">
                <span
                  className={`inline-flex items-center gap-2 text-sm font-medium px-3 py-1 rounded-full bg-muted/60 ${z.text}`}
                >
                  <span className={`size-2 rounded-full ${z.dot}`} />
                  {z.label} risk
                </span>
                <span className="text-sm text-foreground/80">{STATUS_LABEL[risk.status]}</span>
              </div>

              <dl className="flex gap-8">
                <div>
                  <dt className="text-xs text-muted-foreground mb-1">Inherent score</dt>
                  <dd className={`text-3xl font-semibold tabular-nums leading-none ${z.text}`}>
                    {risk.score}
                    <span className="text-sm font-normal text-muted-foreground"> / 9</span>
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground mb-1">Residual score</dt>
                  <dd
                    className={`text-3xl font-semibold tabular-nums leading-none ${
                      risk.residual_score != null ? "text-foreground" : "text-muted-foreground/50"
                    }`}
                  >
                    {risk.residual_score ?? "—"}
                  </dd>
                  {risk.residual_score == null && (
                    <p className="text-[11px] text-muted-foreground mt-1.5">Not assessed yet</p>
                  )}
                </div>
              </dl>
            </div>

            <div className="shrink-0 self-start sm:self-center space-y-4 sm:pl-8 sm:border-l sm:border-border/70">
              <LevelMeter label="Significance" level={risk.significance} barClass={z.bar} />
              <LevelMeter label="Occurrence" level={risk.occurence} barClass={z.bar} />
            </div>
          </div>

          <div className="border-t border-border bg-muted/20 px-6 sm:px-8 py-5">
            <WorkflowStepper status={risk.status} />
          </div>
        </header>

        {/* Content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 items-start">
          {/* Left: the written case for this risk */}
          <div className="space-y-6">
            <Section title="Description">
              <p className="text-[15px] text-foreground/90 leading-7 max-w-[68ch] whitespace-pre-line">
                {risk.risk_description || (
                  <span className="italic text-muted-foreground">No description provided</span>
                )}
              </p>
            </Section>

            <Section title="Rationale">
              {risk.risk_rational ? (
                <p className="text-[15px] text-foreground/90 leading-7 max-w-[68ch] whitespace-pre-line border-l-2 border-[#7B3FBE]/60 pl-4">
                  {risk.risk_rational}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  No rationale recorded. Explain why this risk is rated {LEVEL_LABELS[risk.significance].toLowerCase()} significance
                  and {LEVEL_LABELS[risk.occurence].toLowerCase()} occurrence.
                </p>
              )}
            </Section>
          </div>

          {/* Right: facts and links */}
          <aside className="space-y-6">
            <Section title="Key dates">
              <dl className="-my-1">
                <DateRow label="Identified" value={risk.date_identified} />
                <DateRow label="Last assessed" value={risk.date_last_assessed} />
                <DateRow
                  label="Next review"
                  value={risk.next_review_date}
                  extra={<ReviewBadge date={risk.next_review_date} />}
                />
              </dl>
            </Section>

            <Section title="Component">
              {risk.component ? (
                <ComponentHoverCard component={risk.component} />
              ) : (
                <p className="text-sm text-muted-foreground italic">No component linked</p>
              )}
            </Section>

            <ObjectivesSection risk={risk} onChange={setRisk} canManage={isAdmin} />
          </aside>
        </div>

        {/* Responses */}
        <ResponsesSection riskId={risk.id} componentId={risk.component?.id ?? risk.component_id} />
      </div>

      {/* Edit Drawer */}
      <EditDrawer open={editOpen} onOpenChange={setEditOpen} risk={risk} onSaved={setRisk} />

      {/* Delete Dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={(v) => { setDeleteOpen(v); if (!v) setDeleteError("") }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete risk?</AlertDialogTitle>
            <AlertDialogDescription>
              Risk <span className="font-mono font-semibold">{risk.risk_ref}</span> will be permanently
              deleted. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError && (
            <div className="flex items-center gap-2 text-xs text-red-600">
              <AlertCircle className="size-3.5 shrink-0" />
              {deleteError}
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting && <Loader2 className="size-4 animate-spin mr-2" />}
              Delete risk
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}