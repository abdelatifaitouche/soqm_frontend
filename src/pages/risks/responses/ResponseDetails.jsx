import React from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useResponse } from "@/hooks/useResponse"
import {
  ArrowLeft,
  ShieldCheck,
  Eye,
  AlertTriangle,
  CircleDashed,
  Rocket,
  ClipboardCheck,
  CheckCircle2,
  Archive,
  Calendar,
  User,
  FileText,
  Hash,
  Link2,
  Clock,
  Pencil,
  BarChart2,
  ExternalLink,
  Lock,
  Unlock,
} from "lucide-react"

// ─── Config ───────────────────────────────────────────────────────────────────

const TYPE_CONFIG = {
  DETECTIVE:  { label: "Detective",  icon: Eye,           bg: "bg-blue-50",   text: "text-blue-700",   border: "border-blue-200",   dot: "bg-blue-500"   },
  PREVENTIVE: { label: "Preventive", icon: ShieldCheck,   bg: "bg-violet-50", text: "text-violet-700", border: "border-violet-200", dot: "bg-violet-500" },
  CORRECTIVE: { label: "Corrective", icon: AlertTriangle, bg: "bg-amber-50",  text: "text-amber-700",  border: "border-amber-200",  dot: "bg-amber-500"  },
}

const WORKFLOW = [
  { key: "DRAFT",       label: "Draft",       icon: CircleDashed,   color: "text-slate-500",   ring: "ring-slate-300",   bg: "bg-slate-100",    line: "bg-slate-200"   },
  { key: "PLANNED",     label: "Planned",     icon: Rocket,         color: "text-sky-600",     ring: "ring-sky-300",     bg: "bg-sky-50",       line: "bg-sky-200"     },
  { key: "IMPLEMENTED", label: "Implemented", icon: ClipboardCheck, color: "text-blue-600",    ring: "ring-blue-300",    bg: "bg-blue-50",      line: "bg-blue-200"    },
  { key: "EFFECTIVE",   label: "Effective",   icon: CheckCircle2,   color: "text-emerald-600", ring: "ring-emerald-300", bg: "bg-emerald-50",   line: "bg-emerald-300" },
  { key: "RETIRED",     label: "Retired",     icon: Archive,        color: "text-rose-500",    ring: "ring-rose-300",    bg: "bg-rose-50",      line: "bg-rose-200"    },
]

function getType(type) {
  return TYPE_CONFIG[type] || { label: type || "Unknown", icon: ShieldCheck, bg: "bg-slate-50", text: "text-slate-500", border: "border-slate-200", dot: "bg-slate-300" }
}

function getWorkflowIndex(status) {
  const idx = WORKFLOW.findIndex((s) => s.key === status)
  return idx === -1 ? -1 : idx
}

// Risk score → colour band
function getRiskScoreConfig(score) {
  if (score >= 8)  return { label: "Critical", bg: "bg-red-50",    text: "text-red-700",    border: "border-red-200",    bar: "bg-red-500"    }
  if (score >= 5)  return { label: "High",     bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200", bar: "bg-orange-500" }
  if (score >= 3)  return { label: "Medium",   bg: "bg-amber-50",  text: "text-amber-700",  border: "border-amber-200",  bar: "bg-amber-400"  }
  return           { label: "Low",      bg: "bg-emerald-50", text: "text-emerald-700",border: "border-emerald-200",bar: "bg-emerald-400"}
}

// Risk status
const RISK_STATUS_CONFIG = {
  open:   { label: "Open",   icon: Unlock, className: "bg-sky-50 text-sky-700 border-sky-200"       },
  closed: { label: "Closed", icon: Lock,   className: "bg-slate-100 text-slate-500 border-slate-200" },
}
function getRiskStatus(s) {
  return RISK_STATUS_CONFIG[s?.toLowerCase()] || { label: s || "Unknown", icon: CircleDashed, className: "bg-slate-50 text-slate-400 border-slate-100" }
}

function shortId(id) { return id?.slice(0, 8)?.toUpperCase() }

function fmtDate(val) {
  if (!val) return null
  return new Date(val).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
}

// ─── Risk card ────────────────────────────────────────────────────────────────

function RiskCard({ risk, navigate }) {
  if (!risk) return null
  const score  = getRiskScoreConfig(risk.score)
  const status = getRiskStatus(risk.status)
  const StatusIcon = status.icon

  return (
    <div className="bg-white border border-slate-200 rounded-xl px-5 py-4 flex items-center gap-4">
      {/* Score gauge */}
      <div className={`flex flex-col items-center justify-center size-14 shrink-0 rounded-xl border ${score.bg} ${score.border}`}>
        <span className={`text-xl font-bold leading-none ${score.text}`}>{risk.score}</span>
        <span className={`text-[9px] font-bold uppercase tracking-wider mt-0.5 ${score.text}`}>{score.label}</span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Linked Risk</span>
          <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${status.className}`}>
            <StatusIcon className="size-2.5" />
            {status.label}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-slate-800 font-mono">{risk.risk_ref}</span>
          <span className="text-xs text-slate-400 font-mono">#{shortId(risk.id)}</span>
        </div>
        {/* Score bar */}
        <div className="mt-2 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${score.bar}`}
            style={{ width: `${Math.min((risk.score / 9) * 100, 100)}%` }}
          />
        </div>
      </div>

      <button
        onClick={() => navigate(`/risks/${risk.id}`)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#3B1F6A] border border-[#3B1F6A]/20 bg-[#3B1F6A]/5 rounded-lg hover:bg-[#3B1F6A]/10 transition-colors shrink-0"
      >
        <ExternalLink className="size-3" />
        View risk
      </button>
    </div>
  )
}

// ─── Workflow bar ─────────────────────────────────────────────────────────────

function WorkflowBar({ status }) {
  const currentIdx = getWorkflowIndex(status)

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-5">
        Workflow Status
      </p>

      {/* Steps */}
      <div className="flex items-start">
        {WORKFLOW.map((step, idx) => {
          const isDone    = idx < currentIdx
          const isCurrent = idx === currentIdx
          const isLast    = idx === WORKFLOW.length - 1
          const StepIcon  = step.icon

          return (
            <React.Fragment key={step.key}>
              {/* Step node */}
              <div className="flex flex-col items-center gap-2 flex-shrink-0">
                <div
                  className={`
                    flex size-10 items-center justify-center rounded-full ring-2 transition-all
                    ${isCurrent ? `${step.bg} ${step.ring} shadow-md` : ""}
                    ${isDone    ? "bg-[#3B1F6A] ring-[#3B1F6A]/30" : ""}
                    ${!isDone && !isCurrent ? "bg-slate-100 ring-slate-200" : ""}
                  `}
                >
                  {isDone ? (
                    <CheckCircle2 className="size-4.5 text-white" />
                  ) : (
                    <StepIcon className={`size-4 ${isCurrent ? step.color : "text-slate-400"}`} />
                  )}
                </div>
                <span
                  className={`text-[11px] font-semibold text-center leading-tight w-16 ${
                    isCurrent ? step.color : isDone ? "text-[#3B1F6A]" : "text-slate-400"
                  }`}
                >
                  {step.label}
                </span>
                {isCurrent && (
                  <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${step.bg} ${step.color}`}>
                    Current
                  </span>
                )}
              </div>

              {/* Connector line */}
              {!isLast && (
                <div className="flex-1 mt-5 mx-1">
                  <div
                    className={`h-0.5 rounded-full transition-all duration-500 ${
                      idx < currentIdx ? "bg-[#3B1F6A]/40" : "bg-slate-200"
                    }`}
                  />
                </div>
              )}
            </React.Fragment>
          )
        })}
      </div>

      {/* No status note */}
      {currentIdx === -1 && (
        <p className="mt-4 text-xs text-slate-400 italic text-center">
          No status has been assigned to this response yet.
        </p>
      )}
    </div>
  )
}

// ─── Info row ─────────────────────────────────────────────────────────────────

function InfoRow({ icon: Icon, label, value, mono = false, muted = false }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-slate-100 last:border-0">
      <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-slate-50 border border-slate-100 mt-0.5">
        <Icon className="size-3.5 text-slate-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-0.5">{label}</p>
        {value ? (
          <p className={`text-sm leading-relaxed ${mono ? "font-mono text-slate-600" : "text-slate-700"} ${muted ? "italic text-slate-400" : ""}`}>
            {value}
          </p>
        ) : (
          <p className="text-sm text-slate-400 italic">Not set</p>
        )}
      </div>
    </div>
  )
}

// ─── Date card ────────────────────────────────────────────────────────────────

function DateCard({ label, value, icon: Icon }) {
  const formatted = fmtDate(value)
  return (
    <div className={`rounded-xl border p-4 flex flex-col gap-2 ${formatted ? "bg-white border-slate-200" : "bg-slate-50 border-slate-100"}`}>
      <div className="flex items-center gap-1.5">
        <Icon className={`size-3.5 ${formatted ? "text-[#3B1F6A]" : "text-slate-300"}`} />
        <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">{label}</span>
      </div>
      {formatted
        ? <p className="text-sm font-semibold text-slate-800">{formatted}</p>
        : <p className="text-xs text-slate-400 italic">Not set</p>
      }
    </div>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="min-h-screen bg-slate-50/60 p-6 lg:p-8 animate-pulse">
      <div className="max-w-4xl mx-auto space-y-5">
        <div className="h-5 w-32 bg-slate-200 rounded" />
        <div className="h-8 w-64 bg-slate-200 rounded" />
        <div className="h-32 bg-white border border-slate-200 rounded-xl" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-48 bg-white border border-slate-200 rounded-xl" />
          <div className="h-48 bg-white border border-slate-200 rounded-xl" />
        </div>
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function ResponseDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { response, loading, error } = useResponse(id)

  if (loading) return <Skeleton />

  if (error || !response) {
    return (
      <div className="min-h-screen bg-slate-50/60 flex items-center justify-center">
        <div className="text-center space-y-2">
          <p className="text-sm font-semibold text-slate-700">Could not load this response.</p>
          <button onClick={() => navigate(-1)} className="text-xs text-[#3B1F6A] hover:underline">
            Go back
          </button>
        </div>
      </div>
    )
  }

  const type   = getType(response.response_type)
  const TypeIcon = type.icon

  return (
    <div className="min-h-screen bg-slate-50/60 p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-5">

        {/* Back nav */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-700 transition-colors"
        >
          <ArrowLeft className="size-3.5" />
          Back to responses
        </button>

        {/* Page header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${type.bg} ${type.text} ${type.border}`}>
                <TypeIcon className="size-3" />
                {type.label}
              </span>
              <span className="text-xs font-mono text-slate-400 bg-white border border-slate-200 rounded px-1.5 py-0.5">
                #{shortId(response.id)}
              </span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight max-w-xl leading-snug">
              {response.response_description || <span className="italic text-slate-400 font-normal">No description</span>}
            </h1>
          </div>

          <button className="flex items-center gap-2 px-3.5 py-2 border border-slate-200 bg-white text-sm font-medium text-slate-700 rounded-lg hover:border-[#3B1F6A]/40 hover:text-[#3B1F6A] transition-all shadow-sm shrink-0">
            <Pencil className="size-3.5" />
            Edit
          </button>
        </div>

        {/* Workflow */}
        <WorkflowBar status={response.status} />

        {/* Linked risk */}
        <RiskCard risk={response.risk} navigate={navigate} />

        {/* 2-col layout */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

          {/* Left: details */}
          <div className="lg:col-span-3 bg-white border border-slate-200 rounded-xl px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-1">
              Details
            </p>
            <InfoRow icon={Hash}      label="Response ID"    value={response.id}                   mono />
            <InfoRow icon={User}      label="Responsible"    value={response.responsible_employee}  mono />
            <InfoRow icon={User}      label="Created by"     value={response.created_by}            mono />
            <InfoRow
              icon={FileText}
              label="Evidence Notes"
              value={response.evidence_notes || null}
            />
          </div>

          {/* Right: dates */}
          <div className="lg:col-span-2 space-y-3">
            <div className="bg-white border border-slate-200 rounded-xl px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">
                Key Dates
              </p>
              <div className="space-y-3">
                <DateCard label="Implementation"   value={response.date_implementation}      icon={Calendar} />
                <DateCard label="Design Check"     value={response.date_monitored_design}    icon={Clock}    />
                <DateCard label="Operating Check"  value={response.date_monitored_operating} icon={Clock}    />
              </div>
            </div>

            {/* Missing dates callout */}
            {!response.date_implementation && (
              <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                <Clock className="size-4 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-amber-700">Dates not set</p>
                  <p className="text-xs text-amber-600/80 mt-0.5">
                    Implementation and monitoring dates have not been assigned yet.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}

export default ResponseDetails