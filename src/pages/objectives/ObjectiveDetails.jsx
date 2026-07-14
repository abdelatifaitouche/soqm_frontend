import React, { useState, useMemo, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { AlertCircle, Loader2, ArrowRight, Plus, Pencil, ChevronLeft, ChevronRight, ArrowDownUp } from "lucide-react"
import { useObjective } from "@/hooks/useObjective"
import { useObjectiveRisks } from "@/hooks/useObjectiveRisks"
import { useRole } from "@/hooks/useRole"
import ObjectiveHeader from "./components/ObjectiveHeader"
import ObjectiveCard from "./components/ObjectiveCard"

// ── Config ───────────────────────────────────────────────────────────────────

const STATUS_OPTIONS = [
  { value: "",                 label: "All statuses" },
  { value: "identified",       label: "Identified" },
  { value: "assessed",         label: "Assessed" },
  { value: "treatment_planned",label: "Treatment planned" },
  { value: "mitigated",        label: "Mitigated" },
  { value: "accepted",         label: "Accepted" },
  { value: "under_review",     label: "Under review" },
  { value: "closed",           label: "Closed" },
]

// Backend order_by only supports "score" | "created_at", and direction is
// uppercase ("ASC"/"DESC") — matching OrderByEnum / OrderDirection exactly.
const SORT_OPTIONS = [
  { order_by: "created_at", direction: "desc", label: "Newest first" },
  { order_by: "created_at", direction: "asc",  label: "Oldest first" },
  { order_by: "score",      direction: "desc", label: "Highest score first" },
  { order_by: "score",      direction: "asc",  label: "Lowest score first" },
]

const SELECT_CLS =
  "h-9 rounded-lg border border-input bg-card px-3 text-xs text-foreground outline-none focus:ring-2 focus:ring-[#7B3FBE] transition-colors cursor-pointer"

// ── Score badge ───────────────────────────────────────────────────────────────
function ScoreBadge({ score }) {
  const cfg =
    score >= 6 ? "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400" :
    score >= 3 ? "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400" :
                 "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
  return (
    <span className={`inline-flex items-center text-[11px] font-semibold px-2.5 py-1 rounded-full ${cfg}`}>
      Score {score}
    </span>
  )
}

// ── Dot bar for significance / occurrence ─────────────────────────────────────
function DotBar({ value, max = 3 }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex gap-1">
        {Array.from({ length: max }).map((_, i) => (
          <div
            key={i}
            className={`size-2 rounded-sm ${
              i < value
                ? "bg-[#7B3FBE]"
                : "bg-muted border border-border"
            }`}
          />
        ))}
      </div>
      <span className="text-xs text-muted-foreground">{value} / {max}</span>
    </div>
  )
}

// ── Pagination ─────────────────────────────────────────────────────────────────
function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null

  const pages = useMemo(() => {
    const set = new Set([1, totalPages, page - 1, page, page + 1])
    return [...set].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b)
  }, [page, totalPages])

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
          <React.Fragment key={p}>
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
          </React.Fragment>
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

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ObjectiveDetails() {
  const { id }      = useParams()
  const navigate    = useNavigate()
  const { isAdmin } = useRole()

  const { objective, loading: objLoading, error: objError, setOjective } = useObjective(id)

  const [statusFilter, setStatusFilter] = useState("")
  const [sortIndex, setSortIndex]       = useState(0) // index into SORT_OPTIONS, defaults to "Newest first"
  const [page, setPage]                 = useState(1)

  const sort = SORT_OPTIONS[sortIndex]

  // objective_id is now baked into the endpoint path (/risks/objective/{id}/risks),
  // not a filter — only score/status/component_id go in `filters` per RiskFilters.
  const filters = useMemo(() => ({
    ...(statusFilter && { status: statusFilter }),
  }), [statusFilter])

  // Status or sort change invalidates the current page.
  useEffect(() => {
    setPage(1)
  }, [statusFilter, sortIndex])

  const {
    risks,
    total,
    totalPages,
    loading: riskLoading,
    error: riskError,
  } = useObjectiveRisks(id, filters, page, { order_by: sort.order_by, direction: sort.direction })

  const highestScore = risks?.length ? Math.max(...risks.map(r => r.score)) : 0
  const avgScore     = risks?.length ? (risks.reduce((s, r) => s + r.score, 0) / risks.length).toFixed(1) : "—"

  if (objLoading) return (
    <div className="flex items-center justify-center h-64 text-muted-foreground gap-2">
      <Loader2 className="size-4 animate-spin" /><span className="text-sm">Loading objective…</span>
    </div>
  )

  if (objError || !objective) return (
    <div className="flex items-center justify-center h-64 text-destructive gap-2">
      <AlertCircle className="size-4" /><span className="text-sm">Objective not found.</span>
    </div>
  )

  return (
    <div className="space-y-5">
      {/* Page header */}
      <ObjectiveHeader objective={objective} isAdmin={isAdmin} setOjective={setOjective}/>

      {/* Objective card */}
      <ObjectiveCard objective={objective} />

      {/* Risk summary strip — `total` now comes scoped to this objective directly
          from /risks/objective/{id}/risks, so it's accurate (unlike the old
          /risks?objective_id= endpoint's unfiltered total). */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total risks",   value: total ?? 0,  color: "text-foreground" },
          { label: "Highest score", value: risks?.length ? highestScore : "—", color: highestScore >= 6 ? "text-red-600 dark:text-red-400" : highestScore >= 3 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400", suffix: risks?.length ? ` / 9` : "" },
          { label: "Avg score (this page)", value: avgScore, color: "text-amber-600 dark:text-amber-400" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card px-5 py-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">{s.label}</p>
            <p className={`text-2xl font-medium ${s.color}`}>
              {s.value}
              {s.suffix && <span className="text-sm font-normal text-muted-foreground">{s.suffix}</span>}
            </p>
          </div>
        ))}
      </div>

      {/* Risks table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-wrap gap-3">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Linked risks</h2>
            <p className="text-xs text-muted-foreground mt-0.5">All risks associated with this objective</p>
          </div>

          <div className="flex items-center gap-2">
            {/* Status filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={SELECT_CLS}
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>

            {/* Sort */}
            <div className="flex items-center gap-1.5">
              <ArrowDownUp className="size-3.5 text-muted-foreground" />
              <select
                value={sortIndex}
                onChange={(e) => setSortIndex(Number(e.target.value))}
                className={SELECT_CLS}
              >
                {SORT_OPTIONS.map((o, i) => (
                  <option key={i} value={i}>{o.label}</option>
                ))}
              </select>
            </div>

            <button
              onClick={() => navigate(`/risks/create?objective_id=${objective.id}`)}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-[#3B1F6A] hover:bg-[#52298F] text-white transition-colors"
            >
              <Plus className="size-3" /> Add risk
            </button>
          </div>
        </div>

        {riskLoading ? (
          <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /><span className="text-sm">Loading risks…</span>
          </div>
        ) : riskError ? (
          <div className="py-12 text-center text-destructive text-sm">Failed to load risks.</div>
        ) : !risks?.length ? (
          <div className="py-14 text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              {statusFilter ? "No risks match this filter." : "No risks linked to this objective yet."}
            </p>
            <button
              onClick={() => navigate(`/risks/create?objective_id=${objective.id}`)}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#7B3FBE] hover:underline mt-1"
            >
              <Plus className="size-3.5" /> Add risk
            </button>
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/20">
                  {["Ref", "Description", "Significance", "Occurrence", "Score", ""].map((h) => (
                    <th key={h} className="text-left text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-4 py-3">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {risks?.map((risk) => (
                  <tr
                    key={risk.id}
                    className="group border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors"
                  >
                    <td className="px-4 py-3.5">
                      <span className="text-[11px] font-semibold text-[#7B3FBE] bg-[#EDE9F8] dark:bg-accent dark:text-foreground px-2 py-0.5 rounded-md font-mono">
                        {risk.risk_ref}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 max-w-[180px]">
                      <span className="text-xs text-muted-foreground truncate block">{risk.risk_description ?? "—"}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <DotBar value={risk.significance} />
                    </td>
                    <td className="px-4 py-3.5">
                      <DotBar value={risk.occurence} />
                    </td>
                    <td className="px-4 py-3.5">
                      <ScoreBadge score={risk.score} />
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        {isAdmin && (
                          <button
                            onClick={() => navigate(`/risks/${risk.id}/edit`)}
                            className="flex size-7 items-center justify-center rounded-md hover:bg-[#EDE9F8] dark:hover:bg-accent text-muted-foreground hover:text-[#3B1F6A] dark:hover:text-foreground transition-colors"
                            title="Edit risk"
                          >
                            <Pencil className="size-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => navigate(`/risks/${risk.id}`)}
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

            <Pagination page={page} totalPages={totalPages} onChange={setPage} />
          </>
        )}
      </div>
    </div>
  )
}