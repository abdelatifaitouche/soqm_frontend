import { useRiskMatrix } from "@/hooks/useRiskMatrix"
import React from "react"
import { Loader2, AlertCircle, TrendingUp, Activity, Target } from "lucide-react"

const SIG_LABELS = { 1: "Low", 2: "Medium", 3: "High" }
const OCC_LABELS = { 1: "Low", 2: "Medium", 3: "High" }
const SIG_ROWS = [3, 2, 1]
const OCC_COLS = [1, 2, 3]

// Grant Thornton–inspired accents used sparingly alongside the traffic-light zone colors
const GT_PURPLE = "#5A2D82"
const GT_ORANGE = "#F6871F"

const ZONE = {
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

function getRiskZone(significance, occurrence) {
  const score = significance * occurrence
  if (score >= 6) return "critical"
  if (score >= 3) return "high"
  return "low"
}

function MatrixCell({ cell, maxPercent }) {
  if (!cell) {
    return <div className="w-12 h-12 rounded-md border border-dashed border-border/60 bg-muted/30" />
  }

  const zone = getRiskZone(cell.significance, cell.occurence)
  const z = ZONE[zone]
  const score = cell.significance * cell.occurence
  const opacity = maxPercent > 0 ? Math.min(cell.percent / maxPercent, 1) : 0

  return (
    <div
      className={`group relative w-12 h-12 rounded-md border ${z.cell} flex flex-col items-center justify-center transition-all hover:-translate-y-0.5 hover:shadow-sm cursor-pointer`}
      style={{ backgroundColor: z.tint(opacity) }}
    >
      <p className={`text-[11px] font-semibold ${z.text}`}>{cell.percent.toFixed(1)}%</p>
      <p className="text-[8px] text-muted-foreground leading-none mt-0.5">S{score}</p>

      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
        <div className="bg-foreground text-background text-[10px] font-medium px-2.5 py-1.5 rounded-md whitespace-nowrap">
          {cell.percent.toFixed(1)}% of risks · {z.label}
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, sublabel, icon: Icon, tone }) {
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

export default function Matrix() {
  const { cells, loading, error } = useRiskMatrix()

  const maxPercent = cells && cells.length ? Math.max(...cells.map((c) => c.percent)) : 0

  const stats = React.useMemo(() => {
    if (!cells) return null
    const bucket = (min, max) =>
      cells
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
  }, [cells])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground mx-auto mb-3" />
          <p className="text-xs text-muted-foreground">Loading risk matrix…</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <AlertCircle className="size-6 text-red-500 mx-auto mb-3" />
          <p className="text-xs text-muted-foreground">Failed to load risk matrix</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-background">
      <div className="max-w mx-auto space-y-4">
        {/* Header */}
        <div>
          <h1 className="text-base font-semibold text-foreground" style={{ color: GT_PURPLE }}>
            Risk matrix
          </h1>
          <p className="text-xs text-muted-foreground">Organization-wide risk assessment</p>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-3 gap-3">
            <StatCard label="Critical" value={`${stats.critical.toFixed(1)}%`} sublabel="Score 6–9" icon={Activity} tone="critical" />
            <StatCard label="High" value={`${stats.high.toFixed(1)}%`} sublabel="Score 3–5" icon={TrendingUp} tone="high" />
            <StatCard label="Low" value={`${stats.low.toFixed(1)}%`} sublabel="Score 1–2" icon={Target} tone="low" />
          </div>
        )}

        {/* Heat map */}
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border" style={{ borderTopColor: GT_ORANGE, borderTopWidth: 2 }}>
            <h2 className="text-xs font-semibold text-foreground">Risk assessment matrix</h2>
            <p className="text-[10px] text-muted-foreground mt-0.5">Distribution of risks across occurrence and significance</p>
          </div>

          <div className="p-4">
            {/* Legend */}
            <div className="flex gap-3 mb-3">
              {["critical", "high", "low"].map((z) => (
                <div key={z} className="flex items-center gap-1.5">
                  <div className={`size-2 rounded-sm ${ZONE[z].dot}`} />
                  <span className="text-[10px] text-muted-foreground">{ZONE[z].label}</span>
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
                        const cell = cells?.find((c) => c.occurence === o && c.significance === s)
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
    </div>
  )
}