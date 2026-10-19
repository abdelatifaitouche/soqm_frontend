import { useParams, useNavigate } from "react-router-dom"
import {
  ArrowLeft, AlertCircle, Check,
  CircleDashed, FileSearch, Wrench, ClipboardCheck, CheckCircle2,
  AlertTriangle, ShieldAlert, ListChecks,
} from "lucide-react"
import { useFinding } from "@/features/findings/hooks/useFinding"
import { useDepts } from "@/features/departments/hooks/useDept"
import RootCauseSection from "@/features/findings/pages/RootCauseAnalysis"

// ── Config (match backend enums) ──────────────────────────────────────────────
// Candidates for a shared file (e.g. features/findings/data/findingConfig.js)
// since the list and create pages use the same values.

const STATUS_FLOW = ["open", "under_assessment", "remediation_in_progress", "pending_verification", "closed"]

const STATUS_CONFIG = {
  open: {
    label: "Open",
    icon: CircleDashed,
    cls: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-900/40 dark:text-slate-400 dark:border-slate-800",
  },
  under_assessment: {
    label: "Under assessment",
    icon: FileSearch,
    cls: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900",
  },
  remediation_in_progress: {
    label: "Remediation in progress",
    icon: Wrench,
    cls: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900",
  },
  pending_verification: {
    label: "Pending verification",
    icon: ClipboardCheck,
    cls: "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/30 dark:text-violet-400 dark:border-violet-900",
  },
  closed: {
    label: "Closed",
    icon: CheckCircle2,
    cls: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900",
  },
}

const SEVERITY_CONFIG = {
  deficiency: {
    label: "Deficiency",
    icon: AlertCircle,
    cls: "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950/30 dark:text-yellow-400 dark:border-yellow-900",
  },
  significant_deficiency: {
    label: "Significant deficiency",
    icon: AlertTriangle,
    cls: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/30 dark:text-orange-400 dark:border-orange-900",
  },
  material_deficiency: {
    label: "Material deficiency",
    icon: ShieldAlert,
    cls: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900",
  },
}

const SOURCE_LABEL = {
  Gtar: "GTAR",
  external_quality_review: "External quality review",
  external_engagement_system_review: "External engagement system review",
  internal_quality_management_system_review: "Internal quality management system review",
  internal_engagement_review: "Internal engagement review",
  restatements: "Restatements",
  other_quality_events: "Other quality events",
}

const PILL = "inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full border whitespace-nowrap"

function formatLabel(str) {
  if (!str) return "—"
  return str.toLowerCase().replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

function fmtDate(val) {
  if (!val) return "—"
  const d = new Date(/^\d{4}-\d{2}-\d{2}$/.test(val) ? `${val}T00:00:00` : val)
  if (Number.isNaN(d.getTime())) return "—"
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
}

// ── Shared pieces ─────────────────────────────────────────────────────────────

function Section({ title, aside, children, className = "" }) {
  return (
    <section className={`rounded-xl border border-border bg-card ${className}`}>
      <div className="flex items-center justify-between gap-3 px-5 pt-4 pb-3">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        {aside}
      </div>
      <div className="px-5 pb-5">{children}</div>
    </section>
  )
}

function EmptyState({ icon: Icon, title, text }) {
  return (
    <div className="flex flex-col items-center text-center gap-2 py-8">
      <div className="flex size-10 items-center justify-center rounded-xl bg-muted">
        <Icon className="size-4 text-muted-foreground/50" />
      </div>
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="text-xs text-muted-foreground max-w-sm leading-relaxed">{text}</p>
    </div>
  )
}

function DetailRow({ label, children }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5 border-b border-border/60 last:border-0">
      <dt className="text-xs text-muted-foreground shrink-0">{label}</dt>
      <dd className="text-sm text-foreground text-right">{children}</dd>
    </div>
  )
}

// ── Lifecycle stepper ─────────────────────────────────────────────────────────

function StatusStepper({ status }) {
  const currentIdx = STATUS_FLOW.indexOf(status)

  return (
    <ol className="flex">
      {STATUS_FLOW.map((step, idx) => {
        const done = idx < currentIdx
        const active = idx === currentIdx
        const isLast = idx === STATUS_FLOW.length - 1

        return (
          <li key={step} className="relative flex-1 flex flex-col items-center gap-2" aria-current={active ? "step" : undefined}>
            {!isLast && (
              <span className={`absolute top-[9px] left-1/2 w-full h-0.5 rounded-full ${done ? "bg-[#3B1F6A]" : "bg-border"}`} />
            )}
            <span
              className={`relative z-10 flex items-center justify-center size-[20px] rounded-full border-2 transition-colors ${
                done
                  ? "bg-[#3B1F6A] border-[#3B1F6A] text-white"
                  : active
                    ? "bg-card border-[#3B1F6A] ring-4 ring-[#EDE9F8] dark:ring-violet-500/15"
                    : "bg-card border-border"
              }`}
            >
              {done && <Check className="size-3" strokeWidth={3} />}
              {active && <span className="size-2 rounded-full bg-[#3B1F6A] dark:bg-[#7B3FBE]" />}
            </span>
            <span
              className={`text-xs text-center leading-tight px-1 ${
                active ? "font-semibold text-[#3B1F6A] dark:text-[#a78bdb]"
                : done ? "text-foreground/70"
                : "text-muted-foreground/70"
              }`}
            >
              {STATUS_CONFIG[step].label}
            </span>
          </li>
        )
      })}
    </ol>
  )
}

// ── Action plans ──────────────────────────────────────────────────────────────

function ActionPlansSection() {
  return (
    <Section title="Action plans">
      <EmptyState
        icon={ListChecks}
        title="No action plans yet"
        text="Actions that remediate this finding, with owners and due dates, will be tracked here."
      />
    </Section>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

function PageSkeleton() {
  return (
    <div className="max-w-6xl mx-auto space-y-6" aria-busy="true">
      <div className="h-5 w-24 rounded bg-muted animate-pulse" />
      <div className="rounded-xl border border-border bg-card p-8 space-y-4">
        <div className="h-12 w-32 rounded bg-muted animate-pulse" />
        <div className="h-6 w-64 rounded bg-muted animate-pulse" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
        <div className="h-48 rounded-xl border border-border bg-card animate-pulse" />
        <div className="h-48 rounded-xl border border-border bg-card animate-pulse" />
      </div>
    </div>
  )
}

function FindingDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { finding, loading, error } = useFinding(id)
  const { depts, loading: deptsLoading } = useDepts()

  if (loading) return <PageSkeleton />

  if (error || !finding) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 text-destructive">
            <AlertCircle className="size-4" />
            <p className="text-sm font-semibold text-foreground">
              {error ? "Couldn’t load this finding." : "Finding not found."}
            </p>
          </div>
          <button onClick={() => navigate("/findings")} className="text-xs text-[#3B1F6A] dark:text-[#a78bdb] hover:underline">
            Back to findings
          </button>
        </div>
      </div>
    )
  }

  const deptList = Array.isArray(depts) ? depts : depts?.items ?? []
  const deptName = deptList.find((d) => d.id === finding.department)?.name

  const status = STATUS_CONFIG[finding.status] ?? { label: formatLabel(finding.status), icon: CircleDashed, cls: STATUS_CONFIG.open.cls }
  const StatusIcon = status.icon
  const severity = finding.deficiency_severity
    ? SEVERITY_CONFIG[finding.deficiency_severity] ?? { label: formatLabel(finding.deficiency_severity), icon: AlertCircle, cls: SEVERITY_CONFIG.deficiency.cls }
    : null
  const SeverityIcon = severity?.icon

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16">
      {/* Top bar */}
      <button
        onClick={() => navigate("/findings")}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="size-4" />
        Findings
      </button>

      {/* Header card: identity, chips, lifecycle */}
      <header className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="p-6 sm:p-8">
          <p className="text-sm text-muted-foreground mb-1">Finding</p>
          <h1 className="text-5xl font-semibold tracking-tight text-foreground font-mono leading-none mb-5">
            {finding.finding_ref}
          </h1>

          <div className="flex items-center gap-2 flex-wrap">
            <span className={`${PILL} ${status.cls}`}>
              <StatusIcon className="size-3" />
              {status.label}
            </span>
            {severity && (
              <span className={`${PILL} ${severity.cls}`}>
                <SeverityIcon className="size-3" />
                {severity.label}
              </span>
            )}
            <span className="text-sm text-muted-foreground ml-1">
              {SOURCE_LABEL[finding.finding_source] ?? formatLabel(finding.finding_source)}
            </span>
          </div>
        </div>

        <div className="border-t border-border bg-muted/20 px-6 sm:px-8 py-5">
          <StatusStepper status={finding.status} />
        </div>
      </header>

      {/* Content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 items-start">
        <div className="space-y-6">
          <Section title="Description">
            <p className="text-[15px] text-foreground/90 leading-7 max-w-[68ch] whitespace-pre-line">
              {finding.description || <span className="italic text-muted-foreground">No description provided</span>}
            </p>
          </Section>

          <RootCauseSection rca={finding.root_cause_analysis} findingId={finding.id} />
          <ActionPlansSection />
        </div>

        <aside className="space-y-6">
          <Section title="Details">
            <dl className="-my-1">
              <DetailRow label="Source">
                {SOURCE_LABEL[finding.finding_source] ?? formatLabel(finding.finding_source)}
              </DetailRow>
              <DetailRow label="Department">
                {deptName ?? (
                  <span className="text-muted-foreground">{deptsLoading ? "Loading…" : "Unknown department"}</span>
                )}
              </DetailRow>
              <DetailRow label="Identified">{fmtDate(finding.created_at)}</DetailRow>
              <DetailRow label="Last updated">{fmtDate(finding.updated_at)}</DetailRow>
            </dl>
          </Section>
        </aside>
      </div>
    </div>
  )
}

export default FindingDetails