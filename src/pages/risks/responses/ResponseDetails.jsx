import React, { useState, useMemo } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useResponse } from "@/hooks/useResponse"
import { useRisks } from "@/hooks/useRisks"
import {
  ArrowLeft, ShieldCheck, Eye, AlertTriangle, CircleDashed,
  Rocket, ClipboardCheck, CheckCircle2, Archive, Calendar,
  User, FileText, Clock, Pencil, ArrowUpRight, Info,
  Building2, Loader2, AlertCircle, ChevronLeft, ChevronRight,
  Target, ShieldAlert, FileSearch,
} from "lucide-react"
import { useResponseRisks } from "@/hooks/useResponseRisks"

// ── Normalize ─────────────────────────────────────────────────────────────────

function normalize(raw) {
  if (!raw) return { data: null, component: null }
  if (raw.RiskResponse) {
    return {
      data: raw.RiskResponse,
      component: { id: raw.id, name: raw.name, description: raw.description, display_order: raw.display_order },
    }
  }
  return { data: raw, component: raw.component ?? null }
}

// ── Config ────────────────────────────────────────────────────────────────────

const TYPE_CONFIG = {
  DETECTIVE:  { label: "Detective",  icon: Eye,           cls: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900" },
  PREVENTIVE: { label: "Preventive", icon: ShieldCheck,   cls: "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/30 dark:text-violet-400 dark:border-violet-900" },
  CORRECTIVE: { label: "Corrective", icon: AlertTriangle, cls: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900" },
}

const WORKFLOW = [
  { key: "DRAFT",       label: "Draft",       icon: CircleDashed   },
  { key: "PLANNED",     label: "Planned",     icon: Rocket         },
  { key: "IMPLEMENTED", label: "Implemented", icon: ClipboardCheck },
  { key: "EFFECTIVE",   label: "Effective",   icon: CheckCircle2   },
  { key: "RETIRED",     label: "Retired",     icon: Archive        },
]

const RISK_STATUS_CONFIG = {
  identified:        { label: "Identified",        icon: ShieldAlert,   cls: "bg-slate-100 text-slate-600 border-slate-200" },
  assessed:          { label: "Assessed",           icon: FileSearch,    cls: "bg-blue-50 text-blue-700 border-blue-200" },
  treatment_planned: { label: "Treatment Planned",  icon: ClipboardCheck,cls: "bg-violet-50 text-violet-700 border-violet-200" },
  mitigated:         { label: "Mitigated",          icon: ShieldCheck,   cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  accepted:          { label: "Accepted",           icon: CheckCircle2,  cls: "bg-teal-50 text-teal-700 border-teal-200" },
  closed:            { label: "Closed",             icon: Archive,       cls: "bg-slate-100 text-slate-400 border-slate-200" },
  under_review:      { label: "Under Review",       icon: Rocket,        cls: "bg-amber-50 text-amber-700 border-amber-200" },
}

function getType(type) {
  return TYPE_CONFIG[type] || { label: type || "Unknown", icon: ShieldCheck, cls: "bg-slate-50 text-slate-500 border-slate-200" }
}

function getRiskZone(significance, occurence) {
  const score = significance * occurence
  if (score >= 6) return { label: "Critical", score, scoreCls: "text-red-600 dark:text-red-400",     zoneCls: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900" }
  if (score >= 3) return { label: "High",     score, scoreCls: "text-amber-600 dark:text-amber-400", zoneCls: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900" }
  return             { label: "Low",       score, scoreCls: "text-emerald-600 dark:text-emerald-400",  zoneCls: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900" }
}

function fmtDate(val) {
  if (!val) return "—"
  return new Date(val).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
}

// ── Workflow stepper ──────────────────────────────────────────────────────────

function WorkflowStepper({ status }) {
  const currentIdx = WORKFLOW.findIndex((s) => s.key === status)

  return (
    <div className="flex items-center">
      {WORKFLOW.map((step, idx) => {
        const done    = idx < currentIdx
        const active  = idx === currentIdx
        const isLast  = idx === WORKFLOW.length - 1
        const Icon    = step.icon

        return (
          <React.Fragment key={step.key}>
            <div className="flex flex-col items-center gap-1.5 shrink-0">
              <div className={`flex size-7 items-center justify-center rounded-full ring-2 transition-all ${
                done   ? "bg-[#3B1F6A] ring-[#3B1F6A]/20" :
                active ? "bg-[#EDE9F8] ring-[#3B1F6A] dark:bg-[#3B1F6A]/20" :
                         "bg-muted ring-border"
              }`}>
                {done
                  ? <CheckCircle2 className="size-3.5 text-white" />
                  : <Icon className={`size-3.5 ${active ? "text-[#3B1F6A]" : "text-muted-foreground"}`} />
                }
              </div>
              <span className={`text-[9px] font-semibold text-center w-14 leading-tight ${
                active ? "text-[#3B1F6A] dark:text-[#a78bdb]" :
                done   ? "text-foreground" :
                         "text-muted-foreground"
              }`}>
                {step.label}
              </span>
            </div>
            {!isLast && (
              <div className="flex-1 mb-4 mx-1">
                <div className={`h-0.5 rounded-full ${idx < currentIdx ? "bg-[#3B1F6A]/50" : "bg-border"}`} />
              </div>
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}

// ── Stat ──────────────────────────────────────────────────────────────────────

function Stat({ icon: Icon, label, value }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1">
        <Icon className="size-3 text-muted-foreground" />
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
      </div>
      <p className="text-sm text-foreground font-medium">{value || "—"}</p>
    </div>
  )
}

// ── Owner card ────────────────────────────────────────────────────────────────

function OwnerCard({ employee }) {
  if (!employee) return (
    <div className="flex items-center gap-2.5">
      <div className="flex size-8 items-center justify-center rounded-full bg-muted shrink-0">
        <User className="size-3.5 text-muted-foreground" />
      </div>
      <p className="text-xs text-muted-foreground italic">No owner assigned</p>
    </div>
  )

  const initials = `${employee.first_name?.[0] ?? ""}${employee.last_name?.[0] ?? ""}`.toUpperCase()

  return (
    <div className="group relative">
      <div className="flex items-center gap-2.5 cursor-default">
        <div className="flex size-8 items-center justify-center rounded-full bg-[#EDE9F8] text-[#3B1F6A] dark:bg-accent dark:text-foreground text-[11px] font-bold shrink-0">
          {initials}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{employee.first_name} {employee.last_name}</p>
          <p className="text-xs text-muted-foreground truncate">{employee.job_title}</p>
        </div>
        <Info className="size-3 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors shrink-0" />
      </div>
      <div className="absolute left-0 top-full mt-2 w-64 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 pointer-events-none group-hover:pointer-events-auto">
        <div className="bg-card border border-border rounded-xl shadow-xl p-4 space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-full bg-[#EDE9F8] text-[#3B1F6A] dark:bg-accent dark:text-foreground text-xs font-bold shrink-0">
              {initials}
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">{employee.first_name} {employee.last_name}</p>
              <p className="text-xs text-muted-foreground">{employee.job_title}</p>
            </div>
          </div>
          <div className="border-t border-border pt-2.5 space-y-1.5">
            {[
              { label: "Level",  value: employee.level?.toLowerCase().replace("_", " ") },
              { label: "Status", value: employee.status?.toLowerCase() },
              ...(employee.department ? [{ label: "Department", value: employee.department.name }] : []),
            ].map((r) => (
              <div key={r.label} className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{r.label}</span>
                <span className="font-medium text-foreground capitalize">{r.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Component card ────────────────────────────────────────────────────────────

function ComponentCard({ component, navigate }) {
  if (!component) return null
  return (
    <div className="group relative">
      <div
        onClick={() => navigate(`/components/${component.id}`)}
        className="flex items-center gap-2.5 cursor-pointer"
      >
        <div className="flex size-8 items-center justify-center rounded-lg bg-muted shrink-0">
          <Building2 className="size-3.5 text-muted-foreground" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{component.name}</p>
          <p className="text-xs text-muted-foreground">SOQM component</p>
        </div>
        <Info className="size-3 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors shrink-0" />
      </div>
      <div className="absolute left-0 top-full mt-2 w-72 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 pointer-events-none group-hover:pointer-events-auto">
        <div className="bg-card border border-border rounded-xl shadow-xl p-4">
          <p className="text-sm font-bold text-foreground mb-2">{component.name}</p>
          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-4">
            {component.description || "No description"}
          </p>
        </div>
      </div>
    </div>
  )
}

// ── Risk row ──────────────────────────────────────────────────────────────────

function RiskRow({ risk, navigate }) {
  const zone    = getRiskZone(risk.significance, risk.occurence)
  const key     = risk.status?.toLowerCase()
  const stCfg   = RISK_STATUS_CONFIG[key] ?? { label: risk.status, icon: CircleDashed, cls: "bg-slate-100 text-slate-400 border-slate-200" }
  const StIcon  = stCfg.icon

  return (
    <tr
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
        <p className="text-xs text-muted-foreground truncate">{risk.risk_description || "—"}</p>
      </td>

      {/* Status */}
      <td className="px-5 py-3.5">
        <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${stCfg.cls}`}>
          <StIcon className="size-2.5" />
          {stCfg.label}
        </span>
      </td>

      {/* Score */}
      <td className="px-5 py-3.5">
        <span className={`text-sm font-bold tabular-nums ${zone.scoreCls}`}>{zone.score}</span>
      </td>

      {/* Zone */}
      <td className="px-5 py-3.5">
        <span className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full border ${zone.zoneCls}`}>
          {zone.label}
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
  )
}

// ── Pagination ────────────────────────────────────────────────────────────────

function Pagination({ page, totalPages, onChange, loading }) {
  if (totalPages <= 1) return null
  const pages = useMemo(() => {
    const set = new Set([1, totalPages, page - 1, page, page + 1])
    return [...set].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b)
  }, [page, totalPages])

  return (
    <div className="flex items-center justify-between px-5 py-3 border-t border-border">
      <p className="text-xs text-muted-foreground">Page {page} of {totalPages}</p>
      <div className="flex items-center gap-1">
        <button onClick={() => onChange(page - 1)} disabled={page <= 1 || loading}
          className="flex size-7 items-center justify-center rounded-md border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
          <ChevronLeft className="size-3.5" />
        </button>
        {pages.map((p, i) => (
          <React.Fragment key={p}>
            {i > 0 && pages[i - 1] !== p - 1 && <span className="text-xs text-muted-foreground px-0.5">…</span>}
            <button onClick={() => onChange(p)} disabled={loading}
              className={`flex size-7 items-center justify-center rounded-md text-xs font-medium transition-colors ${
                p === page ? "bg-[#3B1F6A] text-white" : "border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}>
              {p}
            </button>
          </React.Fragment>
        ))}
        <button onClick={() => onChange(page + 1)} disabled={page >= totalPages || loading}
          className="flex size-7 items-center justify-center rounded-md border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
          <ChevronRight className="size-3.5" />
        </button>
      </div>
    </div>
  )
}

// ── Risks section ─────────────────────────────────────────────────────────────

function RisksSection({ responseId }) {
  const navigate    = useNavigate()
  const [page, setPage] = useState(1)
  const { response_risks, setResponseRisks, risks_loading, risks_error }= useResponseRisks(
    responseId,
  )

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Target className="size-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-foreground">Linked risks</h2>
        </div>
        
      </div>

      {risks_loading ? (
        <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          <span className="text-sm">Loading risks…</span>
        </div>
      ) : risks_error ? (
        <div className="flex items-center justify-center gap-2 py-12 text-destructive">
          <AlertCircle className="size-4" />
          <span className="text-sm">Failed to load risks</span>
        </div>
      ) : !response_risks?.length ? (
        <div className="flex flex-col items-center gap-2 py-12">
          <div className="flex size-10 items-center justify-center rounded-xl bg-muted">
            <Target className="size-4 text-muted-foreground/40" />
          </div>
          <p className="text-sm text-muted-foreground">No risks linked to this response.</p>
        </div>
      ) : (
        <>
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/20">
                {["Ref", "Description", "Status", "Score", "Zone", ""].map((h) => (
                  <th key={h} className="text-left text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-5 py-3 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {response_risks.map((risk) => <RiskRow key={risk.id} risk={risk} navigate={navigate} />)}
            </tbody>
          </table>
        </>
      )}
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function ResponseDetails() {
  const { id }   = useParams()
  const navigate = useNavigate()
  const { response: raw, loading, error } = useResponse(id)

  if (loading) return (
    <div className="flex items-center justify-center h-64 gap-2 text-muted-foreground">
      <Loader2 className="size-5 animate-spin" />
    </div>
  )

  if (error || !raw) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center space-y-2">
        <p className="text-sm font-semibold text-foreground">Could not load this response.</p>
        <button onClick={() => navigate(-1)} className="text-xs text-[#3B1F6A] hover:underline">Go back</button>
      </div>
    </div>
  )

  const { data: response, component } = normalize(raw)
  const type    = getType(response.response_type)
  const TypeIcon = type.icon

  return (
    <div className="space-y-6 max-w-5xl mx-auto">

      {/* Breadcrumb + actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors group"
        >
          <ArrowLeft className="size-3.5 group-hover:-translate-x-0.5 transition-transform" />
          Back to responses
        </button>
        <button className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg border border-border bg-card hover:bg-muted text-foreground transition-colors">
          <Pencil className="size-3.5" /> Edit
        </button>
      </div>

      {/* Title + type */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-full border ${type.cls}`}>
              <TypeIcon className="size-3" />
              {type.label}
            </span>
            <span className="text-[11px] font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">
              {response.response_ref}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight leading-snug">
            {response.response_name || <span className="italic text-muted-foreground font-normal">Untitled response</span>}
          </h1>
        </div>
      </div>

      {/* Workflow */}
      <div className="rounded-xl border border-border bg-card px-6 py-5">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-5">
          Workflow status
        </p>
        <WorkflowStepper status={response.status} />
      </div>

      {/* Two-col grid: details left, owner+component right */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-6">

        {/* Details card */}
        <div className="rounded-xl border border-border bg-card px-6 py-5 space-y-5">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Details</p>

          {/* Description */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">Description</p>
            <p className="text-sm text-foreground leading-relaxed">
              {response.response_description || <span className="italic text-muted-foreground">No description</span>}
            </p>
          </div>

          <div className="border-t border-border pt-5 grid grid-cols-2 sm:grid-cols-3 gap-5">
            <Stat icon={Clock}         label="Frequency"       value={response.frequency} />
            <Stat icon={ClipboardCheck}label="Execution"       value={response.execution_type} />
            <Stat icon={Calendar}      label="Implemented"     value={fmtDate(response.date_implementation)} />
            <Stat icon={Calendar}      label="Design check"    value={fmtDate(response.date_monitored_design)} />
            <Stat icon={Calendar}      label="Operating check" value={fmtDate(response.date_monitored_operating)} />
            <Stat icon={FileText}      label="Evidence notes"  value={response.evidence_notes} />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card px-5 py-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">Owner</p>
            <OwnerCard employee={response.assigned_employee} />
          </div>
          {component && (
            <div className="rounded-xl border border-border bg-card px-5 py-4">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">Component</p>
              <ComponentCard component={component} navigate={navigate} />
            </div>
          )}
        </div>
      </div>

      {/* Linked risks — full table, no scroll prison */}
      <RisksSection responseId={response.id} />
    </div>
  )
}