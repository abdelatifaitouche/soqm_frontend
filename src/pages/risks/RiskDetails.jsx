import { useState, useMemo } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useRisk } from "@/hooks/useRisk"
import { useRole } from "@/hooks/useRole"
import { useRiskResponses } from "@/hooks/useRiskResponses"
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

// Brand-consistent zone tokens (matches the Risks list page palette)
const ZONE = {
  critical: { label: "Critical", dot: "bg-red-500", text: "text-red-600 dark:text-red-400" },
  high:     { label: "High",     dot: "bg-amber-500", text: "text-amber-600 dark:text-amber-400" },
  low:      { label: "Low",      dot: "bg-emerald-500", text: "text-emerald-600 dark:text-emerald-400" },
}

function formatDate(str) {
  if (!str) return "—"
  return new Date(str).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
}

// Generic label fallback for anything not covered by a config map below.
function formatLabel(str) {
  if (!str) return "—"
  return str.toLowerCase().replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

const SELECT_CLS =
  "h-9 rounded-lg border border-input bg-card px-3 text-xs text-foreground outline-none focus:ring-2 focus:ring-[#7B3FBE] transition-colors cursor-pointer"

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
  DRAFT:       { label: "Draft",       icon: CircleDashed,   pill: "bg-slate-100 text-slate-500 border-slate-200" },
  PLANNED:     { label: "Planned",     icon: Rocket,         pill: "bg-sky-50 text-sky-700 border-sky-200" },
  IMPLEMENTED: { label: "Implemented", icon: ClipboardCheck, pill: "bg-blue-50 text-blue-700 border-blue-200" },
  EFFECTIVE:   { label: "Effective",   icon: CheckCircle2,   pill: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  RETIRED:     { label: "Retired",     icon: Archive,        pill: "bg-rose-50 text-rose-600 border-rose-200" },
}

// Matches backend ExecutionType enum
const EXECUTION_CONFIG = {
  MANUAL:    { label: "Manual",    icon: Hand, pill: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-900/40 dark:text-slate-400 dark:border-slate-800" },
  AUTOMATED: { label: "Automated", icon: Bot,  pill: "bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/30 dark:text-cyan-400 dark:border-cyan-900" },
  HYBRID:    { label: "Hybrid",    icon: Blend, pill: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/30 dark:text-indigo-400 dark:border-indigo-900" },
}

// Matches backend Frequency enum — plain readable labels, underscore stripped
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

function ResponseStatusPill({ status }) {
  const cfg = STATUS_CONFIG[status] ?? { label: formatLabel(status), icon: CircleDashed, pill: "bg-slate-100 text-slate-500 border-slate-200" }
  const Icon = cfg.icon
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-full border ${cfg.pill}`}>
      <Icon className="size-2.5" />
      {cfg.label}
    </span>
  )
}

function ResponseTypeChip({ type }) {
  const cfg = RESPONSE_TYPE_CONFIG[type] ?? { label: formatLabel(type), icon: CircleDashed, chip: "bg-slate-100 text-slate-500 border-slate-200" }
  const Icon = cfg.icon
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-full border ${cfg.chip}`}>
      <Icon className="size-2.5" />
      {cfg.label}
    </span>
  )
}

function ExecutionChip({ type }) {
  const cfg = EXECUTION_CONFIG[type] ?? { label: formatLabel(type), icon: Hand, pill: "bg-slate-100 text-slate-500 border-slate-200" }
  const Icon = cfg.icon
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-full border ${cfg.pill}`}>
      <Icon className="size-2.5" />
      {cfg.label}
    </span>
  )
}

function frequencyLabel(freq) {
  return FREQUENCY_LABEL[(freq || "").toLowerCase()] ?? formatLabel(freq)
}

// ============================================================
// SECTION SHELL — every card on this page shares this frame
// ============================================================

function Section({ eyebrow, action, children, className = "" }) {
  return (
    <div className={`py-6 border-b border-border/70 last:border-0 ${className}`}>
      {(eyebrow || action) && (
        <div className="flex items-center justify-between mb-4">
          {eyebrow && (
            <p className="text-[10.5px] font-medium uppercase tracking-[0.14em] text-muted-foreground">{eyebrow}</p>
          )}
          {action}
        </div>
      )}
      {children}
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
      <div className="flex items-center">
        {MAIN_FLOW.map((step, i) => {
          const isLast = i === MAIN_FLOW.length - 1
          const done = i < effectiveIndex
          const active = i === effectiveIndex
          const label = isLast && status === "accepted" ? "Accepted" : STATUS_LABEL[step]

          return (
            <div key={step} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-2.5">
                <span
                  className={`block rounded-full transition-all ${
                    active
                      ? "size-2.5 bg-[#3B1F6A] ring-4 ring-[#EDE9F8] dark:ring-violet-500/10"
                      : done
                        ? "size-1.5 bg-[#3B1F6A]"
                        : "size-1.5 bg-border"
                  }`}
                />
                <span
                  className={`text-[10.5px] whitespace-nowrap ${
                    active ? "font-semibold text-[#3B1F6A] dark:text-[#7B3FBE]" : done ? "text-foreground/70" : "text-muted-foreground/70"
                  }`}
                >
                  {label}
                </span>
              </div>
              {!isLast && (
                <div className={`h-px flex-1 mx-2 -mt-5 transition-colors ${done ? "bg-[#3B1F6A]/40" : "bg-border"}`} />
              )}
            </div>
          )
        })}
      </div>

      {isSideState && (
        <div className="flex items-center gap-1.5 pt-1">
          <span className="size-1 rounded-full bg-[#7B3FBE]" />
          <span className="text-xs text-muted-foreground">
            Currently marked as <span className="font-medium text-foreground">{STATUS_LABEL[status]}</span>
          </span>
        </div>
      )}
    </div>
  )
}

// ============================================================
// STAT COLUMN — plain typographic stat, no bars or gauges
// ============================================================

function StatColumn({ label, value, sub, valueClassName = "text-foreground" }) {
  return (
    <div className="text-right">
      <p className="text-[10.5px] font-medium uppercase tracking-[0.14em] text-muted-foreground mb-1.5">{label}</p>
      <p className={`text-2xl font-semibold leading-none tabular-nums ${valueClassName}`}>{value}</p>
      {sub && <p className="text-[11px] text-muted-foreground mt-1.5">{sub}</p>}
    </div>
  )
}

// ============================================================
// COMPONENT HOVER CARD
// ============================================================

function ComponentHoverCard({ component }) {
  return (
    <div className="group relative">
      <div className="flex items-center justify-between gap-2 py-2 cursor-default border-b border-transparent hover:border-border transition-colors">
        <p className="text-sm font-medium text-foreground truncate">{component.name}</p>
        <Eye className="size-3.5 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors shrink-0" />
      </div>

      <div className="absolute left-0 top-full mt-2 w-72 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 pointer-events-none group-hover:pointer-events-auto">
        <div className="bg-card border border-border rounded-lg shadow-lg p-4">
          <p className="text-sm font-semibold text-foreground mb-2">{component.name}</p>
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

// Same page-window pagination used on the Objective details table, so the
// two "linked records" tables in the app share one visual language.
function TablePagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null

  const set = new Set([1, totalPages, page - 1, page, page + 1])
  const pages = [...set].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b)

  return (
    <div className="flex items-center justify-center gap-1 py-3 border-t border-border">
      <button
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
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
        className="flex items-center justify-center size-8 rounded-lg border border-input bg-card text-muted-foreground hover:text-foreground hover:bg-muted/40 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronRight className="size-3.5" />
      </button>
    </div>
  )
}

function ResponsesSection({ riskId }) {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState("")

  const filters = useMemo(() => ({ ...(status && { status }) }), [status])
  const orderBy = { order_by: "created_at", direction: "desc" }

  const { responses, total, totalPages, loading, error } = useRiskResponses(
    riskId,
    filters,
    page,
    orderBy
  )

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-wrap gap-3">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Responses</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Treatment responses recorded for this risk</p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1) }}
            className={SELECT_CLS}
          >
            {RESPONSE_STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          <button
            onClick={() => navigate(`/responses/create?risk_id=${riskId}`)}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-[#3B1F6A] hover:bg-[#52298F] text-white transition-colors"
          >
            <Plus className="size-3" /> Add response
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /><span className="text-sm">Loading responses…</span>
        </div>
      ) : error ? (
        <div className="py-12 text-center text-destructive text-sm">Failed to load responses.</div>
      ) : !responses?.length ? (
        <div className="py-14 text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            {status ? "No responses match this filter." : "No responses recorded for this risk yet."}
          </p>
          <button
            onClick={() => navigate(`/responses/create?risk_id=${riskId}`)}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#7B3FBE] hover:underline mt-1"
          >
            <Plus className="size-3.5" /> Add response
          </button>
        </div>
      ) : (
        <>
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/20">
                {["Ref", "Name", "Status", "Type", "Frequency", "Execution", "Owner", ""].map((h) => (
                  <th key={h} className="text-left text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-4 py-3">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {responses.map((r) => (
                <tr
                  key={r.id}
                  className="group border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors"
                >
                  <td className="px-4 py-3.5">
                    <span className="text-[11px] font-semibold text-[#7B3FBE] bg-[#EDE9F8] dark:bg-accent dark:text-foreground px-2 py-0.5 rounded-md font-mono">
                      {r.response_ref}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 max-w-[180px]">
                    <span className="text-xs text-muted-foreground truncate block">
                      {r.response_name || "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <ResponseStatusPill status={r.status} />
                  </td>
                  <td className="px-4 py-3.5">
                    <ResponseTypeChip type={r.response_type} />
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Repeat className="size-3" />
                      {frequencyLabel(r.frequency)}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <ExecutionChip type={r.execution_type} />
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                      <UserRound className="size-3" />
                      {r.owner ? `${r.owner.first_name} ${r.owner.last_name}` : "Unassigned"}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => navigate(`/responses/${r.id}`)}
                        className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-[#3B1F6A] hover:bg-[#52298F] text-white transition-colors"
                      >
                        <ArrowRight className="size-3.5" /> View
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <TablePagination page={page} totalPages={totalPages} onChange={setPage} />
        </>
      )}
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

  if (open && !form) {
    setForm({
      risk_discription: risk.risk_discreption ?? "",
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
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Description</label>
            <textarea
              value={form.risk_discreption}
              onChange={set("risk_discription")}
              rows={4}
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-[#7B3FBE] resize-none"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Status</label>
            <select
              value={form.status}
              onChange={set("status")}
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-[#7B3FBE]"
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
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Significance</label>
              <select
                value={form.significance}
                onChange={set("significance")}
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-[#7B3FBE]"
              >
                {[1, 2, 3].map((v) => (
                  <option key={v} value={v}>
                    {v} — {SIG_LABELS[v]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Occurrence</label>
              <select
                value={form.occurence}
                onChange={set("occurence")}
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-[#7B3FBE]"
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
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Last assessed</label>
              <input
                type="date"
                value={form.date_last_assessed || ""}
                onChange={set("date_last_assessed")}
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-[#7B3FBE]"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Next review</label>
              <input
                type="date"
                value={form.next_review_date || ""}
                onChange={set("next_review_date")}
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-[#7B3FBE]"
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
        {/* Header */}
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

        {/* Masthead — no card, no border box; just typography and a hairline rule beneath */}
        <div className="pb-8 border-b border-border/70">
          <div className="flex items-start justify-between gap-8 flex-wrap">
            {/* Identity */}
            <div className="min-w-0">
              <p className="text-[10.5px] font-medium uppercase tracking-[0.18em] text-muted-foreground mb-3">
                Risk register
              </p>

              <h1 className="text-3xl font-semibold tracking-tight text-foreground font-mono mb-2.5">
                {risk.risk_ref}
              </h1>

              <div className="flex items-center gap-2 text-sm mb-4">
                <span className={`size-1.5 rounded-full ${z.dot}`} />
                <span className={`font-medium ${z.text}`}>{z.label} risk</span>
                <span className="text-border">·</span>
                <span className="text-muted-foreground">{STATUS_LABEL[risk.status]}</span>
              </div>

              <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground">
                <span>Identified {formatDate(risk.date_identified)}</span>
                <span>Last assessed {formatDate(risk.date_last_assessed)}</span>
                <span>Next review {formatDate(risk.next_review_date)}</span>
              </div>
            </div>

            {/* Stat columns — plain numerals, financial-tearsheet style */}
            <div className="flex items-start gap-8 shrink-0">
              <StatColumn label="Significance" value={risk.significance} sub={SIG_LABELS[risk.significance]} />
              <StatColumn label="Occurrence" value={risk.occurence} sub={OCC_LABELS[risk.occurence]} />
              <StatColumn
                label="Score"
                value={`${risk.score}`}
                sub={risk.residual_score != null ? `Residual ${risk.residual_score}` : "out of 9"}
                valueClassName={z.text}
              />
            </div>
          </div>

          {/* Workflow */}
          <div className="mt-8 pt-7 border-t border-border/70">
            <p className="text-[10.5px] font-medium uppercase tracking-[0.14em] text-muted-foreground mb-5">
              Workflow
            </p>
            <WorkflowStepper status={risk.status} />
          </div>
        </div>

        {/* Content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-x-10 gap-y-6 items-start">
          {/* Left: main content */}
          <div className="space-y-6">
            <Section eyebrow="Description">
              <p className="text-sm text-foreground/90 leading-relaxed">
                {risk.risk_discreption || <span className="italic text-muted-foreground">No description provided</span>}
              </p>
            </Section>
          </div>

          {/* Right: sidebar — always rendered, with an empty state, so these
              sections never look like they've silently disappeared */}
          <div className="space-y-6">
            <Section eyebrow="Component">
              {risk.component ? (
                <ComponentHoverCard component={risk.component} />
              ) : (
                <p className="text-sm text-muted-foreground italic">No component linked</p>
              )}
            </Section>

            <Section eyebrow={`Objectives${risk.objectives?.length ? ` · ${risk.objectives.length}` : ""}`}>
              {risk.objectives && risk.objectives.length > 0 ? (
                <div className="space-y-1">
                  {risk.objectives.map((obj) => (
                    <button
                      key={obj.id}
                      onClick={() => navigate(`/objectives/${obj.id}`)}
                      className="group w-full flex items-center gap-3 py-2 border-b border-border last:border-0 text-left"
                    >
                      <div className="flex items-center justify-center size-7 rounded-lg bg-[#EDE9F8] dark:bg-accent shrink-0">
                        <Target className="size-3.5 text-[#7B3FBE]" />
                      </div>
                      <span className="flex-1 min-w-0 text-sm text-foreground/90 truncate">
                        Objective {obj.objective_reference}
                      </span>
                      <ArrowRight className="size-3.5 text-muted-foreground/40 group-hover:text-foreground group-hover:translate-x-0.5 transition-all shrink-0" />
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">Not linked to any objective</p>
              )}
            </Section>
          </div>
        </div>

        {/* Responses — full width, same table language as Objective's linked-risks table */}
        <ResponsesSection riskId={risk.id} />
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