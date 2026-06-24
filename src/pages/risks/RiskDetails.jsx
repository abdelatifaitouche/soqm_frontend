import { useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useRisk } from "@/hooks/useRisk"
import { useRole } from "@/hooks/useRole"
import { updateRisk, deleteRisk } from "@/api/endpoints/riskApi"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  ArrowLeft, Loader2, AlertCircle, Shield, Target,
  ShieldCheck, Pencil, Trash2, Save, X, Calendar,
  FileText, BarChart3, ArrowUpRight,
} from "lucide-react"

// ── Constants ─────────────────────────────────────────────────────────────────
const SIG_LABELS = { 3: "High", 2: "Medium", 1: "Low" }
const OCC_LABELS = { 1: "Low",  2: "Medium", 3: "High" }

const RISK_STATUSES = [
  "identified", "assessed", "mitigated", "accepted", "closed", "transferred"
]

function getZone(significance, occurrence) {
  const score = significance * occurrence
  if (score >= 6) return "critical"
  if (score >= 3) return "high"
  return "low"
}

const ZONE = {
  critical: { label: "Critical", badge: "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400",    score: "text-red-600 dark:text-red-400",    bar: "#E24B4A" },
  high:     { label: "High",     badge: "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400", score: "text-amber-600 dark:text-amber-400", bar: "#BA7517" },
  low:      { label: "Low",      badge: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400", score: "text-emerald-600 dark:text-emerald-400", bar: "#1D9E75" },
}

const STATUS_STYLE = {
  identified:  "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400",
  assessed:    "bg-purple-50 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400",
  mitigated:   "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400",
  accepted:    "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400",
  closed:      "bg-gray-100 text-gray-500 dark:bg-muted dark:text-muted-foreground",
  transferred: "bg-teal-50 text-teal-700 dark:bg-teal-950/30 dark:text-teal-400",
}

// ── Sub-components ────────────────────────────────────────────────────────────
function DotBar({ value, max = 3, color = "#7B3FBE" }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: max }).map((_, i) => (
        <div
          key={i}
          className="size-2.5 rounded-sm transition-colors"
          style={{ background: i < value ? color : "var(--color-border)" }}
        />
      ))}
    </div>
  )
}

function ScoreRing({ score, max = 9, color }) {
  const pct = (score / max) * 100
  const r   = 28
  const circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ

  return (
    <div className="relative flex items-center justify-center size-20">
      <svg className="absolute -rotate-90" width="80" height="80">
        <circle cx="40" cy="40" r={r} fill="none" stroke="var(--color-border)" strokeWidth="6" />
        <circle
          cx="40" cy="40" r={r} fill="none"
          stroke={color} strokeWidth="6"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
        />
      </svg>
      <div className="text-center z-10">
        <p className="text-xl font-semibold text-foreground leading-none">{score}</p>
        <p className="text-[9px] text-muted-foreground mt-0.5">/ {max}</p>
      </div>
    </div>
  )
}

function MiniMatrix({ significance, occurrence }) {
  const SIG_ROWS = [3, 2, 1]
  const OCC_COLS = [1, 2, 3]

  const getCellColor = (s, o) => {
    const sc = s * o
    if (sc >= 6) return "bg-red-100 border-red-200 dark:bg-red-950/30 dark:border-red-900"
    if (sc >= 3) return "bg-amber-100 border-amber-200 dark:bg-amber-950/30 dark:border-amber-900"
    return "bg-emerald-100 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-900"
  }

  return (
    <div className="space-y-1">
      {/* Col headers */}
      <div className="grid gap-0.5 mb-1" style={{ gridTemplateColumns: "28px 1fr 1fr 1fr" }}>
        <div />
        {["L", "M", "H"].map((l) => (
          <div key={l} className="text-center text-[9px] font-semibold text-muted-foreground">{l}</div>
        ))}
      </div>
      {SIG_ROWS.map((s) => (
        <div key={s} className="grid gap-0.5" style={{ gridTemplateColumns: "28px 1fr 1fr 1fr" }}>
          <div className="flex items-center justify-end pr-1">
            <span className="text-[9px] font-semibold text-muted-foreground">{SIG_LABELS[s][0]}</span>
          </div>
          {OCC_COLS.map((o) => {
            const isActive = s === significance && o === occurrence
            return (
              <div
                key={o}
                className={`h-8 rounded border flex items-center justify-center text-[9px] font-bold transition-all ${getCellColor(s, o)} ${
                  isActive ? "ring-2 ring-[#3B1F6A] dark:ring-[#9B5FDE] ring-offset-1 scale-110 z-10" : ""
                }`}
              >
                {isActive ? s * o : ""}
              </div>
            )
          })}
        </div>
      ))}
      {/* X label */}
      <div className="text-center mt-1">
        <span className="text-[9px] font-semibold text-muted-foreground">Occurrence →</span>
      </div>
    </div>
  )
}

function StatusPill({ status }) {
  const cls = STATUS_STYLE[status?.toLowerCase()] ?? "bg-gray-100 text-gray-500"
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full capitalize ${cls}`}>
      <span className="size-1.5 rounded-full bg-current opacity-70" />
      {status?.replace(/_/g, " ")}
    </span>
  )
}

function formatDate(str) {
  if (!str) return "—"
  return new Date(str).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function RiskDetails() {
  const { id }      = useParams()
  const navigate    = useNavigate()
  const { isAdmin } = useRole()
  const { risk, setRisk, loading, error } = useRisk(id)

  const [editing, setEditing]       = useState(false)
  const [form, setForm]             = useState(null)
  const [saving, setSaving]         = useState(false)
  const [saveError, setSaveError]   = useState("")
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting]     = useState(false)

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const startEdit = () => {
    setForm({
      risk_ref:         risk.risk_ref,
      risk_discription: risk.risk_discription ?? "",
      significance:     risk.significance,
      occurence:        risk.occurence,
      status:           risk.status,
      date_identified:  risk.date_identified ?? "",
    })
    setSaveError("")
    setEditing(true)
  }

  const handleSave = async () => {
    if (!form.risk_ref.trim()) { setSaveError("Risk reference is required."); return }
    setSaving(true)
    setSaveError("")
    try {
      const res = await updateRisk(id, {
        ...form,
        significance: Number(form.significance),
        occurence:    Number(form.occurence),
      })
      setRisk(res.data)
      setEditing(false)
    } catch (err) {
      setSaveError(err?.response?.data?.detail ?? "Failed to save. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await deleteRisk(id)
      navigate("/risks")
    } finally {
      setDeleting(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-muted-foreground gap-2">
      <Loader2 className="size-4 animate-spin" /><span className="text-sm">Loading risk…</span>
    </div>
  )

  if (error || !risk) return (
    <div className="flex items-center justify-center h-64 text-destructive gap-2">
      <AlertCircle className="size-4" /><span className="text-sm">Risk not found.</span>
    </div>
  )

  const zone    = getZone(risk.significance, risk.occurence)
  const z       = ZONE[zone]
  const editSig = editing ? Number(form.significance) : risk.significance
  const editOcc = editing ? Number(form.occurence)    : risk.occurence
  const liveScore = editSig * editOcc

  return (
    <>
      <div className="max-w-4xl mx-auto space-y-5">

        {/* Back + actions */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/risks")}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground border border-border bg-card px-2.5 py-1.5 rounded-lg transition-colors"
            >
              <ArrowLeft className="size-3.5" /> Risk Matrix
            </button>
            <span className="text-xs text-muted-foreground">/</span>
            <span className="text-xs font-mono font-semibold text-[#7B3FBE]">{risk.risk_ref}</span>
          </div>

          <div className="flex items-center gap-2">
            {isAdmin && !editing && (
              <>
                <button onClick={startEdit}
                  className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-[#C4B0E8] bg-[#EDE9F8] text-[#3B1F6A] hover:bg-[#DDD5F5] dark:bg-accent dark:border-border dark:text-foreground transition-colors">
                  <Pencil className="size-3.5" /> Edit
                </button>
                <button onClick={() => setDeleteOpen(true)}
                  className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-950/30 dark:border-red-900 dark:text-red-400 transition-colors">
                  <Trash2 className="size-3.5" /> Delete
                </button>
              </>
            )}
            {isAdmin && editing && (
              <>
                <button onClick={() => setEditing(false)}
                  className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors">
                  <X className="size-3.5" /> Cancel
                </button>
                <button onClick={handleSave} disabled={saving}
                  className="flex items-center gap-1.5 text-xs font-medium px-4 py-1.5 rounded-lg bg-[#3B1F6A] hover:bg-[#52298F] text-white transition-colors disabled:opacity-60">
                  {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
                  Save changes
                </button>
              </>
            )}
          </div>
        </div>

        {/* ── Row 1: Header card + Score card ─────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_260px] gap-4">

          {/* Header card */}
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <div className="flex items-start gap-4">
              <div className="flex size-11 items-center justify-center rounded-xl bg-[#EDE9F8] dark:bg-accent shrink-0">
                <Shield className="size-5 text-[#7B3FBE]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <span className="font-mono text-lg font-semibold text-foreground">
                    {editing ? (
                      <input
                        value={form.risk_ref}
                        onChange={set("risk_ref")}
                        className="w-24 rounded-md border border-input bg-background px-2 py-1 text-sm font-mono outline-none focus:ring-2 focus:ring-[#7B3FBE]"
                      />
                    ) : risk.risk_ref}
                  </span>
                  <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${z.badge}`}>
                    {z.label}
                  </span>
                  {editing ? (
                    <select value={form.status} onChange={set("status")}
                      className="h-7 rounded-md border border-input bg-background px-2 text-xs text-foreground outline-none focus:ring-2 focus:ring-[#7B3FBE]">
                      {RISK_STATUSES.map((s) => (
                        <option key={s} value={s} className="capitalize">{s}</option>
                      ))}
                    </select>
                  ) : (
                    <StatusPill status={risk.status} />
                  )}
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">Description</p>
              {editing ? (
                <textarea value={form.risk_discription} onChange={set("risk_discription")} rows={3}
                  placeholder="Risk description…"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-[#7B3FBE] resize-none placeholder:text-muted-foreground" />
              ) : (
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {risk.risk_discription || <span className="italic">No description provided.</span>}
                </p>
              )}
            </div>

            {/* Date + created by */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">Date identified</p>
                {editing ? (
                  <div className="relative">
                    <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
                    <input type="date" value={form.date_identified} onChange={set("date_identified")}
                      className="w-full h-9 pl-8 rounded-lg border border-input bg-background text-sm text-foreground outline-none focus:ring-2 focus:ring-[#7B3FBE]" />
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-sm text-foreground">
                    <Calendar className="size-3.5 text-muted-foreground" />
                    {formatDate(risk.date_identified)}
                  </div>
                )}
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">Created by</p>
                <p className="text-sm text-foreground">{risk.created_by ?? <span className="text-muted-foreground">—</span>}</p>
              </div>
            </div>
          </div>

          {/* Score card */}
          <div className="rounded-xl border border-border bg-card p-6 flex flex-col items-center justify-between gap-5">
            <div className="text-center">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">Risk score</p>
              <ScoreRing score={editing ? liveScore : risk.score} color={z.bar} />
            </div>

            {/* Sig + Occ sliders */}
            <div className="w-full space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-xs text-muted-foreground">Significance</p>
                  <span className="text-xs font-medium text-foreground">{SIG_LABELS[editing ? Number(form.significance) : risk.significance]}</span>
                </div>
                {editing ? (
                  <input type="range" min={1} max={3} step={1}
                    value={form.significance} onChange={set("significance")}
                    className="w-full accent-[#7B3FBE]" />
                ) : (
                  <DotBar value={risk.significance} color={z.bar} />
                )}
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-xs text-muted-foreground">Occurrence</p>
                  <span className="text-xs font-medium text-foreground">{OCC_LABELS[editing ? Number(form.occurence) : risk.occurence]}</span>
                </div>
                {editing ? (
                  <input type="range" min={1} max={3} step={1}
                    value={form.occurence} onChange={set("occurence")}
                    className="w-full accent-[#7B3FBE]" />
                ) : (
                  <DotBar value={risk.occurence} color={z.bar} />
                )}
              </div>
            </div>

            {/* Mini matrix */}
            <div className="w-full pt-3 border-t border-border">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2 text-center">Position</p>
              <MiniMatrix significance={editSig} occurrence={editOcc} />
            </div>
          </div>
        </div>

        {/* ── Row 2: Objective + Component ──────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Linked objective */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Target className="size-4 text-[#7B3FBE]" />
              <h2 className="text-sm font-semibold text-foreground">Linked Objective</h2>
            </div>
            {risk.objective ? (
              <div className="rounded-lg bg-[#EDE9F8] dark:bg-accent border border-[#C4B0E8] dark:border-border p-4 space-y-2">
                <p className="text-xs font-medium text-[#1E0A3C] dark:text-foreground leading-snug line-clamp-3">
                  {risk.objective.objective_reference}
                </p>
                <div className="flex items-center justify-between pt-1">
                  <StatusPill status={risk.objective.status} />
                  <button
                    onClick={() => navigate(`/objectives/${risk.objective.id}`)}
                    className="flex items-center gap-1 text-[11px] font-medium text-[#7B3FBE] hover:underline"
                  >
                    View <ArrowUpRight className="size-3" />
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No objective linked.</p>
            )}
          </div>

          {/* Linked component */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-[#7B3FBE]" />
              <h2 className="text-sm font-semibold text-foreground">ISQM Component</h2>
            </div>
            {risk.component ? (
              <div className="rounded-lg bg-[#EDE9F8] dark:bg-accent border border-[#C4B0E8] dark:border-border p-4 space-y-2">
                <div className="flex items-start gap-3">
                  <div className="flex size-8 items-center justify-center rounded-md bg-[#3B1F6A] shrink-0">
                    <ShieldCheck className="size-4 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-[#1E0A3C] dark:text-foreground">{risk.component.name}</p>
                    <p className="text-[11px] text-[#7B3FBE] dark:text-muted-foreground mt-0.5">{risk.component.isqm_reference}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                    risk.component.status === "ACTIVE"
                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
                      : "bg-gray-100 text-gray-500 dark:bg-muted dark:text-muted-foreground"
                  }`}>
                    {risk.component.status}
                  </span>
                  <button
                    onClick={() => navigate(`/components/${risk.component.id}`)}
                    className="flex items-center gap-1 text-[11px] font-medium text-[#7B3FBE] hover:underline"
                  >
                    View <ArrowUpRight className="size-3" />
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No component linked.</p>
            )}
          </div>
        </div>

        {saveError && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900">
            <AlertCircle className="size-3.5 text-red-500 shrink-0" />
            <p className="text-xs text-red-600 dark:text-red-400">{saveError}</p>
          </div>
        )}

        {/* ── Placeholder sections ───────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { icon: FileText,  label: "Risk Responses",   sub: "Mitigations and responses will appear here." },
            { icon: BarChart3, label: "Monitoring",        sub: "Monitoring and evidence tracking will appear here." },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-dashed border-border bg-card/50 p-6 flex flex-col items-center justify-center text-center gap-2 min-h-[120px]">
              <s.icon className="size-5 text-muted-foreground/30" />
              <p className="text-sm font-medium text-muted-foreground">{s.label}</p>
              <p className="text-xs text-muted-foreground/60">{s.sub}</p>
            </div>
          ))}
        </div>

      </div>

      {/* Delete confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Delete risk?</AlertDialogTitle>
            <AlertDialogDescription>
              Risk <span className="font-mono font-semibold text-foreground">{risk.risk_ref}</span> will be
              permanently deleted along with all responses and monitoring data. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white">
              {deleting && <Loader2 className="size-3.5 animate-spin" />} Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}