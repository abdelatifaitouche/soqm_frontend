import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { AlertTriangle, Shield, X, Plus, ArrowRight, ArrowUpRight, ChevronRight } from "lucide-react"
import { useRisks } from "@/hooks/useRisks"
import { useComponents } from "@/hooks/useComponents"
import { useObjectives } from "@/hooks/useObjectives"
import { Loader2, AlertCircle } from "lucide-react"

// ── Constants ─────────────────────────────────────────────────────────────────
const SIG_LABELS = { 3: "High", 2: "Med", 1: "Low" }
const OCC_LABELS = { 1: "Low",  2: "Med", 3: "High" }
const SIG_ROWS   = [3, 2, 1]
const OCC_COLS   = [1, 2, 3]

const STATUS_OPTIONS = ["open", "mitigated", "closed", "accepted"]

function getZone(significance, occurrence) {
  const score = significance * occurrence
  if (score >= 6) return "critical"
  if (score >= 3) return "high"
  return "low"
}

const ZONE = {
  critical: {
    label:    "Critical",
    cell:     "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-900",
    chip:     "bg-red-100 text-red-800 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900",
    badge:    "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400",
    stat:     "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-900",
    dot:      "bg-red-400",
    score:    "text-red-700 dark:text-red-400",
    pip:      "#E24B4A",
  },
  high: {
    label:    "High",
    cell:     "bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900",
    chip:     "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900",
    badge:    "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400",
    stat:     "bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900",
    dot:      "bg-amber-400",
    score:    "text-amber-700 dark:text-amber-400",
    pip:      "#BA7517",
  },
  low: {
    label:    "Low",
    cell:     "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900",
    chip:     "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900",
    badge:    "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400",
    stat:     "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900",
    dot:      "bg-emerald-400",
    score:    "text-emerald-700 dark:text-emerald-400",
    pip:      "#1D9E75",
  },
}

// ── DotBar ────────────────────────────────────────────────────────────────────
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

// ── Risk chip (inside matrix cell) ────────────────────────────────────────────
function RiskChip({ risk, onClick }) {
  const zone = getZone(risk.significance, risk.occurence)
  const z    = ZONE[zone]
  return (
    <button
      onClick={() => onClick(risk)}
      className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold border font-mono transition-transform hover:-translate-y-0.5 ${z.chip}`}
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
          <span className="text-xs text-muted-foreground/40">—</span>
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
        {/* Header */}
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

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">Description</p>
            <p className="text-sm text-foreground leading-relaxed">
              {risk.risk_discription || "No description provided."}
            </p>
          </div>

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

        {/* Footer */}
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

// ── Main page ─────────────────────────────────────────────────────────────────
export default function RiskMatrix() {
  const navigate = useNavigate()

  const [filters, setFilters]       = useState({ component_id: "", objective_id: "", status: "" })
  const [filterZone, setFilterZone] = useState("all")
  const [selectedRisk, setSelectedRisk] = useState(null)

  // Build API params — only send non-empty values
  const apiParams = Object.fromEntries(
    Object.entries(filters).filter(([, v]) => v !== "")
  )

  const { risks, loading, error }    = useRisks(apiParams)
  const { components }               = useComponents()
  const { objectives }               = useObjectives()

  const setFilter = (key) => (e) => setFilters((f) => ({ ...f, [key]: e.target.value }))

  const clearFilters = () => {
    setFilters({ component_id: "", objective_id: "", status: "" })
    setFilterZone("all")
  }

  const hasFilters = Object.values(filters).some(Boolean) || filterZone !== "all"

  // Zone counts
  const counts = { critical: 0, high: 0, low: 0 }
  risks.forEach((r) => counts[getZone(r.significance, r.occurence)]++)

  // Apply zone filter on top of API results
  const visibleRisks =
    filterZone === "all"
      ? risks
      : risks.filter((r) => getZone(r.significance, r.occurence) === filterZone)

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-muted-foreground gap-2">
      <Loader2 className="size-4 animate-spin" />
      <span className="text-sm">Loading risk matrix…</span>
    </div>
  )

  if (error) return (
    <div className="flex items-center justify-center h-64 text-destructive gap-2">
      <AlertCircle className="size-4" />
      <span className="text-sm">Failed to load risks.</span>
    </div>
  )

  return (
    <>
      <div className="space-y-5">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-foreground tracking-tight">Risk Matrix</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {risks.length} risk{risks.length !== 1 ? "s" : ""} registered · Significance × Occurrence
            </p>
          </div>
          <button
            onClick={() => navigate("/risks/create")}
            className="flex items-center gap-1.5 text-xs font-medium px-3.5 py-2 rounded-lg bg-[#3B1F6A] hover:bg-[#52298F] text-white transition-colors shrink-0"
          >
            <Plus className="size-3.5" /> Add risk
          </button>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-3 gap-3">
          {(["critical", "high", "low"]).map((zone) => {
            const z        = ZONE[zone]
            const isActive = filterZone === zone
            return (
              <button
                key={zone}
                onClick={() => setFilterZone(isActive ? "all" : zone)}
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
                <p className="text-2xl font-medium text-foreground">{counts[zone]}</p>
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
            {components.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <select
            value={filters.objective_id}
            onChange={setFilter("objective_id")}
            className="h-9 rounded-lg border border-input bg-card px-3 text-xs text-foreground outline-none focus:ring-2 focus:ring-[#7B3FBE] transition-colors"
          >
            <option value="">All objectives</option>
            {objectives.map((o) => (
              <option key={o.id} value={o.id}>
                {o.objective_text?.slice(0, 50)}{o.objective_text?.length > 50 ? "…" : ""}
              </option>
            ))}
          </select>

          <select
            value={filters.status}
            onChange={setFilter("status")}
            className="h-9 rounded-lg border border-input bg-card px-3 text-xs text-foreground outline-none focus:ring-2 focus:ring-[#7B3FBE] transition-colors"
          >
            <option value="">All statuses</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s} className="capitalize">{s}</option>
            ))}
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

        {/* Matrix + list */}
        <div className="grid grid-cols-1 xl:grid-cols-[400px_1fr] gap-4">

          {/* Heat map */}
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h2 className="text-sm font-semibold text-foreground">Heat map</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Click a chip to quick-view the risk</p>
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
                  {/* Col headers */}
                  <div className="grid gap-1 mb-1" style={{ gridTemplateColumns: "40px 1fr 1fr 1fr" }}>
                    <div />
                    {["Low occ.", "Med occ.", "High occ."].map((l) => (
                      <div key={l} className="text-center text-[9px] font-semibold uppercase tracking-widest text-muted-foreground">{l}</div>
                    ))}
                  </div>

                  {/* Rows */}
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
                            risks={visibleRisks}
                            onChipClick={setSelectedRisk}
                          />
                        ))}
                      </div>
                    ))}
                  </div>

                  {/* X-axis */}
                  <div className="text-center mt-2">
                    <span className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground">
                      ← Occurrence →
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Risk register */}
          <div className="rounded-xl border border-border bg-card overflow-hidden">
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
                  {visibleRisks.length} risk{visibleRisks.length !== 1 ? "s" : ""}
                  {filterZone !== "all" ? " · filtered" : ""}
                </p>
              </div>
              {filterZone !== "all" && (
                <button
                  onClick={() => setFilterZone("all")}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="size-3" /> Clear
                </button>
              )}
            </div>

            {visibleRisks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-2">
                <Shield className="size-6 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">No risks found for the current filters.</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/20">
                    {["Ref", "Description", "Sig", "Occ", "Score", "Zone", ""].map((h) => (
                      <th key={h} className="text-left text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-4 py-3">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visibleRisks.map((risk) => {
                    const zone = getZone(risk.significance, risk.occurence)
                    const z    = ZONE[zone]
                    return (
                      <tr
                        key={risk.id}
                        className="group border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors cursor-pointer"
                        onClick={() => setSelectedRisk(risk)}
                      >
                        <td className="px-4 py-3">
                          <span className="text-[11px] font-semibold text-[#7B3FBE] bg-[#EDE9F8] dark:bg-accent dark:text-foreground px-2 py-0.5 rounded font-mono">
                            {risk.risk_ref}
                          </span>
                        </td>
                        <td className="px-4 py-3 max-w-[180px]">
                          <span className="text-xs text-muted-foreground truncate block">
                            {risk.risk_discription || "—"}
                          </span>
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
            )}
          </div>
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