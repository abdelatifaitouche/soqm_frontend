import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  Plus, Loader2, AlertCircle, ArrowUpRight, Calendar, X,
  ChevronLeft, ChevronRight, CircleDashed,
} from "lucide-react"
import { useObjectives } from "@/features/objectives/hooks/useObjectives"
import { formatDate } from "@/utils/formatDate"
import { useComponentsOptions } from "@/features/isqm_components/hooks/useComponentsOptions"
import STATUS_CONFIG from "@/features/objectives/data/states"
import Pagination from "@/shared/components/Pagination"


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



// ── Main ──────────────────────────────────────────────────────────────────────

function Objectives() {
  const navigate                      = useNavigate()
  const [page, setPage]               = useState(1)
  const [status, setStatus]           = useState("")
  const [componentId, setComponentId] = useState("")

  const handleStatusChange    = (val) => { setStatus(val);      setPage(1) }
  const handleComponentChange = (val) => { setComponentId(val); setPage(1) }
  const clearAll = () => { setStatus(""); setComponentId(""); setPage(1) }

  const { items, total, totalPages, loading, error } = useObjectives({page, status, componentId})
  const { options: components, loading: componentsLoading } = useComponentsOptions()

  const isFiltered = !!(status || componentId)

  
  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground tracking-tight">
            Quality Objectives
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {loading ? "Loading…" : `${total} objective${total !== 1 ? "s" : ""} registered`}
          </p>
        </div>
        <button
          onClick={() => navigate("/objectives/create")}
          className="flex items-center gap-1.5 text-xs font-medium px-3.5 py-2 rounded-lg bg-[#3B1F6A] hover:bg-[#52298F] text-white transition-colors shrink-0"
        >
          <Plus className="size-3.5" /> Add objective
        </button>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <select
          value={status}
          onChange={(e) => handleStatusChange(e.target.value)}
          className="h-9 rounded-lg border border-input bg-card px-3 text-xs text-foreground outline-none focus:ring-2 focus:ring-[#7B3FBE] transition-colors cursor-pointer"
        >
          <option value="">All statuses</option>
          {Object.entries(STATUS_CONFIG).map(([val, cfg]) => (
            <option key={val} value={val}>{cfg.label}</option>
          ))}
        </select>

        <select
          value={componentId}
          onChange={(e) => handleComponentChange(e.target.value)}
          disabled={componentsLoading}
          className="h-9 rounded-lg border border-input bg-card px-3 text-xs text-foreground outline-none focus:ring-2 focus:ring-[#7B3FBE] transition-colors cursor-pointer disabled:opacity-50"
        >
          <option value="">All components</option>
          {components?.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
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

      {/* Table card */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">

        {/* Loading overlay */}
        {loading && (
          <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            <span className="text-sm">Loading objectives…</span>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="flex items-center justify-center gap-2 py-16 text-destructive">
            <AlertCircle className="size-4" />
            <span className="text-sm">Failed to load objectives.</span>
          </div>
        )}

        {/* Table */}
        {!loading && !error && (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/20">
                {["Ref", "Status", "Review date", "Component", ""].map((h) => (
                  <th
                    key={h}
                    className="text-left text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-5 py-3 whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="flex size-10 items-center justify-center rounded-xl bg-muted">
                        <CircleDashed className="size-4 text-muted-foreground/40" />
                      </div>
                      <p className="text-sm text-muted-foreground">No objectives found.</p>
                      <button
                        onClick={() => navigate("/objectives/create")}
                        className="text-xs text-[#7B3FBE] hover:underline mt-1"
                      >
                        Create the first one
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                items.map((obj) => (
                  <tr
                    key={obj.id}
                    onClick={() => navigate(`/objectives/${obj.id}`)}
                    className="group border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors cursor-pointer"
                  >
                    {/* Ref */}
                    <td className="px-5 py-3.5">
                      <span className="text-[11px] font-semibold text-[#7B3FBE] bg-[#EDE9F8] dark:bg-accent dark:text-foreground px-2 py-0.5 rounded font-mono">
                        {obj.objective_reference}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-3.5">
                      <StatusPill status={obj.status} />
                    </td>

                    {/* Review date */}
                    <td className="px-5 py-3.5">
                      {obj.review_date ? (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Calendar className="size-3 shrink-0" />
                          {formatDate(obj.review_date)}
                        </div>
                      ) : (
                        <span className="text-muted-foreground/40 text-xs">—</span>
                      )}
                    </td>

                    {/* Component */}
                    <td className="px-5 py-3.5">
                      {obj.component_name ? (
                        <span className="text-xs text-muted-foreground">{obj.component_name}</span>
                      ) : (
                        <span className="text-muted-foreground/40 text-xs">—</span>
                      )}
                    </td>

                    {/* Action */}
                    <td className="px-5 py-3.5 w-px">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex justify-end">
                        <button
                          onClick={(e) => { e.stopPropagation(); navigate(`/objectives/${obj.id}`) }}
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

        {/* Pagination */}
        {!loading && !error && (
          <Pagination
            page={page}
            totalPages={totalPages}
            total={total}
            onPageChange={setPage}
            loading={loading}
          />
        )}
      </div>
    </div>
  )
}

export default Objectives