import { useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useRisk } from "@/hooks/useRisk"
import { useRole } from "@/hooks/useRole"
import { updateRisk, deleteRisk } from "@/api/endpoints/riskApi"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  Shield,
  Target,
  Pencil,
  Trash2,
  Save,
  X,
  Calendar,
  ArrowRight,
  Info,
} from "lucide-react"

// ============================================================
// CONSTANTS
// ============================================================

const SIG_LABELS = { 3: "High", 2: "Medium", 1: "Low" }
const OCC_LABELS = { 3: "High", 2: "Medium", 1: "Low" }

const RISK_STATUSES = [
  "identified",
  "assessed",
  "mitigated",
  "accepted",
  "closed",
  "transferred",
]

function getZone(significance, occurrence) {
  const score = significance * occurrence
  if (score >= 6) return "critical"
  if (score >= 3) return "high"
  return "low"
}

const ZONE_CONFIG = {
  critical: {
    label: "Critical",
    dot: "bg-red-500",
    text: "text-red-700 dark:text-red-400",
    bg: "bg-red-50 dark:bg-red-950/20",
    border: "border-red-200 dark:border-red-900",
    circle: "text-red-600",
  },
  high: {
    label: "High",
    dot: "bg-amber-500",
    text: "text-amber-700 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/20",
    border: "border-amber-200 dark:border-amber-900",
    circle: "text-amber-600",
  },
  low: {
    label: "Low",
    dot: "bg-slate-400",
    text: "text-slate-700 dark:text-slate-400",
    bg: "bg-slate-50 dark:bg-slate-900/20",
    border: "border-slate-200 dark:border-slate-800",
    circle: "text-slate-500",
  },
}

const STATUS_STYLE = {
  identified: "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900",
  assessed: "bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-900",
  mitigated: "bg-slate-50 dark:bg-slate-950/30 text-slate-700 dark:text-slate-400 border-slate-200 dark:border-slate-800",
  accepted: "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900",
  closed: "bg-slate-100 dark:bg-slate-900/40 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-800",
  active: "bg-slate-50 dark:bg-slate-950/30 text-slate-700 dark:text-slate-400 border-slate-200 dark:border-slate-800",
}

function formatDate(str) {
  if (!str) return "—"
  return new Date(str).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

// ============================================================
// COMPONENTS
// ============================================================

function ScoreRing({ score, zone }) {
  const config = ZONE_CONFIG[zone]
  const circumference = 2 * Math.PI * 40
  const offset = circumference - (score / 9) * circumference

  return (
    <div className="relative w-28 h-28 flex items-center justify-center">
      <svg className="absolute -rotate-90" width="120" height="120">
        <circle
          cx="60"
          cy="60"
          r="40"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          className="text-slate-200 dark:text-slate-700"
        />
        <circle
          cx="60"
          cy="60"
          r="40"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={`transition-all duration-500 ${config.circle}`}
        />
      </svg>
      <div className="text-center z-10">
        <p className="text-2xl font-bold text-slate-900 dark:text-white">{score}</p>
        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">/ 9</p>
      </div>
    </div>
  )
}

function StatusBadge({ status }) {
  const style = STATUS_STYLE[status?.toLowerCase()] || STATUS_STYLE.identified
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${style}`}>
      <span className="w-1 h-1 rounded-full bg-current opacity-60" />
      {status?.replace(/_/g, " ")}
    </span>
  )
}

function ComponentHoverCard({ component }) {
  return (
    <div className="group relative">
      <div className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors border border-slate-200 dark:border-slate-700">
        <Shield className="w-4 h-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
            {component.name}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">{component.isqm_reference}</p>
        </div>
        <Info className="w-4 h-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300" />
      </div>

      {/* Hover Card */}
      <div className="absolute left-0 top-full mt-2 w-72 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none group-hover:pointer-events-auto">
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl p-4 space-y-3">
          <div className="flex items-start gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700 shrink-0">
              <Shield className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">{component.name}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{component.isqm_reference}</p>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
            <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-3">
              {component.description || "No description"}
            </p>
          </div>

          <div className="flex items-center gap-2 pt-2 text-[10px] text-slate-500">
            <span className={`w-2 h-2 rounded-full ${component.status === "ACTIVE" ? "bg-slate-400" : "bg-slate-300"}`} />
            <span>{component.status}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function ObjectiveCard({ objective, onNavigate }) {
  const ref = objective.objective_reference || objective.ref || "Unknown"
  const status = objective.status || "active"
  const id = objective.objective_id || objective.id

  return (
    <div className="group relative rounded-lg border border-slate-200 dark:border-slate-700 p-4 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-sm transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="flex size-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 shrink-0 mt-0.5">
            <Target className="w-4 h-4 text-slate-600 dark:text-slate-400" />
          </div>
          <div className="flex-1 min-w-0 py-0.5">
            <p className="text-sm font-bold text-slate-900 dark:text-white">
              Objective <span className="font-mono">{ref}</span>
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </p>
          </div>
        </div>
        {id && (
          <button
            onClick={() => onNavigate(id)}
            className="flex items-center justify-center size-8 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors shrink-0"
            title="Navigate to objective details"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )
}

// ============================================================
// MAIN PAGE
// ============================================================

export default function RiskDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isAdmin } = useRole()
  const { risk, setRisk, loading, error } = useRisk(id)

  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState("")
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const startEdit = () => {
    setForm({
      risk_ref: risk.risk_ref,
      risk_discription: risk.risk_discription ?? "",
      significance: risk.significance,
      occurence: risk.occurence,
      status: risk.status,
      date_identified: risk.date_identified ?? "",
      next_review_date: risk.next_review_date ?? "",
    })
    setSaveError("")
    setEditing(true)
  }

  const handleSave = async () => {
    if (!form.risk_ref.trim()) {
      setSaveError("Risk reference is required.")
      return
    }
    setSaving(true)
    setSaveError("")
    try {
      const res = await updateRisk(id, {
        ...form,
        significance: Number(form.significance),
        occurence: Number(form.occurence),
      })
      setRisk(res.data)
      setEditing(false)
    } catch (err) {
      setSaveError(err?.response?.data?.detail ?? "Failed to save.")
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

  if (loading)
    return (
      <div className="flex items-center justify-center h-64 gap-2 text-slate-500">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="text-sm">Loading…</span>
      </div>
    )

  if (error || !risk)
    return (
      <div className="flex items-center justify-center h-64 gap-2 text-red-600">
        <AlertCircle className="w-5 h-5" />
        <span className="text-sm">Risk not found</span>
      </div>
    )

  const zone = getZone(risk.significance, risk.occurence)
  const zoneConfig = ZONE_CONFIG[zone]
  const editSig = editing ? Number(form.significance) : risk.significance
  const editOcc = editing ? Number(form.occurence) : risk.occurence
  const liveScore = editSig * editOcc

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/risks")}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <span className="text-sm text-slate-400">•</span>
            <span className="text-sm font-mono font-bold text-slate-700 dark:text-slate-300">
              {risk.risk_ref}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {isAdmin && !editing && (
              <>
                <button
                  onClick={startEdit}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => setDeleteOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/50 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </>
            )}
            {isAdmin && editing && (
              <>
                <button
                  onClick={() => setEditing(false)}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 rounded-lg transition-colors disabled:opacity-60"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save
                </button>
              </>
            )}
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Details */}
          <div className="lg:col-span-2 space-y-5">
            {/* Risk Card */}
            <div className={`rounded-xl border ${zoneConfig.border} ${zoneConfig.bg} p-6 space-y-4`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  {editing ? (
                    <input
                      value={form.risk_ref}
                      onChange={set("risk_ref")}
                      className="text-2xl font-bold text-slate-900 dark:text-white w-full rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 outline-none focus:ring-2 focus:ring-slate-500"
                    />
                  ) : (
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                      {risk.risk_ref}
                    </h1>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${zoneConfig.dot}`} />
                    <span className={`text-sm font-bold ${zoneConfig.text}`}>
                      {zoneConfig.label} Risk
                    </span>
                  </div>
                  {editing ? (
                    <select
                      value={form.status}
                      onChange={set("status")}
                      className="px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-slate-500"
                    >
                      {RISK_STATUSES.map((s) => (
                        <option key={s} value={s} className="capitalize">
                          {s}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <StatusBadge status={risk.status} />
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="pt-4 border-t border-slate-300/30 dark:border-slate-700/50">
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-600 dark:text-slate-400 mb-2">
                  Description
                </p>
                {editing ? (
                  <textarea
                    value={form.risk_discription}
                    onChange={set("risk_discription")}
                    rows="3"
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-slate-500 resize-none"
                  />
                ) : (
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    {risk.risk_discription || (
                      <span className="italic text-slate-500">No description provided</span>
                    )}
                  </p>
                )}
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-5 space-y-2">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-600 dark:text-slate-400">
                    Identified
                  </p>
                </div>
                {editing ? (
                  <input
                    type="date"
                    value={form.date_identified}
                    onChange={set("date_identified")}
                    className="w-full px-2.5 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-slate-500"
                  />
                ) : (
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    {formatDate(risk.date_identified)}
                  </p>
                )}
              </div>

              <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-5 space-y-2">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-600 dark:text-slate-400">
                    Next Review
                  </p>
                </div>
                {editing ? (
                  <input
                    type="date"
                    value={form.next_review_date}
                    onChange={set("next_review_date")}
                    className="w-full px-2.5 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-slate-500"
                  />
                ) : (
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    {formatDate(risk.next_review_date)}
                  </p>
                )}
              </div>
            </div>

            {/* Risk Matrix */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-6 space-y-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-600 dark:text-slate-400">
                Risk Matrix
              </p>
              <div className="space-y-2">
                <div className="grid grid-cols-4 gap-1">
                  <div></div>
                  {["Low", "Medium", "High"].map((occ) => (
                    <div key={occ} className="text-center text-[10px] font-bold text-slate-600 dark:text-slate-400">
                      {occ}
                    </div>
                  ))}
                </div>
                {[3, 2, 1].map((sig) => (
                  <div key={sig} className="grid grid-cols-4 gap-1">
                    <div className="text-[10px] font-bold text-slate-600 dark:text-slate-400 text-right pr-2">
                      {sig}
                    </div>
                    {[1, 2, 3].map((occ) => {
                      const score = sig * occ
                      let color = "bg-slate-100 dark:bg-slate-800"
                      if (score >= 6) color = "bg-red-200 dark:bg-red-950"
                      else if (score >= 3) color = "bg-amber-200 dark:bg-amber-950"

                      const isCurrentRisk = risk.significance === sig && risk.occurence === occ

                      return (
                        <div
                          key={`${sig}-${occ}`}
                          className={`flex items-center justify-center h-10 rounded-lg font-bold text-xs transition-all border-2 ${
                            isCurrentRisk
                              ? "border-slate-600 dark:border-slate-400 ring-2 ring-slate-400 dark:ring-slate-600"
                              : "border-transparent"
                          } ${color}`}
                        >
                          {score}
                          {isCurrentRisk && <span className="ml-1">●</span>}
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* Objectives */}
            {(() => {
              const objectivesData = risk.objectives || []
              if (objectivesData.length === 0) return null

              return (
                <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-6 space-y-4">
                  <div className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                      Linked Objectives
                    </h2>
                    <span className="ml-auto text-xs font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">
                      {objectivesData.length}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    {objectivesData.map((obj, idx) => (
                      <ObjectiveCard
                        key={obj.objective_id || idx}
                        objective={obj}
                        onNavigate={(objId) => navigate(`/objectives/${objId}`)}
                      />
                    ))}
                  </div>
                </div>
              )
            })()}
          </div>

          {/* Right: Scoring */}
          <div className="space-y-5">
            {/* Score */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-6 flex flex-col items-center gap-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-600 dark:text-slate-400 text-center mb-4">
                  Risk Score
                </p>
                <ScoreRing score={liveScore} zone={zone} />
              </div>

              {/* Sliders */}
              <div className="w-full space-y-5 pt-6 border-t border-slate-200 dark:border-slate-700">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                      Significance
                    </span>
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      {SIG_LABELS[editSig]}
                    </span>
                  </div>
                  {editing ? (
                    <input
                      type="range"
                      min="1"
                      max="3"
                      step="1"
                      value={form.significance}
                      onChange={set("significance")}
                      className="w-full accent-slate-600"
                    />
                  ) : (
                    <div className="flex gap-1">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className={`h-2 flex-1 rounded transition-colors ${
                            i <= editSig ? "bg-slate-600 dark:bg-slate-400" : "bg-slate-200 dark:bg-slate-700"
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                      Occurrence
                    </span>
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      {OCC_LABELS[editOcc]}
                    </span>
                  </div>
                  {editing ? (
                    <input
                      type="range"
                      min="1"
                      max="3"
                      step="1"
                      value={form.occurence}
                      onChange={set("occurence")}
                      className="w-full accent-slate-600"
                    />
                  ) : (
                    <div className="flex gap-1">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className={`h-2 flex-1 rounded transition-colors ${
                            i <= editOcc ? "bg-slate-600 dark:bg-slate-400" : "bg-slate-200 dark:bg-slate-700"
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Component */}
            {risk.component && (
              <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-600 dark:text-slate-400 mb-4">
                  ISQM Component
                </p>
                <ComponentHoverCard component={risk.component} />
              </div>
            )}
          </div>
        </div>

        {/* Error */}
        {saveError && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900">
            <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
            <p className="text-sm text-red-600 dark:text-red-400">{saveError}</p>
          </div>
        )}
      </div>

      {/* Delete Dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Risk?</AlertDialogTitle>
            <AlertDialogDescription>
              Risk <span className="font-mono font-semibold">{risk.risk_ref}</span> will be
              permanently deleted. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}