import { useState, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import {
  Plus, Loader2, AlertCircle, ArrowUpRight, X,
  CircleDashed, ShieldAlert,
  ChevronDown, ChevronUp,
  List as ListIcon, LayoutGrid,
} from "lucide-react"
import { useRisks } from "@/features/risks/hooks/useRisks"
import { useComponentsOptions } from "@/features/isqm_components/hooks/useComponentsOptions"
import { useRiskMatrix } from "@/features/risks/hooks/useRiskMatrix"
import STATUS_CONFIG from "@/features/risks/data/states"
import Pagination from "@/shared/components/Pagination"

// ── Zone helpers (list view) ──────────────────────────────────────────────────

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
// orderBy carries a `columns` list rather than a single `column`. A sort button
// is "active" only when it's the sole column currently applied — clicking any
// header collapses the ordering to that one column.

function SortButton({ column, label, orderBy, onSort }) {
  const active = orderBy.columns.length === 1 && orderBy.columns[0] === column
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
    range: "Score 6–9",
    dot: "bg-red-500",
    tint: (o) => `rgba(220, 38, 38, ${0.1 + o * 0.42})`,
  },
  high: {
    label: "High",
    range: "Score 3–5",
    dot: "bg-orange-500",
    tint: (o) => `rgba(249, 115, 22, ${0.1 + o * 0.42})`,
  },
  low: {
    label: "Low",
    range: "Score 1–2",
    dot: "bg-green-500",
    tint: (o) => `rgba(34, 197, 94, ${0.08 + o * 0.36})`,
  },
}

function getMatrixZone(significance, occurrence) {
  const score = significance * occurrence
  if (score >= 6) return "critical"
  if (score >= 3) return "high"
  return "low"
}

// Compact register-style cell: score in the corner, share of risks centred.
function MatrixCell({ cell, significance, occurrence, maxPercent }) {
  const zone = getMatrixZone(significance, occurrence)
  const z = MATRIX_ZONE[zone]
  const score = significance * occurrence
  const percent = cell?.percent ?? 0
  const empty = percent <= 0
  const intensity = maxPercent > 0 ? Math.min(percent / maxPercent, 1) : 0

  return (
    <div
      role="img"
      aria-label={`${SIG_LABELS[significance]} significance, ${OCC_LABELS[occurrence]} occurrence, score ${score}: ${
        empty ? "no risks" : `${percent.toFixed(1)}% of risks`
      }`}
      className={`relative h-14 rounded-md border flex items-center justify-center ${
        empty ? "border-dashed border-border/70 bg-muted/20" : "border-border/60"
      }`}
      style={empty ? undefined : { backgroundColor: z.tint(intensity) }}
    >
      <span className={`absolute left-1.5 top-1 text-[10px] tabular-nums ${empty ? "text-muted-foreground/40" : "text-foreground/50"}`}>
        {score}
      </span>
      <span className={`text-sm tabular-nums ${empty ? "text-muted-foreground/40" : "font-semibold text-foreground"}`}>
        {empty ? "–" : `${percent.toFixed(1)}%`}
      </span>
    </div>
  )
}

function ZoneRow({ zone, value }) {
  const z = MATRIX_ZONE[zone]
  return (
    <li>
      <div className="flex items-baseline justify-between text-xs">
        <span className="flex items-center gap-2 font-medium text-foreground">
          <span className={`size-2 rounded-sm ${z.dot}`} />
          {z.label}
          <span className="font-normal text-muted-foreground">{z.range}</span>
        </span>
        <span className="tabular-nums font-semibold text-foreground">{value.toFixed(1)}%</span>
      </div>
      <div className="mt-1.5 h-1 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full ${z.dot}`} style={{ width: `${Math.min(value, 100)}%` }} />
      </div>
    </li>
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

// Default ordering for the risks list — sequence_number then component_order,
// not created_at. Module-level constant so it's referentially stable.
const DEFAULT_ORDER_BY = { columns: ["sequence_number", "component_order"], direction: "desc" }

function Risks() {
  const navigate = useNavigate()

  const [view, setView] = useState("list") // "list" | "matrix"

  // ── List view state ──
  const [page,        setPage]        = useState(1)
  const [status,      setStatus]      = useState("")
  const [componentId, setComponentId] = useState("")
  const [orderBy,     setOrderBy]     = useState(DEFAULT_ORDER_BY)

  // ── Matrix view state — its own component filter, independent of the list ──
  const [matrixComponentId, setMatrixComponentId] = useState("")

  const filters = useMemo(() => ({
    ...(status      && { status }),
    ...(componentId && { component_id: componentId }),
  }), [status, componentId])

  const handleFilter = (setter) => (e) => { setter(e.target.value); setPage(1) }

  const handleSort = (column) => {
    setOrderBy((prev) => {
      const isActive = prev.columns.length === 1 && prev.columns[0] === column
      return {
        columns: [column],
        direction: isActive && prev.direction === "desc" ? "asc" : "desc",
      }
    })
    setPage(1)
  }

  const clearAll = () => {
    setStatus("")
    setComponentId("")
    setOrderBy(DEFAULT_ORDER_BY)
    setPage(1)
  }
  const isFiltered = !!(status || componentId)

  const { items, total, totalPages, loading, error } = useRisks(filters, page, SIZE, orderBy)
  const { options: components, loading: componentsLoading } = useComponentsOptions()

  // The hook should accept a component id (or null) and refetch when it changes.
  const { cells: matrixCells, loading: matrixLoading, error: matrixError } = useRiskMatrix(matrixComponentId || null)

  const maxPercent = matrixCells && matrixCells.length ? Math.max(...matrixCells.map((c) => c.percent)) : 0
  const hasMatrixData = !!matrixCells?.some((c) => c.percent > 0)
  // The hook starts with [] (not undefined), so "first load" means loading with nothing to show yet.
  const matrixInitialLoading = matrixLoading && !matrixCells?.length

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

  const matrixComponentName = components?.find((c) => c.id === matrixComponentId)?.name

  // Jump to the list, carrying the matrix's component filter with it.
  const openInList = () => {
    setComponentId(matrixComponentId)
    setStatus("")
    setPage(1)
    setView("list")
  }

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold text-foreground tracking-tight">Risks</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {view === "list"
              ? (loading ? "Loading…" : `${total} risk${total !== 1 ? "s" : ""} registered`)
              : matrixComponentName
                ? `Risk assessment for ${matrixComponentName}`
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
                      <SortButton column="component_order" label="Score" orderBy={orderBy} onSort={handleSort} />
                    </th>
                    <th className="text-left px-5 py-3 whitespace-nowrap">
                      <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Zone</span>
                    </th>
                    <th className="text-left px-5 py-3 whitespace-nowrap">
                      <SortButton column="created_at" label="Identified" orderBy={orderBy} onSort={handleSort} />
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

                        {/* Created */}
                        <td className="px-5 py-3.5">
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {risk.date_identified
                              ? new Date(risk.date_identified).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
                              : "—"}
                          </span>
                        </td>

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
        <section className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex items-center justify-between gap-3 flex-wrap px-5 py-3.5 border-b border-border">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Risk assessment matrix</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {matrixComponentName ?? "All components"} · share of risks by significance and occurrence
              </p>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={matrixComponentId}
                onChange={(e) => setMatrixComponentId(e.target.value)}
                disabled={componentsLoading}
                aria-label="Filter heat map by component"
                className={`${SELECT_CLS} !h-8`}
              >
                <option value="">All components</option>
                {components?.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              {matrixComponentId && (
                <button
                  onClick={() => setMatrixComponentId("")}
                  aria-label="Clear component filter"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="size-3.5" />
                </button>
              )}
              <button
                onClick={openInList}
                className="flex items-center gap-1 text-xs font-medium text-[#7B3FBE] hover:underline whitespace-nowrap"
              >
                View in list <ArrowUpRight className="size-3" />
              </button>
            </div>
          </div>

          {matrixInitialLoading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              <span className="text-sm">Loading risk matrix…</span>
            </div>
          ) : matrixError ? (
            <div className="flex items-center justify-center gap-2 py-12 text-destructive">
              <AlertCircle className="size-4" />
              <span className="text-sm">Failed to load risk matrix.</span>
            </div>
          ) : !hasMatrixData ? (
            <div className="flex flex-col items-center gap-2 py-12 text-center">
              <div className="flex size-10 items-center justify-center rounded-xl bg-muted">
                <LayoutGrid className="size-4 text-muted-foreground/40" />
              </div>
              <p className="text-sm text-muted-foreground">
                {matrixComponentId ? "No risks recorded for this component." : "No risks to plot yet."}
              </p>
            </div>
          ) : (
            <div
              className={`p-5 flex flex-col md:flex-row gap-6 md:gap-8 transition-opacity ${matrixLoading ? "opacity-60" : ""}`}
              aria-busy={matrixLoading}
            >
              {/* Matrix */}
              <div className="w-full md:w-[340px] shrink-0">
                <div className="flex gap-2">
                  <div className="flex items-center justify-center w-3 shrink-0">
                    <span
                      className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground whitespace-nowrap"
                      style={{ writingMode: "vertical-lr", transform: "rotate(180deg)" }}
                    >
                      Significance
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="grid gap-1 items-center" style={{ gridTemplateColumns: "36px repeat(3, minmax(0, 1fr))" }}>
                      {SIG_ROWS.map((s) => (
                        <div key={s} className="contents">
                          <span className="text-[10px] text-muted-foreground text-right pr-1.5">{SIG_LABELS[s]}</span>
                          {OCC_COLS.map((o) => (
                            <MatrixCell
                              key={`${s}-${o}`}
                              cell={matrixCells.find((c) => c.occurence === o && c.significance === s)}
                              significance={s}
                              occurrence={o}
                              maxPercent={maxPercent}
                            />
                          ))}
                        </div>
                      ))}

                      <span />
                      {OCC_COLS.map((o) => (
                        <span key={o} className="text-[10px] text-muted-foreground text-center pt-1">{OCC_LABELS[o]}</span>
                      ))}
                    </div>
                    <p className="text-center mt-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                      Occurrence
                    </p>
                  </div>
                </div>
              </div>

              {/* Summary */}
              {matrixStats && (
                <div className="flex-1 min-w-0 md:border-l md:border-border md:pl-8 flex flex-col">
                  <p className="text-xs font-medium text-muted-foreground mb-3">Distribution by zone</p>
                  <ul className="space-y-3.5">
                    <ZoneRow zone="critical" value={matrixStats.critical} />
                    <ZoneRow zone="high" value={matrixStats.high} />
                    <ZoneRow zone="low" value={matrixStats.low} />
                  </ul>

                  <div className="mt-4 pt-3 border-t border-border flex items-baseline justify-between text-xs">
                    <span className="text-muted-foreground">High or critical</span>
                    <span className="font-semibold tabular-nums text-foreground">
                      {(matrixStats.critical + matrixStats.high).toFixed(1)}%
                    </span>
                  </div>

                  <p className="mt-auto pt-4 text-[11px] leading-relaxed text-muted-foreground">
                    Rows show significance, columns show occurrence. Darker cells hold a larger share of risks;
                    the small number in each cell is its score.
                  </p>
                </div>
              )}
            </div>
          )}
        </section>
      )}
    </div>
  )
}

export default Risks