import React from "react"
import { useNavigate, useParams } from "react-router-dom"
import { AlertCircle, Loader2, ArrowRight, Plus, Pencil, Trash2, ShieldCheck, Building2 } from "lucide-react"
import { useObjective } from "@/hooks/useObjective"
import { useObjectiveRisks } from "@/hooks/useObjectiveRisks"
import { useRole } from "@/hooks/useRole"
import ObjectiveHeader from "./components/ObjectiveHeader"
import ObjectiveCard from "./components/ObjectiveCard"

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

// ── Mini 3×3 risk matrix ──────────────────────────────────────────────────────
function MiniMatrix({ significance, occurrence, score }) {
  const cells = [
    [3,1],[3,2],[3,3],
    [2,1],[2,2],[2,3],
    [1,1],[1,2],[1,3],
  ]
  const getColor = (s, o) => {
    const sc = s * o
    if (sc >= 6) return "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400"
    if (sc >= 3) return "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
    return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
  }
  return (
    <div className="grid gap-0.5" style={{ gridTemplateColumns: "repeat(3, 20px)", gridTemplateRows: "repeat(3, 20px)" }}>
      {cells.map(([s, o], i) => {
        const isActive = s === significance && o === occurrence
        return (
          <div
            key={i}
            className={`rounded-sm flex items-center justify-center text-[9px] font-bold transition-all ${getColor(s, o)} ${
              isActive ? "ring-2 ring-[#3B1F6A] dark:ring-[#9B5FDE] ring-offset-0 z-10 scale-110" : ""
            }`}
          >
            {isActive ? score : ""}
          </div>
        )
      })}
    </div>
  )
}




// ── Page ──────────────────────────────────────────────────────────────────────
export default function ObjectiveDetails() {
  const { id }      = useParams()
  const navigate    = useNavigate()
  const { isAdmin } = useRole()

  const { objective, loading: objLoading, error: objError , setOjective } = useObjective(id)
  const { risks,     loading: riskLoading, error: riskError } = useObjectiveRisks(id)

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
      {/* Risk summary strip */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total risks",   value: risks?.length ?? 0,  color: "text-foreground" },
          { label: "Highest score", value: risks?.length ? highestScore : "—", color: highestScore >= 6 ? "text-red-600 dark:text-red-400" : highestScore >= 3 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400", suffix: risks?.length ? ` / 9` : "" },
          { label: "Avg score",     value: avgScore, color: "text-amber-600 dark:text-amber-400" },
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
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Linked risks</h2>
            <p className="text-xs text-muted-foreground mt-0.5">All risks associated with this objective</p>
          </div>
          <button
            onClick={() => navigate(`/risks/create?objective_id=${objective.id}`)}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-[#3B1F6A] hover:bg-[#52298F] text-white transition-colors"
          >
            <Plus className="size-3" /> Add risk
          </button>
        </div>

        {riskLoading ? (
          <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /><span className="text-sm">Loading risks…</span>
          </div>
        ) : riskError ? (
          <div className="py-12 text-center text-destructive text-sm">Failed to load risks.</div>
        ) : !risks?.length ? (
          <div className="py-14 text-center space-y-2">
            <p className="text-sm text-muted-foreground">No risks linked to this objective yet.</p>
            <button
              onClick={() => navigate(`/risks/create?objective_id=${objective.id}`)}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#7B3FBE] hover:underline mt-1"
            >
              <Plus className="size-3.5" /> Add the first risk
            </button>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/20">
                {["Ref", "Description", "Significance", "Occurrence", "Score", "Matrix", ""].map((h) => (
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
                    <span className="text-xs text-muted-foreground truncate block">{risk.risk_discription ?? "—"}</span>
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
                    <MiniMatrix
                      significance={risk.significance}
                      occurrence={risk.occurence}
                      score={risk.score}
                    />
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
        )}
      </div>
    </div>
  )
}