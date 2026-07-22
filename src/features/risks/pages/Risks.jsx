import { useState, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import {
  Plus, Loader2, AlertCircle, ArrowUpRight, X,
  ChevronLeft, ChevronRight, CircleDashed, ShieldAlert,
  ClipboardList, CheckCircle2, ShieldCheck, Archive,
  RefreshCw, FileSearch, ChevronDown, ChevronUp,
  List as ListIcon, LayoutGrid, Activity, TrendingUp, Target,
} from "lucide-react"
import { useRisks } from "@/features/risks/hooks/useRisks"
import { useComponentsOptions } from "@/features/isqm_components/hooks/useComponentsOptions"
import { useRiskMatrix } from "@/features/risks/hooks/useRiskMatrix"
import STATUS_CONFIG from "@/features/risks/data/states"
import Pagination from "@/shared/components/Pagination"
// ── Status config ─────────────────────────────────────────────────────────────


function getZone(score) {
  if (score >= 6) return { label: "Critical", cls: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900" }
  if (score >= 3) return { label: "High",     cls: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900" }
  return               { label: "Low",      cls: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900" }
}

// ── Small components (list view) ────────────────────────────────────────────

function StatusPill({ status }) {
  const key = status?.toLowerCase()
  const cfg = STATUS_CONFIG[key] ?? { label: status ?? "—", icon: CircleDashed, cls: "bg-slate-100 text-slate-400 border-slate-200" }
  const Icon = cfg.icon
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${cfg.cls}`}>
      <Icon className="size-2.5" />
      {cfg.label}
    </span>
  )
}

function ZonePill({ score }) {
  const z = getZone(score)
  return (
    <span className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full border ${z.cls}`}>
      {z.label}
    </span>
  )
}

// 3-segment bar: fills green→amber→red based on value
const LEVEL = {
  1: { label: "Low",  filled: "bg-emerald-400", segments: 1 },
  2: { label: "Med",  filled: "bg-amber-400",   segments: 2 },
  3: { label: "High", filled: "bg-red-400",     segments: 3 },
}

function LevelBar({ value }) {
  const lvl = LEVEL[value] ?? LEVEL[1]
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex gap-0.5">
        {[1, 2, 3].map((seg) => (
          <div
            key={seg}
            className={`w-3 rounded-sm transition-colors ${
              seg <= lvl.segments
                ? `${lvl.filled} ${seg === 1 ? "h-2" : seg === 2 ? "h-3" : "h-4"}`
                : `bg-muted border border-border ${seg === 1 ? "h-2" : seg === 2 ? "h-3" : "h-4"}`
            }`}
          />
        ))}
      </div>
      <span className={`text-[10px] font-semibold ${
        value === 3 ? "text-red-600 dark:text-red-400" :
        value === 2 ? "text-amber-600 dark:text-amber-400" :
        "text-emerald-600 dark:text-emerald-400"
      }`}>
        {lvl.label}
      </span>
    </div>
  )
}

// ── Sort button ───────────────────────────────────────────────────────────────

function SortButton({ column, label, orderBy, onSort }) {
  const active = orderBy.column === column
  const Icon = active && orderBy.direction === "asc" ? ChevronUp : ChevronDown
  return (
    <button
      onClick={() => onSort(column)}
      className={`flex items-center gap-0.5 text-[10px] font-semibold uppercase tracking-widest transition-colors ${
        active ? "text-[#7B3FBE]" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {label}
      <Icon className={`size-3 ${active ? "opacity-100" : "opacity-40"}`} />
    </button>
  )
}

// ── Select ────────────────────────────────────────────────────────────────────

const SELECT_CLS = "h-9 rounded-lg border border-input bg-card px-3 text-xs text-foreground outline-none focus:ring-2 focus:ring-[#7B3FBE] transition-colors cursor-pointer disabled:opacity-50"

// ── Heat map pieces (matrix view) ───────────────────────────────────────────

const SIG_LABELS = { 1: "Low", 2: "Medium", 3: "High" }
const OCC_LABELS = { 1: "Low", 2: "Medium", 3: "High" }
const SIG_ROWS = [3, 2, 1]
const OCC_COLS = [1, 2, 3]

const MATRIX_ZONE = {
  critical: {
    label: "Critical",
    cell: "bg-red-50 border-red-200",
    text: "text-red-700",
    dot: "bg-red-500",
    tint: (o) => `rgba(220, 38, 38, ${0.12 + o * 0.68})`,
  },
  high: {
    label: "High",
    cell: "bg-orange-50 border-orange-200",
    text: "text-orange-700",
    dot: "bg-orange-500",
    tint: (o) => `rgba(249, 115, 22, ${0.12 + o * 0.68})`,
  },
  low: {
    label: "Low",
    cell: "bg-green-50 border-green-200",
    text: "text-green-700",
    dot: "bg-green-500",
    tint: (o) => `rgba(34, 197, 94, ${0.1 + o * 0.55})`,
  },
}

function getMatrixZone(significance, occurrence) {
  const score = significance * occurrence
  if (score >= 6) return "critical"
  if (score >= 3) return "high"
  return "low"
}

function MatrixCell({ cell, maxPercent }) {
  if (!cell) {
    return <div className="w-12 h-12 rounded-md border border-dashed border-border/60 bg-muted/30" />
  }

  const zone = getMatrixZone(cell.significance, cell.occurence)
  const z = MATRIX_ZONE[zone]
  const score = cell.significance * cell.occurence
  const opacity = maxPercent > 0 ? Math.min(cell.percent / maxPercent, 1) : 0

  return (
    <div
      className={`group relative w-12 h-12 rounded-md border ${z.cell} flex flex-col items-center justify-center transition-all hover:-translate-y-0.5 hover:shadow-sm cursor-pointer`}
      style={{ backgroundColor: z.tint(opacity) }}
    >
      <p className={`text-[11px] font-semibold ${z.text}`}>{cell.percent.toFixed(1)}%</p>
      <p className="text-[8px] text-muted-foreground leading-none mt-0.5">S{score}</p>

      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
        <div className="bg-foreground text-background text-[10px] font-medium px-2.5 py-1.5 rounded-md whitespace-nowrap">
          {cell.percent.toFixed(1)}% of risks · {z.label}
        </div>
      </div>
    </div>
  )
}

function MatrixStatCard({ label, value, sublabel, icon: Icon, tone }) {
  const tones = {
    critical: { icon: "bg-red-50 text-red-600", value: "text-red-600" },
    high: { icon: "bg-orange-50 text-orange-600", value: "text-orange-600" },
    low: { icon: "bg-green-50 text-green-600", value: "text-green-600" },
  }
  const t = tones[tone]

  return (
    <div className="rounded-lg border border-border bg-card p-3.5 flex items-start justify-between">
      <div>
        <p className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">{label}</p>
        <p className={`text-xl font-bold ${t.value}`}>{value}</p>
        <p className="text-[9px] text-muted-foreground/70 mt-0.5">{sublabel}</p>
      </div>
      <div className={`size-7 rounded-md flex items-center justify-center shrink-0 ${t.icon}`}>
        <Icon className="size-3.5" />
      </div>
    </div>
  )
}

// ── View toggle ───────────────────────────────────────────────────────────────

function ViewToggle({ view, onChange }) {
  return (
    <div className="flex items-center gap-1 p-1 rounded-lg border border-border bg-muted/30 shrink-0">
      <button
        onClick={() => onChange("list")}
        className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md transition-colors ${
          view === "list" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <ListIcon className="size-3.5" /> List
      </button>
      <button
        onClick={() => onChange("matrix")}
        className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md transition-colors ${
          view === "matrix" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <LayoutGrid className="size-3.5" /> Heat map
      </button>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

const SIZE = 10

function Risks() {
  const navigate = useNavigate()

  const [view, setView] = useState("list") // "list" | "matrix"

  // ── List view state — filters, sorting, pagination all live here and only here ──
  const [page,        setPage]        = useState(1)
  const [status,      setStatus]      = useState("")
  const [componentId, setComponentId] = useState("")
  const [orderBy,     setOrderBy]     = useState({ column: "created_at", direction: "desc" })

  const filters = useMemo(() => ({
    ...(status      && { status }),
    ...(componentId && { component_id: componentId }),
  }), [status, componentId])

  const handleFilter = (setter) => (e) => { setter(e.target.value); setPage(1) }

  const handleSort = (column) => {
    setOrderBy((prev) => ({
      column,
      direction: prev.column === column && prev.direction === "desc" ? "asc" : "desc",
    }))
    setPage(1)
  }

  const clearAll = () => { setStatus(""); setComponentId(""); setPage(1) }
  const isFiltered = !!(status || componentId)

  const { items, total, totalPages, loading, error } = useRisks(filters, page, SIZE, orderBy)
  const { options: components, loading: componentsLoading } = useComponentsOptions()

  // ── Matrix view state — only its own hook, no filters/pagination shared with list ──
  const { cells: matrixCells, loading: matrixLoading, error: matrixError } = useRiskMatrix()

  const maxPercent = matrixCells && matrixCells.length ? Math.max(...matrixCells.map((c) => c.percent)) : 0

  const matrixStats = useMemo(() => {
    if (!matrixCells) return null
    const bucket = (min, max) =>
      matrixCells
        .filter((c) => {
          const s = c.significance * c.occurence
          return s >= min && (max === undefined || s < max)
        })
        .reduce((sum, c) => sum + c.percent, 0)

    return {
      critical: bucket(6),
      high: bucket(3, 6),
      low: bucket(0, 3),
    }
  }, [matrixCells])

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold text-foreground tracking-tight">Risks</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {view === "list"
              ? (loading ? "Loading…" : `${total} risk${total !== 1 ? "s" : ""} registered`)
              : "Organization-wide risk assessment"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ViewToggle view={view} onChange={setView} />
          <button
            onClick={() => navigate("/risks/create")}
            className="flex items-center gap-1.5 text-xs font-medium px-3.5 py-2 rounded-lg bg-[#3B1F6A] hover:bg-[#52298F] text-white transition-colors shrink-0"
          >
            <Plus className="size-3.5" /> Add risk
          </button>
        </div>
      </div>

      {/* ───────────────────────── List view ───────────────────────── */}
      {view === "list" && (
        <>
          {/* Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <select value={status} onChange={handleFilter(setStatus)} className={SELECT_CLS}>
              <option value="">All statuses</option>
              {Object.entries(STATUS_CONFIG).map(([val, cfg]) => (
                <option key={val} value={val}>{cfg.label}</option>
              ))}
            </select>

            <select value={componentId} onChange={handleFilter(setComponentId)} disabled={componentsLoading} className={SELECT_CLS}>
              <option value="">All components</option>
              {components?.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            {isFiltered && (
              <button onClick={clearAll} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors ml-auto">
                <X className="size-3" /> Clear filters
              </button>
            )}
          </div>

          {/* Table */}
          <div className="rounded-xl border border-border bg-card overflow-hidden">

            {loading && (
              <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                <span className="text-sm">Loading risks…</span>
              </div>
            )}

            {!loading && error && (
              <div className="flex items-center justify-center gap-2 py-16 text-destructive">
                <AlertCircle className="size-4" />
                <span className="text-sm">Failed to load risks.</span>
              </div>
            )}

            {!loading && !error && (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/20">
                    <th className="text-left px-5 py-3 whitespace-nowrap">
                      <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Ref</span>
                    </th>
                    <th className="text-left px-5 py-3 whitespace-nowrap">
                      <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Description</span>
                    </th>
                    <th className="text-left px-5 py-3 whitespace-nowrap">
                      <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Status</span>
                    </th>
                    <th className="text-left px-5 py-3 whitespace-nowrap">
                      <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Sig</span>
                    </th>
                    <th className="text-left px-5 py-3 whitespace-nowrap">
                      <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Occ</span>
                    </th>
                    <th className="text-left px-5 py-3 whitespace-nowrap">
                      <SortButton column="score" label="Score" orderBy={orderBy} onSort={handleSort} />
                    </th>
                    <th className="text-left px-5 py-3 whitespace-nowrap">
                      <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Zone</span>
                    </th>
                    <th className="text-left px-5 py-3 whitespace-nowrap">
                      <SortButton column="created_at" label="Created" orderBy={orderBy} onSort={handleSort} />
                    </th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-16 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <div className="flex size-10 items-center justify-center rounded-xl bg-muted">
                            <ShieldAlert className="size-4 text-muted-foreground/40" />
                          </div>
                          <p className="text-sm text-muted-foreground">No risks found.</p>
                          {isFiltered && (
                            <button onClick={clearAll} className="text-xs text-[#7B3FBE] hover:underline mt-1">
                              Clear filters
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    items.map((risk) => (
                      <tr
                        key={risk.id}
                        onClick={() => navigate(`/risks/${risk.id}`)}
                        className="group border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors cursor-pointer"
                      >
                        {/* Ref */}
                        <td className="px-5 py-3.5">
                          <span className="text-[11px] font-semibold text-[#7B3FBE] bg-[#EDE9F8] dark:bg-accent dark:text-foreground px-2 py-0.5 rounded font-mono">
                            {risk.risk_ref}
                          </span>
                        </td>

                        {/* Description */}
                        <td className="px-5 py-3.5 max-w-[220px]">
                          <p className="text-xs text-muted-foreground truncate">
                            {risk.risk_description || "—"}
                          </p>
                        </td>

                        {/* Status */}
                        <td className="px-5 py-3.5">
                          <StatusPill status={risk.status} />
                        </td>

                        {/* Significance */}
                        <td className="px-5 py-3.5">
                          <LevelBar value={risk.significance} />
                        </td>

                        {/* Occurrence */}
                        <td className="px-5 py-3.5">
                          <LevelBar value={risk.occurence} />
                        </td>

                        {/* Score */}
                        <td className="px-5 py-3.5">
                          <span className={`text-sm font-semibold ${
                            risk.score >= 6 ? "text-red-600 dark:text-red-400" :
                            risk.score >= 3 ? "text-amber-600 dark:text-amber-400" :
                            "text-emerald-600 dark:text-emerald-400"
                          }`}>
                            {risk.score}
                          </span>
                        </td>

                        {/* Zone */}
                        <td className="px-5 py-3.5">
                          <ZonePill score={risk.score} />
                        </td>

                        {/* Created — empty column, sorted via header */}
                        <td className="px-5 py-3.5" />

                        {/* Action */}
                        <td className="px-5 py-3.5 w-px">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex justify-end">
                            <button
                              onClick={(e) => { e.stopPropagation(); navigate(`/risks/${risk.id}`) }}
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
        </>
      )}

      {/* ───────────────────────── Heat map view ───────────────────────── */}
      {view === "matrix" && (
        <>
          {matrixLoading && (
            <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              <span className="text-sm">Loading risk matrix…</span>
            </div>
          )}

          {!matrixLoading && matrixError && (
            <div className="flex items-center justify-center gap-2 py-16 text-destructive">
              <AlertCircle className="size-4" />
              <span className="text-sm">Failed to load risk matrix.</span>
            </div>
          )}

          {!matrixLoading && !matrixError && (
            <div className="max-w space-y-4">
              {/* Stats */}
              {matrixStats && (
                <div className="grid grid-cols-3 gap-3">
                  <MatrixStatCard label="Critical" value={`${matrixStats.critical.toFixed(1)}%`} sublabel="Score 6–9" icon={Activity} tone="critical" />
                  <MatrixStatCard label="High" value={`${matrixStats.high.toFixed(1)}%`} sublabel="Score 3–5" icon={TrendingUp} tone="high" />
                  <MatrixStatCard label="Low" value={`${matrixStats.low.toFixed(1)}%`} sublabel="Score 1–2" icon={Target} tone="low" />
                </div>
              )}

              {/* Heat map */}
              <div className="rounded-lg border border-border bg-card overflow-hidden">
                <div className="px-4 py-3 border-b border-border">
                  <h2 className="text-xs font-semibold text-foreground">Risk assessment matrix</h2>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Distribution of risks across occurrence and significance</p>
                </div>

                <div className="p-4">
                  {/* Legend */}
                  <div className="flex gap-3 mb-3">
                    {["critical", "high", "low"].map((z) => (
                      <div key={z} className="flex items-center gap-1.5">
                        <div className={`size-2 rounded-sm ${MATRIX_ZONE[z].dot}`} />
                        <span className="text-[10px] text-muted-foreground">{MATRIX_ZONE[z].label}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2 justify-center">
                    {/* Y-axis */}
                    <div className="flex items-center justify-center w-3 shrink-0">
                      <span
                        className="text-[8px] font-semibold uppercase tracking-widest text-muted-foreground"
                        style={{ writingMode: "vertical-lr", transform: "rotate(180deg)" }}
                      >
                        Significance
                      </span>
                    </div>

                    <div>
                      {/* Column headers */}
                      <div className="grid gap-1.5 mb-1.5" style={{ gridTemplateColumns: "32px repeat(3, 48px)" }}>
                        <div />
                        {OCC_COLS.map((o) => (
                          <div key={o} className="text-center">
                            <p className="text-[8px] font-semibold uppercase tracking-widest text-muted-foreground">{OCC_LABELS[o]}</p>
                          </div>
                        ))}
                      </div>

                      {/* Rows */}
                      <div className="space-y-1.5">
                        {SIG_ROWS.map((s) => (
                          <div key={s} className="grid gap-1.5 items-center" style={{ gridTemplateColumns: "32px repeat(3, 48px)" }}>
                            <div className="flex items-center justify-end pr-1.5">
                              <span className="text-[8px] font-semibold uppercase tracking-widest text-muted-foreground">{SIG_LABELS[s]}</span>
                            </div>
                            {OCC_COLS.map((o) => {
                              const cell = matrixCells?.find((c) => c.occurence === o && c.significance === s)
                              return <MatrixCell key={`${s}-${o}`} cell={cell} maxPercent={maxPercent} />
                            })}
                          </div>
                        ))}
                      </div>

                      <div className="text-center mt-2">
                        <span className="text-[8px] font-semibold uppercase tracking-widest text-muted-foreground">← Occurrence →</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* How to read */}
              <div className="rounded-lg border border-border bg-card p-4">
                <h3 className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">How to read this matrix</h3>
                <div className="grid grid-cols-2 gap-3 text-[11px]">
                  <div>
                    <p className="font-semibold text-foreground mb-0.5">Occurrence (horizontal)</p>
                    <p className="text-muted-foreground">How frequently the risk is expected to occur.</p>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground mb-0.5">Significance (vertical)</p>
                    <p className="text-muted-foreground">The potential impact of the risk if it occurs.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default Risks