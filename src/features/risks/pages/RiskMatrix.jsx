import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import {
  Shield, X, Plus, ArrowRight, ArrowUpRight, ChevronRight,
  Loader2, AlertCircle, ChevronLeft, ChevronDown, LayoutGrid, List,
} from "lucide-react"
import { useRisks } from "@/features/risks/hooks/useRisks"
import { useComponents } from "@/features/isqm_components/hooks/useComponents"
import { useObjectives } from "@/features/objectives/hooks/useObjectives"

// ── Constants ─────────────────────────────────────────────────────────────────
const SIG_LABELS = { 3: "High", 2: "Med", 1: "Low" }
const OCC_LABELS = { 1: "Low",  2: "Med", 3: "High" }
const SIG_ROWS   = [3, 2, 1]
const OCC_COLS   = [1, 2, 3]
const STATUS_OPTIONS = ["open", "mitigated", "closed", "accepted"]
const PAGE_SIZE = 20

function getZone(significance, occurrence) {
  const score = significance * occurrence
  if (score >= 6) return "critical"
  if (score >= 3) return "high"
  return "low"
}

const ZONE = {
  critical: {
    label: "Critical",
    cell:  "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-900",
    chip:  "bg-red-100 text-red-800 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900",
    badge: "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400",
    stat:  "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-900",
    dot:   "bg-red-400",
    score: "text-red-700 dark:text-red-400",
    pip:   "#E24B4A",
  },
  high: {
    label: "High",
    cell:  "bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900",
    chip:  "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900",
    badge: "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400",
    stat:  "bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900",
    dot:   "bg-amber-400",
    score: "text-amber-700 dark:text-amber-400",
    pip:   "#BA7517",
  },
  low: {
    label: "Low",
    cell:  "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900",
    chip:  "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900",
    badge: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400",
    stat:  "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900",
    dot:   "bg-emerald-400",
    score: "text-emerald-700 dark:text-emerald-400",
    pip:   "#1D9E75",
  },
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function DotBar({ value, max = 3 }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <div
          key={i}
          className={`size-1.5 rounded-sm ${i < value ? "bg-[#7B3FBE]" : "bg-muted border border-border"}`}
        />
      ))}
    </div>
  )
}

function StatusBadge({ status }) {
  const styles = {
    open:      "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900",
    mitigated: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400",
    closed:    "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400",
    accepted:  "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400",
  }
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border capitalize ${styles[status] || styles.open}`}>
      {status}
    </span>
  )
}

// ── Risk chip inside matrix cell ───────────────────────────────────────────────
function RiskChip({ risk, onClick }) {
  const zone = getZone(risk.significance, risk.occurence)
  const z    = ZONE[zone]
  return (
    <button
      onClick={() => onClick(risk)}
      className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold border font-mono transition-all hover:-translate-y-0.5 hover:shadow-sm ${z.chip}`}
    >
      {risk.risk_ref}
      <ChevronRight className="size-2.5" />
    </button>
  )
}

// ── Matrix cell ───────────────────────────────────────────────────────────────
function MatrixCell({ significance, occurrence, risks, onChipClick }) {
  const zone      = getZone(significance, occurrence)
  const z         = ZONE[zone]
  const cellRisks = risks.filter((r) => r.significance === significance && r.occurence === occurrence)

  return (
    <div className={`relative min-h-[72px] rounded-md border p-2 ${z.cell}`}>
      <div
        className="absolute top-1.5 right-1.5 size-1.5 rounded-full opacity-40"
        style={{ background: z.pip }}
      />
      <div className="flex flex-wrap gap-1">
        {cellRisks.map((r) => (
          <RiskChip key={r.id} risk={r} onClick={onChipClick} />
        ))}
        {cellRisks.length === 0 && (
          <span className="text-xs text-muted-foreground/30 select-none">—</span>
        )}
      </div>
    </div>
  )
}

// ── Quick-view drawer ─────────────────────────────────────────────────────────
function RiskDrawer({ risk, onClose, onNavigate }) {
  if (!risk) return null
  const zone = getZone(risk.significance, risk.occurence)
  const z    = ZONE[zone]

  return (
    <div className="fixed inset-0 z-40 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-[2px]" />
      <div
        className="relative z-50 w-full max-w-sm bg-card border-l border-border flex flex-col shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between p-5 border-b border-border">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${z.badge}`}>
                {z.label}
              </span>
              <span className="text-xs text-muted-foreground">
                {SIG_LABELS[risk.significance]} sig · {OCC_LABELS[risk.occurence]} occ
              </span>
            </div>
            <h3 className="text-base font-semibold text-foreground font-mono">{risk.risk_ref}</h3>
          </div>
          <button
            onClick={onClose}
            className="flex size-7 items-center justify-center rounded-md hover:bg-muted text-muted-foreground transition-colors"
          >
            <X className="size-3.5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">Description</p>
            <p className="text-sm text-foreground leading-relaxed">
              {risk.risk_discription || "No description provided."}
            </p>
          </div>

          {risk.status && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">Status</p>
              <StatusBadge status={risk.status} />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Significance", value: SIG_LABELS[risk.significance], bar: risk.significance },
              { label: "Occurrence",   value: OCC_LABELS[risk.occurence],    bar: risk.occurence },
            ].map((f) => (
              <div key={f.label} className="rounded-lg bg-muted/40 border border-border p-3">
                <p className="text-[10px] text-muted-foreground mb-1.5">{f.label}</p>
                <p className="text-sm font-medium text-foreground mb-1.5">{f.value}</p>
                <DotBar value={f.bar} />
              </div>
            ))}
          </div>

          <div className="rounded-lg bg-muted/40 border border-border p-3">
            <p className="text-[10px] text-muted-foreground mb-1">Risk Score</p>
            <p className={`text-2xl font-semibold ${z.score}`}>{risk.score}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">/ 9 maximum</p>
          </div>
        </div>

        <div className="p-5 border-t border-border">
          <button
            onClick={() => onNavigate(risk.id)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#3B1F6A] hover:bg-[#52298F] text-white text-sm font-medium transition-colors"
          >
            View full details <ArrowUpRight className="size-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Pagination controls ───────────────────────────────────────────────────────
// hasMore: true  → there is definitely a next page (backend returned a full page)
// hasMore: false → last page (backend returned fewer than limit items)
// totalPages / total may be 0/unknown — we degrade gracefully
function Pagination({ page, totalPages, total, limit, hasMore, onPageChange, loading }) {
  const knownTotal   = total > 0
  const knownPages   = totalPages > 0
  const isFirstPage  = page <= 1
  const isLastPage   = knownPages ? page >= totalPages : !hasMore

  const from = !knownTotal ? null : (page - 1) * limit + 1
  const to   = !knownTotal ? null : knownPages
    ? Math.min(page * limit, total)
    : page * limit  // best-effort when total unknown

  // Don't render at all if we're on page 1 with no next page
  if (isFirstPage && isLastPage && !loading) return null

  return (
    <div className="flex items-center justify-between px-5 py-3 border-t border-border bg-muted/10">
      <p className="text-xs text-muted-foreground">
        {knownTotal
          ? `Showing ${from}–${Math.min(to, total)} of ${total}`
          : `Page ${page}`}
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={isFirstPage || loading}
          className="flex size-7 items-center justify-center rounded-md border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="size-3.5" />
        </button>

        {knownPages ? (
          // Render numbered pills when we know total pages
          Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
            .reduce((acc, p, idx, arr) => {
              if (idx > 0 && arr[idx - 1] !== p - 1) acc.push("…")
              acc.push(p)
              return acc
            }, [])
            .map((p, i) =>
              p === "…" ? (
                <span key={`ellipsis-${i}`} className="text-xs text-muted-foreground px-1">…</span>
              ) : (
                <button
                  key={p}
                  onClick={() => onPageChange(p)}
                  disabled={loading}
                  className={`flex size-7 items-center justify-center rounded-md text-xs font-medium transition-colors disabled:cursor-not-allowed ${
                    p === page
                      ? "bg-[#3B1F6A] text-white"
                      : "border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  {p}
                </button>
              )
            )
        ) : (
          // No total_pages from backend — just show current page number
          <span className="flex size-7 items-center justify-center rounded-md bg-[#3B1F6A] text-white text-xs font-medium">
            {page}
          </span>
        )}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={isLastPage || loading}
          className="flex size-7 items-center justify-center rounded-md border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="size-3.5" />
        </button>
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function RiskMatrix() {
  const navigate = useNavigate()

  const [filters, setFilters]         = useState({ component_id: "", objective_id: "", status: "" })
  const [filterZone, setFilterZone]   = useState("all")
  const [selectedRisk, setSelectedRisk] = useState(null)
  const [page, setPage]               = useState(1)
  const [view, setView]               = useState("both") // "both" | "matrix" | "list"

  // For the heat map we accumulate all pages into a flat list
  const [allRisks, setAllRisks]       = useState([])
  const [matrixPage, setMatrixPage]   = useState(1)
  const [matrixDone, setMatrixDone]   = useState(false)

  // Zone filter is sent to backend AND applied client-side on the matrix for instant feedback.
  // The table relies purely on the backend response for its page of data.
  const apiParams = Object.fromEntries(
    Object.entries({
      ...filters,
      ...(filterZone !== "all" ? { zone: filterZone } : {}),
    }).filter(([, v]) => v !== "")
  )

  // Table: one page at a time
  const { risks, loading, error, pagination } = useRisks(apiParams, page, PAGE_SIZE)

  // Matrix: accumulates across pages with a large limit per fetch
  const {
    risks: matrixRisks,
    loading: matrixLoading,
  } = useRisks(apiParams, matrixPage, 100)

  // hasMore: backend returned a full page → assume more exists
  const tableHasMore  = risks.length === PAGE_SIZE
  const matrixHasMore = matrixRisks.length === 100

  // Reset everything when filters or zone change
  const apiParamsKey = JSON.stringify(apiParams)
  useEffect(() => {
    setPage(1)
    setMatrixPage(1)
    setAllRisks([])
    setMatrixDone(false)
  }, [apiParamsKey])

  // Accumulate matrix risks across pages
  useEffect(() => {
    if (matrixLoading) return
    if (matrixRisks.length === 0) {
      if (matrixPage > 1) setMatrixDone(true)
      return
    }
    setAllRisks((prev) => {
      const existingIds = new Set(prev.map((r) => r.id))
      const newOnes = matrixRisks.filter((r) => !existingIds.has(r.id))
      return [...prev, ...newOnes]
    })
    if (!matrixHasMore) setMatrixDone(true)
  }, [matrixRisks, matrixLoading])

  const setFilter  = (key) => (e) => { setFilters((f) => ({ ...f, [key]: e.target.value })); setPage(1) }
  const clearFilters = () => { setFilters({ component_id: "", objective_id: "", status: "" }); setFilterZone("all"); setPage(1) }
  const hasFilters = Object.values(filters).some(Boolean) || filterZone !== "all"

  const { components } = useComponents()
  const { objectives } = useObjectives()

  // Zone counts from accumulated matrix data
  const counts = { critical: 0, high: 0, low: 0 }
  allRisks.forEach((r) => counts[getZone(r.significance, r.occurence)]++)

  const visibleMatrixRisks =
    filterZone === "all"
      ? allRisks
      : allRisks.filter((r) => getZone(r.significance, r.occurence) === filterZone)

  // totalPages: use what the backend gives us, compute if we have total, or 0 = unknown
  const totalPages = pagination.total_pages
    || (pagination.total ? Math.ceil(pagination.total / PAGE_SIZE) : 0)

  return (
    <>
      <div className="space-y-5">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-foreground tracking-tight">Risk Matrix</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {pagination.total > 0
                ? `${pagination.total} risk${pagination.total !== 1 ? "s" : ""} registered`
                : "Significance × Occurrence"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* View toggle */}
            <div className="flex items-center rounded-lg border border-border bg-card p-0.5 gap-0.5">
              {[
                { id: "both",   icon: <LayoutGrid className="size-3.5" />, label: "Both" },
                { id: "matrix", icon: <LayoutGrid className="size-3.5" />, label: "Map" },
                { id: "list",   icon: <List className="size-3.5" />,       label: "List" },
              ].map((v) => (
                <button
                  key={v.id}
                  onClick={() => setView(v.id)}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    view === v.id
                      ? "bg-[#3B1F6A] text-white"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {v.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => navigate("/risks/create")}
              className="flex items-center gap-1.5 text-xs font-medium px-3.5 py-2 rounded-lg bg-[#3B1F6A] hover:bg-[#52298F] text-white transition-colors shrink-0"
            >
              <Plus className="size-3.5" /> Add risk
            </button>
          </div>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-3 gap-3">
          {(["critical", "high", "low"]).map((zone) => {
            const z        = ZONE[zone]
            const isActive = filterZone === zone
            return (
              <button
                key={zone}
                onClick={() => { setFilterZone(isActive ? "all" : zone); setPage(1) }}
                className={`text-left rounded-xl border px-4 py-3.5 transition-all ${
                  isActive ? z.stat : "bg-card border-border hover:border-border/80"
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className={`size-2 rounded-full ${z.dot}`} />
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                    {z.label}
                  </span>
                </div>
                <div className="flex items-end gap-2">
                  <p className="text-2xl font-medium text-foreground">
                    {matrixLoading && allRisks.length === 0 ? (
                      <span className="inline-block w-6 h-6 rounded bg-muted/50 animate-pulse" />
                    ) : counts[zone]}
                  </p>
                  {!matrixDone && allRisks.length > 0 && (
                    <span className="text-[10px] text-muted-foreground mb-1">+more</span>
                  )}
                </div>
              </button>
            )
          })}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={filters.component_id}
            onChange={setFilter("component_id")}
            className="h-9 rounded-lg border border-input bg-card px-3 text-xs text-foreground outline-none focus:ring-2 focus:ring-[#7B3FBE] transition-colors"
          >
            <option value="">All components</option>
            {components?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>

          <select
            value={filters.objective_id}
            onChange={setFilter("objective_id")}
            className="h-9 rounded-lg border border-input bg-card px-3 text-xs text-foreground outline-none focus:ring-2 focus:ring-[#7B3FBE] transition-colors"
          >
            <option value="">All objectives</option>
            {objectives?.map((o) => (
              <option key={o.id} value={o.id}>
                {o.objective_reference?.slice(0, 50)}{o.objective_reference?.length > 50 ? "…" : ""}
              </option>
            ))}
          </select>

          <select
            value={filters.status}
            onChange={setFilter("status")}
            className="h-9 rounded-lg border border-input bg-card px-3 text-xs text-foreground outline-none focus:ring-2 focus:ring-[#7B3FBE] transition-colors"
          >
            <option value="">All statuses</option>
            {STATUS_OPTIONS.map((s) => <option key={s} value={s} className="capitalize">{s}</option>)}
          </select>

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors ml-auto"
            >
              <X className="size-3" /> Clear filters
            </button>
          )}
        </div>

        {/* Content grid */}
        <div className={`grid gap-4 ${
          view === "both"   ? "grid-cols-1 xl:grid-cols-[400px_1fr]" :
          view === "matrix" ? "grid-cols-1 max-w-lg"                 :
                              "grid-cols-1"
        }`}>

          {/* ── Heat map ────────────────────────────────────────────────── */}
          {(view === "both" || view === "matrix") && (
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-foreground">Heat map</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Click a chip to quick-view</p>
                </div>
                {matrixLoading && (
                  <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
                )}
              </div>

              <div className="p-5">
                {/* Legend */}
                <div className="flex gap-4 mb-4">
                  {["critical","high","low"].map((z) => (
                    <div key={z} className="flex items-center gap-1.5">
                      <div className={`size-2.5 rounded-sm border ${ZONE[z].cell}`} />
                      <span className="text-xs text-muted-foreground capitalize">{ZONE[z].label}</span>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  {/* Y-axis */}
                  <div className="flex items-center justify-center w-4">
                    <span
                      className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground"
                      style={{ writingMode: "vertical-lr", transform: "rotate(180deg)" }}
                    >
                      Significance
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="grid gap-1 mb-1" style={{ gridTemplateColumns: "40px 1fr 1fr 1fr" }}>
                      <div />
                      {["Low occ.", "Med occ.", "High occ."].map((l) => (
                        <div key={l} className="text-center text-[9px] font-semibold uppercase tracking-widest text-muted-foreground">{l}</div>
                      ))}
                    </div>

                    <div className="space-y-1">
                      {SIG_ROWS.map((s) => (
                        <div key={s} className="grid gap-1" style={{ gridTemplateColumns: "40px 1fr 1fr 1fr" }}>
                          <div className="flex items-center justify-end pr-2">
                            <span className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground">
                              {SIG_LABELS[s]}
                            </span>
                          </div>
                          {OCC_COLS.map((o) => (
                            <MatrixCell
                              key={`${s}-${o}`}
                              significance={s}
                              occurrence={o}
                              risks={visibleMatrixRisks}
                              onChipClick={setSelectedRisk}
                            />
                          ))}
                        </div>
                      ))}
                    </div>

                    <div className="text-center mt-2">
                      <span className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground">
                        ← Occurrence →
                      </span>
                    </div>
                  </div>
                </div>

                {/* Load more risks into matrix */}
                {!matrixDone && (
                  <button
                    onClick={() => setMatrixPage((p) => p + 1)}
                    disabled={matrixLoading}
                    className="mt-4 w-full flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground py-2 rounded-lg border border-dashed border-border hover:border-border/60 transition-colors disabled:opacity-50"
                  >
                    {matrixLoading
                      ? <><Loader2 className="size-3.5 animate-spin" /> Loading…</>
                      : <><ChevronDown className="size-3.5" /> Load more risks into map</>}
                  </button>
                )}
                {matrixDone && allRisks.length > 0 && (
                  <p className="mt-3 text-center text-[10px] text-muted-foreground/50">
                    All {allRisks.length} risks loaded
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ── Risk register ────────────────────────────────────────────── */}
          {(view === "both" || view === "list") && (
            <div className="rounded-xl border border-border bg-card overflow-hidden flex flex-col">
              <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                <div>
                  <h2 className="text-sm font-semibold text-foreground">
                    Risk register
                    {filterZone !== "all" && (
                      <span className={`ml-2 text-[10px] font-semibold px-2 py-0.5 rounded-full ${ZONE[filterZone].badge}`}>
                        {ZONE[filterZone].label}
                      </span>
                    )}
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {pagination.total > 0
                      ? `${pagination.total} risk${pagination.total !== 1 ? "s" : ""} total`
                      : "—"}
                    {filterZone !== "all" ? " · filtered by zone" : ""}
                  </p>
                </div>
                {filterZone !== "all" && (
                  <button
                    onClick={() => { setFilterZone("all"); setPage(1) }}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="size-3" /> Clear zone
                  </button>
                )}
              </div>

              {/* Table body */}
              {loading && risks.length === 0 ? (
                <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  <span className="text-sm">Loading…</span>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center py-16 gap-2">
                  <AlertCircle className="size-5 text-destructive" />
                  <p className="text-sm text-destructive">Failed to load risks.</p>
                </div>
              ) : risks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-2">
                  <Shield className="size-6 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">No risks match the current filters.</p>
                  {hasFilters && (
                    <button onClick={clearFilters} className="text-xs text-[#7B3FBE] hover:underline mt-1">
                      Clear all filters
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex-1 overflow-auto">
                  <table className="w-full">
                    <thead className="sticky top-0 z-10">
                      <tr className="border-b border-border bg-muted/30 backdrop-blur-sm">
                        {["Ref", "Description", "Status", "Sig", "Occ", "Score", "Zone", ""].map((h) => (
                          <th
                            key={h}
                            className="text-left text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-4 py-3 whitespace-nowrap"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {risks.map((risk) => {
                        const zone = getZone(risk.significance, risk.occurence)
                        const z    = ZONE[zone]
                        return (
                          <tr
                            key={risk.id}
                            className={`group border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors cursor-pointer ${
                              loading ? "opacity-60" : ""
                            }`}
                            onClick={() => setSelectedRisk(risk)}
                          >
                            <td className="px-4 py-3">
                              <span className="text-[11px] font-semibold text-[#7B3FBE] bg-[#EDE9F8] dark:bg-accent dark:text-foreground px-2 py-0.5 rounded font-mono">
                                {risk.risk_ref}
                              </span>
                            </td>
                            <td className="px-4 py-3 max-w-[200px]">
                              <span className="text-xs text-muted-foreground truncate block">
                                {risk.risk_discription || "—"}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              {risk.status ? <StatusBadge status={risk.status} /> : <span className="text-muted-foreground/40 text-xs">—</span>}
                            </td>
                            <td className="px-4 py-3"><DotBar value={risk.significance} /></td>
                            <td className="px-4 py-3"><DotBar value={risk.occurence} /></td>
                            <td className="px-4 py-3">
                              <span className={`text-sm font-semibold ${z.score}`}>{risk.score}</span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${z.badge}`}>
                                {z.label}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={(e) => { e.stopPropagation(); setSelectedRisk(risk) }}
                                  className="flex size-7 items-center justify-center rounded-md hover:bg-[#EDE9F8] dark:hover:bg-accent text-muted-foreground hover:text-[#3B1F6A] dark:hover:text-foreground transition-colors"
                                  title="Quick view"
                                >
                                  <ArrowRight className="size-3.5" />
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); navigate(`/risks/${risk.id}`) }}
                                  className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg bg-[#3B1F6A] hover:bg-[#52298F] text-white transition-colors"
                                >
                                  <ArrowUpRight className="size-3" /> View
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination footer */}
              <Pagination
                page={page}
                totalPages={totalPages}
                total={pagination.total || 0}
                limit={PAGE_SIZE}
                hasMore={tableHasMore}
                onPageChange={setPage}
                loading={loading}
              />
            </div>
          )}
        </div>
      </div>

      {/* Drawer */}
      {selectedRisk && (
        <RiskDrawer
          risk={selectedRisk}
          onClose={() => setSelectedRisk(null)}
          onNavigate={(id) => { setSelectedRisk(null); navigate(`/risks/${id}`) }}
        />
      )}
    </>
  )
}