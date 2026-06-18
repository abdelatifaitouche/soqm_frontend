import React, { useState } from "react"
import { useRisks } from "@/hooks/useRisks"
import { AlertTriangle, ArrowRight, ArrowUpRight, ChevronRight, Shield, X } from "lucide-react"
import { useNavigate } from "react-router-dom"

// ─── Zone helpers ──────────────────────────────────────────────────────────────

function getZone(significance, occurrence) {
  // Map 3×3 grid: rows = significance (High/Med/Low), cols = occurrence (Low/Med/High)
  const s = significance // 1=Low 2=Med 3=High
  const o = occurrence   // 1=Low 2=Med 3=High
  const score = s * o
  if (score >= 6) return "critical"
  if (score >= 3) return "high"
  return "low"
}

const ZONE_META = {
  critical: {
    label: "Critical",
    bg: "bg-red-50",
    border: "border-red-200",
    chipBg: "bg-red-100",
    chipText: "text-red-800",
    chipBorder: "border-red-200",
    dot: "bg-red-400",
    countBg: "bg-red-50",
    countText: "text-red-700",
    badgeBg: "bg-red-100",
    badgeText: "text-red-700",
  },
  high: {
    label: "High",
    bg: "bg-orange-50",
    border: "border-orange-200",
    chipBg: "bg-orange-100",
    chipText: "text-orange-800",
    chipBorder: "border-orange-200",
    dot: "bg-orange-400",
    countBg: "bg-orange-50",
    countText: "text-orange-700",
    badgeBg: "bg-orange-100",
    badgeText: "text-orange-700",
  },
  low: {
    label: "Low",
    bg: "bg-green-50",
    border: "border-green-200",
    chipBg: "bg-green-100",
    chipText: "text-green-800",
    chipBorder: "border-green-200",
    dot: "bg-green-400",
    countBg: "bg-green-50",
    countText: "text-green-700",
    badgeBg: "bg-green-100",
    badgeText: "text-green-700",
  },
}

// ─── Significance / Occurrence label maps ──────────────────────────────────────

const SIG_LABELS = { 3: "High", 2: "Medium", 1: "Low" }
const OCC_LABELS = { 1: "Low", 2: "Medium", 3: "High" }

// ─── Risk Chip ────────────────────────────────────────────────────────────────

function RiskChip({ risk, zone, onClick }) {
  const m = ZONE_META[zone]
  return (
    <button
      onClick={() => onClick(risk)}
      title={risk.description}
      className={`
        inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium
        border transition-all hover:-translate-y-0.5 hover:shadow-sm
        ${m.chipBg} ${m.chipText} ${m.chipBorder}
      `}
    >
      {risk.risk_ref}
      <ChevronRight size={10} strokeWidth={2} />
    </button>
  )
}

// ─── Risk Detail Drawer ───────────────────────────────────────────────────────

function RiskDrawer({ risk, onClose, onNavigate }) {
  if (!risk) return null

  const zone = getZone(risk.significance, risk.occurence)
  const m = ZONE_META[zone]

  return (
    <div className="fixed inset-0 z-40 flex justify-end" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-[2px]" />

      {/* Panel */}
      <div
        className="relative z-50 w-full max-w-md bg-white shadow-xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${m.badgeBg} ${m.badgeText}`}>
                {m.label}
              </span>
              <span className="text-xs text-slate-400">
                {SIG_LABELS[risk.significance]} significance · {OCC_LABELS[risk.occurence]} occurrence
              </span>
            </div>
            <h3 className="text-lg font-semibold text-slate-900">{risk.risk_ref}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          <div>
            <p className="text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">Description</p>
            <p className="text-sm text-slate-700 leading-relaxed">{risk.risk_discription}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-xs text-slate-400 mb-0.5">Significance</p>
              <p className="text-sm font-medium text-slate-800">{SIG_LABELS[risk.significance]}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-xs text-slate-400 mb-0.5">Occurrence</p>
              <p className="text-sm font-medium text-slate-800">{OCC_LABELS[risk.occurence]}</p>
            </div>
          </div>

          {risk.owner && (
            <div>
              <p className="text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">Owner</p>
              <p className="text-sm text-slate-700">{risk.owner}</p>
            </div>
          )}

          {risk.controls && (
            <div>
              <p className="text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">Controls</p>
              <p className="text-sm text-slate-700 leading-relaxed">{risk.controls}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100">
          <button
            onClick={() => onNavigate(risk.id)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg
              bg-[#4B1C82] text-white text-sm font-medium
              hover:bg-[#3a1565] transition-colors"
          >
            View full risk details
            <ArrowUpRight size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Matrix Cell ──────────────────────────────────────────────────────────────

function MatrixCell({ significance, occurrence, risks, onRiskClick }) {
  const zone = getZone(significance, occurrence)
  const m = ZONE_META[zone]
  const cellRisks = risks.filter(
    (r) => r.significance === significance && r.occurence === occurrence
  )

  return (
    <div
      className={`
        relative min-h-[88px] p-2.5
        border ${m.border} ${m.bg}
        transition-colors
      `}
    >
      {/* Score dot */}
      <div className={`absolute top-2 right-2 w-1.5 h-1.5 rounded-full ${m.dot} opacity-50`} />

      <div className="flex flex-wrap gap-1.5 pr-4">
        {cellRisks.map((risk) => (
          <RiskChip
            key={risk.id}
            risk={risk}
            zone={zone}
            onClick={onRiskClick}
          />
        ))}
      </div>

      {cellRisks.length === 0 && (
        <span className="text-xs text-slate-300">—</span>
      )}
    </div>
  )
}

// ─── Risk List Row ────────────────────────────────────────────────────────────

function RiskRow({ risk, onRiskClick, onNavigate }) {
  const zone = getZone(risk.significance, risk.occurence)
  const m = ZONE_META[zone]

  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors group">
      <div className={`flex-shrink-0 w-2 h-2 rounded-full ${m.dot}`} />

      <div className="w-20 flex-shrink-0">
        <span className="text-xs font-semibold text-slate-700 font-mono">{risk.risk_ref}</span>
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-600 truncate">{risk.description}</p>
      </div>

      <span
        className={`
          flex-shrink-0 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium
          ${m.badgeBg} ${m.badgeText}
        `}
      >
        {m.label}
      </span>

      <div className="flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onRiskClick(risk)}
          className="p-1.5 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          title="Quick view"
        >
          <ArrowRight size={13} />
        </button>
        <button
          onClick={() => onNavigate(risk.id)}
          className="p-1.5 rounded text-slate-400 hover:text-[#4B1C82] hover:bg-purple-50 transition-colors"
          title="View details"
        >
          <ArrowUpRight size={13} />
        </button>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

function RiskMatrix() {
  const { risks, loading, error } = useRisks()
  const navigate = useNavigate()
  const [selectedRisk, setSelectedRisk] = useState(null)
  const [filterZone, setFilterZone] = useState("all")

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[600px] bg-slate-50">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <div className="w-6 h-6 border-2 border-slate-200 border-t-[#4B1C82] rounded-full animate-spin" />
          <span className="text-sm">Loading risk matrix...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[600px] bg-slate-50">
        <div className="flex flex-col items-center gap-3 text-center">
          <AlertTriangle size={24} className="text-red-400" />
          <p className="text-sm text-slate-600">Failed to load risks. Please try again.</p>
        </div>
      </div>
    )
  }

  const counts = { critical: 0, high: 0, low: 0 }
  risks.forEach((r) => {
    counts[getZone(r.significance, r.occurence)]++
  })

  const filteredRisks =
    filterZone === "all"
      ? risks
      : risks.filter((r) => getZone(r.significance, r.occurence) === filterZone)

  const handleNavigate = (id) => {
    navigate(`/risks/${id}`)
  }

  // 3×3 grid: significance rows 3→1 (top=High, bottom=Low), occurrence cols 1→3 (left=Low, right=High)
  const SIG_ROWS = [3, 2, 1]
  const OCC_COLS = [1, 2, 3]

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top bar */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield size={18} className="text-[#4B1C82]" />
            <div>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wide leading-none mb-0.5">
                Grant Thornton · SOQM
              </p>
              <h1 className="text-base font-semibold text-slate-900 leading-none">
                Risk matrix
              </h1>
            </div>
          </div>
          <span className="text-xs text-slate-400">{risks.length} risks registered</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6 space-y-6">

        {/* Stat row */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { key: "critical", label: "Critical risks" },
            { key: "high",     label: "High risks" },
            { key: "low",      label: "Low risks" },
          ].map(({ key, label }) => {
            const m = ZONE_META[key]
            return (
              <button
                key={key}
                onClick={() => setFilterZone(filterZone === key ? "all" : key)}
                className={`
                  text-left p-4 rounded-xl border transition-all
                  ${filterZone === key
                    ? `${m.bg} ${m.border} ring-2 ring-offset-1 ring-${key === "critical" ? "red" : key === "high" ? "orange" : "green"}-300`
                    : "bg-white border-slate-200 hover:border-slate-300"
                  }
                `}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className={`w-2 h-2 rounded-full ${m.dot}`} />
                  <span className="text-xs text-slate-500">{label}</span>
                </div>
                <span className="text-2xl font-semibold text-slate-900">{counts[key]}</span>
              </button>
            )
          })}
        </div>

        {/* Matrix + list layout */}
        <div className="grid grid-cols-1 xl:grid-cols-[420px_1fr] gap-5">

          {/* ── 3×3 Heat map ── */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-4 pt-4 pb-3 border-b border-slate-100">
              <h2 className="text-sm font-semibold text-slate-800">Heat map</h2>
              <p className="text-xs text-slate-400 mt-0.5">Significance × occurrence</p>
            </div>

            <div className="p-4">
              {/* Legend row */}
              <div className="flex gap-3 mb-4">
                {Object.entries(ZONE_META).map(([key, m]) => (
                  <div key={key} className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-sm ${m.dot}`} />
                    <span className="text-xs text-slate-500">{m.label}</span>
                  </div>
                ))}
              </div>

              {/* Grid */}
              <div className="flex gap-2">
                {/* Y-axis label */}
                <div className="flex flex-col items-center justify-center w-5">
                  <span
                    className="text-[10px] text-slate-400 uppercase tracking-wider font-medium"
                    style={{ writingMode: "vertical-lr", transform: "rotate(180deg)" }}
                  >
                    Significance
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  {/* Column headers */}
                  <div className="grid grid-cols-[44px_1fr_1fr_1fr] mb-1">
                    <div />
                    {["Low", "Med", "High"].map((l) => (
                      <div key={l} className="text-center text-[10px] text-slate-400 font-medium pb-1">
                        {l}
                      </div>
                    ))}
                  </div>

                  {/* Rows */}
                  {SIG_ROWS.map((s) => (
                    <div
                      key={s}
                      className="grid grid-cols-[44px_1fr_1fr_1fr]"
                    >
                      {/* Row label */}
                      <div className="flex items-center justify-end pr-2 text-[10px] text-slate-400 font-medium">
                        {SIG_LABELS[s]}
                      </div>

                      {OCC_COLS.map((o) => (
                        <MatrixCell
                          key={`${s}-${o}`}
                          significance={s}
                          occurrence={o}
                          risks={risks}
                          onRiskClick={setSelectedRisk}
                        />
                      ))}
                    </div>
                  ))}

                  {/* X-axis label */}
                  <div className="text-center mt-2">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">
                      Occurrence
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Risk list ── */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="px-4 pt-4 pb-3 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-800">
                  Risk register
                  {filterZone !== "all" && (
                    <span className={`ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${ZONE_META[filterZone].badgeBg} ${ZONE_META[filterZone].badgeText}`}>
                      {ZONE_META[filterZone].label}
                    </span>
                  )}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {filteredRisks.length} {filteredRisks.length === 1 ? "risk" : "risks"}
                  {filterZone !== "all" ? ` · filtered` : ""}
                </p>
              </div>
              {filterZone !== "all" && (
                <button
                  onClick={() => setFilterZone("all")}
                  className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1 transition-colors"
                >
                  <X size={11} />
                  Clear filter
                </button>
              )}
            </div>

            {/* List header */}
            <div className="grid px-4 py-2 border-b border-slate-100 text-[10px] font-semibold text-slate-400 uppercase tracking-wide"
              style={{ gridTemplateColumns: "8px 80px 1fr 72px 60px" }}
            >
              <div />
              <div>Ref</div>
              <div>Description</div>
              <div className="text-center">Zone</div>
              <div />
            </div>

            {/* Rows */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
              {filteredRisks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                  <Shield size={24} className="mb-2 opacity-30" />
                  <p className="text-sm">No risks in this zone</p>
                </div>
              ) : (
                filteredRisks.map((risk) => (
                  <RiskRow
                    key={risk.id}
                    risk={risk}
                    onRiskClick={setSelectedRisk}
                    onNavigate={handleNavigate}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Drawer */}
      {selectedRisk && (
        <RiskDrawer
          risk={selectedRisk}
          onClose={() => setSelectedRisk(null)}
          onNavigate={(id) => {
            setSelectedRisk(null)
            handleNavigate(id)
          }}
        />
      )}
    </div>
  )
}

export default RiskMatrix