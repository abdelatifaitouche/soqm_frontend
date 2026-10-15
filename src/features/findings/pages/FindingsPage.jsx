import { useState, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import {
  Plus, AlertCircle, ArrowUpRight, X,
  CircleDashed, FileSearch, Wrench, ClipboardCheck, CheckCircle2,
  AlertTriangle, ShieldAlert, ClipboardList,
} from "lucide-react"
import { useFindings } from "@/features/findings/hooks/useFindings"
import Pagination from "@/shared/components/Pagination"

// ── Enums (match backend) ─────────────────────────────────────────────────────
// Status follows the remediation lifecycle: a finding is raised, assessed for
// deficiencies, remediated through action plans, verified, then closed.

const STATUS_CONFIG = {
  open: {
    label: "Open",
    icon: CircleDashed,
    cls: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-900/40 dark:text-slate-400 dark:border-slate-800",
  },
  under_assessment: {
    label: "Under assessment",
    icon: FileSearch,
    cls: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900",
  },
  remediation_in_progress: {
    label: "Remediation in progress",
    icon: Wrench,
    cls: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900",
  },
  pending_verification: {
    label: "Pending verification",
    icon: ClipboardCheck,
    cls: "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/30 dark:text-violet-400 dark:border-violet-900",
  },
  closed: {
    label: "Closed",
    icon: CheckCircle2,
    cls: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900",
  },
}

const SEVERITY_CONFIG = {
  deficiency: {
    label: "Deficiency",
    icon: AlertCircle,
    cls: "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950/30 dark:text-yellow-400 dark:border-yellow-900",
  },
  significant_deficiency: {
    label: "Significant deficiency",
    icon: AlertTriangle,
    cls: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/30 dark:text-orange-400 dark:border-orange-900",
  },
  material_deficiency: {
    label: "Material deficiency",
    icon: ShieldAlert,
    cls: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900",
  },
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

const STATUS_TABS = [
  { value: "", label: "All" },
  ...Object.entries(STATUS_CONFIG).map(([value, cfg]) => ({ value, label: cfg.label })),
]

function formatLabel(str) {
  if (!str) return "—"
  return str.toLowerCase().replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

// ── Small components ──────────────────────────────────────────────────────────

const PILL = "inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border whitespace-nowrap"

function StatusPill({ status }) {
  const cfg = STATUS_CONFIG[status] ?? { label: formatLabel(status), icon: CircleDashed, cls: "bg-slate-100 text-slate-500 border-slate-200" }
  const Icon = cfg.icon
  return (
    <span className={`${PILL} ${cfg.cls}`}>
      <Icon className="size-3" />
      {cfg.label}
    </span>
  )
}

function SeverityPill({ severity }) {
  if (!severity) return <span className="text-xs text-muted-foreground">Not assessed</span>
  const cfg = SEVERITY_CONFIG[severity] ?? { label: formatLabel(severity), icon: AlertCircle, cls: "bg-slate-100 text-slate-500 border-slate-200" }
  const Icon = cfg.icon
  return (
    <span className={`${PILL} ${cfg.cls}`}>
      <Icon className="size-3" />
      {cfg.label}
    </span>
  )
}

function SkeletonRows({ cols }) {
  const widths = ["w-12", "w-40", "w-28", "w-32"]
  return Array.from({ length: 5 }).map((_, i) => (
    <tr key={i} className="border-b border-border/50 last:border-0">
      {Array.from({ length: cols }).map((__, j) => (
        <td key={j} className="px-5 py-4">
          <div className={`h-4 rounded bg-muted animate-pulse ${widths[j % widths.length]}`} />
        </td>
      ))}
    </tr>
  ))
}

const SELECT_CLS =
  "h-9 rounded-lg border border-input bg-card px-3 text-xs text-foreground outline-none focus:ring-2 focus:ring-[#7B3FBE] transition-colors cursor-pointer"

// ── Page ──────────────────────────────────────────────────────────────────────

const SIZE = 10
// Newest first. The list payload has no date column to sort by in the UI yet.
const ORDER_BY = { columns: ["created_at"], direction: "desc" }
const COLS = 5

function FindingsPage() {
  const navigate = useNavigate()

  const [page, setPage] = useState(1)
  const [status, setStatus] = useState("")
  const [source, setSource] = useState("")
  const [severity, setSeverity] = useState("")

  const filters = useMemo(
    () => ({
      ...(status && { status }),
      ...(source && { finding_source: source }),
      ...(severity && { deficiency_severity: severity }),
    }),
    [status, source, severity]
  )

  const { items, total, totalPages, loading, error } = useFindings(filters, page, SIZE, ORDER_BY)

  const isFiltered = !!(status || source || severity)

  const clearAll = () => {
    setStatus("")
    setSource("")
    setSeverity("")
    setPage(1)
  }

  const pick = (setter) => (e) => { setter(e.target.value); setPage(1) }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold text-foreground tracking-tight">Findings</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {loading ? "Loading…" : `${total} finding${total !== 1 ? "s" : ""}`}
            <span className="hidden sm:inline"> · issues raised by monitoring and reviews, tracked through remediation</span>
          </p>
        </div>
        <button
          onClick={() => navigate("/findings/identify")}
          className="flex items-center gap-1.5 text-xs font-medium px-3.5 py-2 rounded-lg bg-[#3B1F6A] hover:bg-[#52298F] text-white transition-colors shrink-0"
        >
          <Plus className="size-3.5" /> Add finding
        </button>
      </div>

      {/* Status tabs */}
      <div className="border-b border-border overflow-x-auto" role="tablist" aria-label="Filter findings by status">
        <div className="flex gap-1 min-w-max">
          {STATUS_TABS.map((t) => {
            const active = status === t.value
            return (
              <button
                key={t.value || "all"}
                role="tab"
                aria-selected={active}
                onClick={() => { setStatus(t.value); setPage(1) }}
                className={`relative px-3 py-2.5 text-xs font-medium transition-colors whitespace-nowrap ${
                  active ? "text-[#3B1F6A] dark:text-[#a78bdb]" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.label}
                {active && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-[#3B1F6A] dark:bg-[#7B3FBE]" />}
              </button>
            )
          })}
        </div>
      </div>

      {/* Secondary filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <select value={source} onChange={pick(setSource)} aria-label="Filter by source" className={SELECT_CLS}>
          <option value="">All sources</option>
          {Object.entries(SOURCE_LABEL).map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>

        <select value={severity} onChange={pick(setSeverity)} aria-label="Filter by severity" className={SELECT_CLS}>
          <option value="">All severities</option>
          {Object.entries(SEVERITY_CONFIG).map(([val, cfg]) => (
            <option key={val} value={val}>{cfg.label}</option>
          ))}
        </select>

        {isFiltered && (
          <button
            onClick={clearAll}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors ml-auto"
          >
            <X className="size-3" /> Clear filters
          </button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {error ? (
          <div className="flex items-center justify-center gap-2 py-16 text-destructive">
            <AlertCircle className="size-4" />
            <span className="text-sm">Couldn’t load findings. Refresh to try again.</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b border-border bg-muted/20">
                  {["Ref", "Source", "Severity", "Status"].map((h) => (
                    <th key={h} className="text-left text-xs font-medium text-muted-foreground px-5 py-3 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <SkeletonRows cols={COLS} />
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={COLS} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <div className="flex size-10 items-center justify-center rounded-xl bg-muted">
                          <ClipboardList className="size-4 text-muted-foreground/40" />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {isFiltered ? "No findings match these filters." : "No findings recorded yet."}
                        </p>
                        {isFiltered ? (
                          <button onClick={clearAll} className="text-xs text-[#7B3FBE] hover:underline mt-1">
                            Clear filters
                          </button>
                        ) : (
                          <button
                            onClick={() => navigate("/findings/create")}
                            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#7B3FBE] hover:underline mt-1"
                          >
                            <Plus className="size-3.5" /> Add finding
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  items.map((f) => (
                    <tr
                      key={f.id}
                      onClick={() => navigate(`/findings/${f.id}`)}
                      className="group border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors cursor-pointer"
                    >
                      <td className="px-5 py-3.5">
                        <span className="text-[11px] font-semibold text-[#7B3FBE] bg-[#EDE9F8] dark:bg-accent dark:text-foreground px-2 py-0.5 rounded font-mono">
                          {f.finding_ref}
                        </span>
                      </td>

                      <td className="px-5 py-3.5">
                        <span className="text-sm text-foreground">
                          {SOURCE_LABEL[f.finding_source] ?? formatLabel(f.finding_source)}
                        </span>
                      </td>

                      <td className="px-5 py-3.5"><SeverityPill severity={f.deficiency_severity} /></td>
                      <td className="px-5 py-3.5"><StatusPill status={f.status} /></td>

                      <td className="px-5 py-3.5 w-px">
                        <div className="opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity flex justify-end">
                          <button
                            onClick={(e) => { e.stopPropagation(); navigate(`/findings/${f.id}`) }}
                            className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg bg-[#3B1F6A] hover:bg-[#52298F] text-white transition-colors"
                          >
                            <ArrowUpRight className="size-3" /> View
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {!loading && !error && (
          <Pagination
            page={page}
            totalPages={totalPages}
            total={total}
            size={SIZE}
            onPageChange={setPage}
            loading={loading}
          />
        )}
      </div>
    </div>
  )
}

export default FindingsPage