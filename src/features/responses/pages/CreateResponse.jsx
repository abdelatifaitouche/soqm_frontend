import React, { useState, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useComponentsOptions } from "@/features/isqm_components/hooks/useComponentsOptions"
import { useRiskOptions } from "@/features/risks/hooks/useRiskOptions"
import { useEmployeeOptions } from "@/features/employees/hooks/useEmployeeOptions"
import { createResponse } from "@/features/responses/api/responsesApi"
import {
  Loader2, CheckCircle2, XCircle, ShieldCheck, Eye,
  AlertTriangle, Users, X, ChevronRight, ArrowLeft,
  Calendar, Clock, Cpu, User,
} from "lucide-react"

// ── Enums ─────────────────────────────────────────────────────────────────────

const RESPONSE_TYPES = [
  { value: "DETECTIVE",  label: "Detective",  icon: Eye,           cls: "bg-blue-50 text-blue-700 border-blue-200 ring-blue-300" },
  { value: "PREVENTIVE", label: "Preventive", icon: ShieldCheck,   cls: "bg-violet-50 text-violet-700 border-violet-200 ring-violet-300" },
  { value: "CORRECTIVE", label: "Corrective", icon: AlertTriangle, cls: "bg-amber-50 text-amber-700 border-amber-200 ring-amber-300" },
]

const EXECUTION_TYPES = [
  { value: "MANUAL",    label: "Manual",    desc: "Performed by a person" },
  { value: "AUTOMATED", label: "Automated", desc: "System-driven" },
  { value: "HYBRID",    label: "Hybrid",    desc: "Mix of both" },
]

const FREQUENCIES = [
  { value: "continuous",    label: "Continuous" },
  { value: "daily",         label: "Daily" },
  { value: "weekly",        label: "Weekly" },
  { value: "biweekly",      label: "Bi-weekly" },
  { value: "monthly",       label: "Monthly" },
  { value: "bimonthly",     label: "Bi-monthly" },
  { value: "quarterly",     label: "Quarterly" },
  { value: "semiannually",  label: "Semi-annually" },
  { value: "annually",      label: "Annually" },
  { value: "ad_hoc",        label: "Ad hoc" },
  { value: "event_driven",  label: "Event-driven" },
]

// ── Schema ────────────────────────────────────────────────────────────────────

const schema = z.object({
  component_id:             z.string().uuid("Select a component"),
  risks:                    z.array(z.string().uuid()).min(1, "Select at least one risk"),
  response_name:            z.string().min(3, "Min 3 characters").max(200),
  response_description:     z.string().min(10, "Min 10 characters").max(1000),
  response_type:            z.enum(["DETECTIVE", "PREVENTIVE", "CORRECTIVE"]),
  response_employee:        z.string().uuid("Select an employee"),
  evidence_notes:           z.string().min(5, "Min 5 characters").max(500),
  frequency:                z.string().min(1, "Select a frequency"),
  execution_type:           z.string().min(1, "Select an execution type"),
  date_implementation:      z.string().optional(),
  date_monitored_design:    z.string().optional(),
  date_monitored_operating: z.string().optional(),
})

// ── Shared field styles ───────────────────────────────────────────────────────

const INPUT  = "w-full h-9 rounded-lg border border-input bg-card px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-[#7B3FBE] transition-colors disabled:opacity-50"
const LABEL  = "block text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5"

// ── Small components ──────────────────────────────────────────────────────────

function FieldError({ msg }) {
  if (!msg) return null
  return (
    <p className="mt-1 text-xs text-destructive flex items-center gap-1">
      <XCircle className="size-3 shrink-0" /> {msg}
    </p>
  )
}

function SectionHeading({ step, title, subtitle }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="flex size-6 items-center justify-center rounded-full bg-[#3B1F6A] text-white text-[10px] font-bold shrink-0">
        {step}
      </div>
      <div>
        <p className="text-sm font-semibold text-foreground">{title}</p>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
    </div>
  )
}

function Card({ children, className = "" }) {
  return (
    <div className={`rounded-xl border border-border bg-card p-6 ${className}`}>
      {children}
    </div>
  )
}

// ── Risk checkbox item ────────────────────────────────────────────────────────

function RiskItem({ risk, checked, onToggle }) {
  return (
    <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
      checked
        ? "border-[#7B3FBE] bg-[#EDE9F8] dark:bg-[#3B1F6A]/20"
        : "border-border bg-card hover:bg-muted/50"
    }`}>
      <div className={`flex size-4 items-center justify-center rounded border-2 shrink-0 transition-colors ${
        checked ? "bg-[#3B1F6A] border-[#3B1F6A]" : "border-border"
      }`}>
        {checked && <CheckCircle2 className="size-2.5 text-white" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-[#7B3FBE] font-mono">{risk.risk_ref}</p>
        <p className="text-xs text-muted-foreground truncate">{risk.description || "No description"}</p>
      </div>
      <input type="checkbox" checked={checked} onChange={onToggle} className="sr-only" />
    </label>
  )
}

// ── Employee card ─────────────────────────────────────────────────────────────

function EmployeeCard({ employee, selected, onSelect }) {
  const initials = `${employee.first_name?.[0] ?? ""}${employee.last_name?.[0] ?? ""}`.toUpperCase()
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
        selected
          ? "border-[#7B3FBE] bg-[#EDE9F8] dark:bg-[#3B1F6A]/20 ring-1 ring-[#7B3FBE]"
          : "border-border bg-card hover:bg-muted/50"
      }`}
    >
      <div className="flex size-8 items-center justify-center rounded-full bg-[#EDE9F8] dark:bg-accent text-[#3B1F6A] dark:text-foreground text-[11px] font-bold shrink-0">
        {initials}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-foreground truncate">
          {employee.first_name} {employee.last_name}
        </p>
        <p className="text-[10px] text-muted-foreground truncate">{employee.job_title}</p>
      </div>
      {selected && <CheckCircle2 className="size-4 text-[#7B3FBE] ml-auto shrink-0" />}
    </button>
  )
}

// ── Success overlay ───────────────────────────────────────────────────────────

function SuccessOverlay() {
  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-[2px] flex items-center justify-center p-4 z-50">
      <div className="bg-card border border-emerald-200 dark:border-emerald-900 rounded-2xl px-8 py-10 flex flex-col items-center gap-3 shadow-2xl max-w-sm w-full text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900">
          <CheckCircle2 className="size-7 text-emerald-600 dark:text-emerald-400" />
        </div>
        <p className="text-base font-bold text-foreground">Response created!</p>
        <p className="text-sm text-muted-foreground">Redirecting you back…</p>
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function CreateResponse() {
  const navigate = useNavigate()

  const { options: components, loading: loadingComponents } = useComponentsOptions()
  const { employee_options, employee_loading: loadingEmployees }  = useEmployeeOptions()

  const {
    register, handleSubmit, formState: { errors },
    watch, setValue,
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      component_id: "", risks: [], response_name: "",
      response_description: "", response_type: "DETECTIVE",
      response_employee: "", evidence_notes: "",
      frequency: "", execution_type: "",
      date_implementation: "", date_monitored_design: "", date_monitored_operating: "",
    },
  })

  const componentId      = watch("component_id")
  const selectedRisks    = watch("risks")
  const selectedEmployee = watch("response_employee")
  const responseType     = watch("response_type")
  const executionType    = watch("execution_type")
  const frequency        = watch("frequency")

  const { risk_options, risk_loading } = useRiskOptions(componentId ? { component_id: componentId } : {})

  const [submitting, setSubmitting] = useState(false)
  const [success,    setSuccess]    = useState(false)
  const [apiError,   setApiError]   = useState(null)

  const handleRiskToggle = (id) => {
    const curr = selectedRisks || []
    setValue("risks", curr.includes(id) ? curr.filter((r) => r !== id) : [...curr, id])
  }

  const selectedRiskObjects = useMemo(
    () => (risk_options || []).filter((r) => (selectedRisks || []).includes(r.id)),
    [risk_options, selectedRisks]
  )

  const selectedEmployeeObj = useMemo(
    () => (employee_options || []).find((e) => e.id === selectedEmployee) ?? null,
    [employee_options, selectedEmployee]
  )

  const onSubmit = async (data) => {
    setSubmitting(true); setApiError(null)
    try {
      await createResponse({
        risks:                    data.risks,
        component_id:             data.component_id,
        response_name:            data.response_name,
        response_description:     data.response_description,
        response_type:            data.response_type,
        response_employee:        data.response_employee,
        evidence_notes:           data.evidence_notes,
        frequency:                data.frequency,
        execution_type:           data.execution_type,
        date_implementation:      data.date_implementation || null,
        date_monitored_design:    data.date_monitored_design || null,
        date_monitored_operating: data.date_monitored_operating || null,
      })
      setSuccess(true)
      setTimeout(() => navigate(-1), 1800)
    } catch (err) {
      setApiError(err?.response?.data?.detail || err?.message || "Failed to create response")
    } finally {
      setSubmitting(false)
    }
  }

  const step2Ready = !!componentId
  const step3Ready = step2Ready && selectedRisks?.length > 0
  const step4Ready = step3Ready
  const step5Ready = step4Ready && !!selectedEmployee

  if (success) return <SuccessOverlay />

  return (
    <div className="max-w mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground tracking-tight">Create Response</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Define a risk response control measure</p>
        </div>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg border border-border bg-card hover:bg-muted text-foreground transition-colors"
        >
          <ArrowLeft className="size-3.5" /> Cancel
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

        {/* ── Step 1: Component ─────────────────────────────────────── */}
        <Card>
          <SectionHeading step={1} title="Select component" subtitle="Which component does this response belong to?" />
          <div>
            <label className={LABEL}>Component <span className="text-destructive">*</span></label>
            <select {...register("component_id")} disabled={submitting || loadingComponents} className={INPUT}>
              <option value="">Select a component…</option>
              {components?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <FieldError msg={errors.component_id?.message} />
          </div>
        </Card>

        {/* ── Step 2: Risks ─────────────────────────────────────────── */}
        {step2Ready && (
          <Card>
            <SectionHeading
              step={2}
              title="Link risks"
              subtitle={selectedRisks?.length ? `${selectedRisks.length} risk${selectedRisks.length !== 1 ? "s" : ""} selected` : "Select at least one risk to address"}
            />

            {risk_loading ? (
              <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
                <Loader2 className="size-4 animate-spin" /><span className="text-sm">Loading risks…</span>
              </div>
            ) : !risk_options?.length ? (
              <div className="flex flex-col items-center gap-2 py-8">
                <AlertTriangle className="size-6 text-amber-400" />
                <p className="text-sm text-muted-foreground">No risks found for this component.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {risk_options.map((risk) => (
                    <RiskItem
                      key={risk.id}
                      risk={risk}
                      checked={selectedRisks?.includes(risk.id) || false}
                      onToggle={() => handleRiskToggle(risk.id)}
                    />
                  ))}
                </div>

                {/* Selected tags */}
                {selectedRiskObjects.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {selectedRiskObjects.map((r) => (
                      <span key={r.id} className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full bg-[#EDE9F8] text-[#3B1F6A] dark:bg-accent dark:text-foreground">
                        {r.risk_ref}
                        <button type="button" onClick={() => handleRiskToggle(r.id)}>
                          <X className="size-2.5 hover:text-red-500 transition-colors" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </>
            )}
            <FieldError msg={errors.risks?.message} />
          </Card>
        )}

        {/* ── Step 3: Response details ──────────────────────────────── */}
        {step3Ready && (
          <Card>
            <SectionHeading step={3} title="Response details" subtitle="Name, type, description and evidence" />

            {/* Type selector */}
            <div className="mb-5">
              <label className={LABEL}>Type <span className="text-destructive">*</span></label>
              <div className="grid grid-cols-3 gap-2">
                {RESPONSE_TYPES.map((t) => {
                  const Icon    = t.icon
                  const active  = responseType === t.value
                  return (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setValue("response_type", t.value)}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${
                        active
                          ? `${t.cls} ring-2 ring-offset-1`
                          : "border-border bg-card hover:bg-muted/50 text-muted-foreground"
                      }`}
                    >
                      <Icon className="size-4" />
                      <span className="text-xs font-semibold">{t.label}</span>
                    </button>
                  )
                })}
              </div>
              <FieldError msg={errors.response_type?.message} />
            </div>

            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className={LABEL}>Response name <span className="text-destructive">*</span></label>
                <input
                  type="text"
                  placeholder="e.g., Implement security training programme"
                  disabled={submitting}
                  {...register("response_name")}
                  className={INPUT}
                />
                <FieldError msg={errors.response_name?.message} />
              </div>

              {/* Description */}
              <div>
                <label className={LABEL}>Description <span className="text-destructive">*</span></label>
                <textarea
                  placeholder="Detailed description of the response…"
                  disabled={submitting}
                  {...register("response_description")}
                  rows={3}
                  className={`${INPUT} h-auto py-2 resize-none`}
                />
                <FieldError msg={errors.response_description?.message} />
              </div>

              {/* Evidence notes */}
              <div>
                <label className={LABEL}>Evidence notes <span className="text-destructive">*</span></label>
                <textarea
                  placeholder="Supporting evidence for this response…"
                  disabled={submitting}
                  {...register("evidence_notes")}
                  rows={2}
                  className={`${INPUT} h-auto py-2 resize-none`}
                />
                <FieldError msg={errors.evidence_notes?.message} />
              </div>
            </div>
          </Card>
        )}

        {/* ── Step 4: Execution ─────────────────────────────────────── */}
        {step3Ready && (
          <Card>
            <SectionHeading step={4} title="Execution & frequency" subtitle="How and how often is this control performed?" />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

              {/* Execution type */}
              <div>
                <label className={LABEL}>Execution type <span className="text-destructive">*</span></label>
                <div className="space-y-2">
                  {EXECUTION_TYPES.map((e) => (
                    <button
                      key={e.value}
                      type="button"
                      onClick={() => setValue("execution_type", e.value)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-all ${
                        executionType === e.value
                          ? "border-[#7B3FBE] bg-[#EDE9F8] dark:bg-[#3B1F6A]/20 ring-1 ring-[#7B3FBE]"
                          : "border-border bg-card hover:bg-muted/50"
                      }`}
                    >
                      <Cpu className={`size-3.5 shrink-0 ${executionType === e.value ? "text-[#7B3FBE]" : "text-muted-foreground"}`} />
                      <div>
                        <p className={`text-xs font-semibold ${executionType === e.value ? "text-[#3B1F6A] dark:text-[#a78bdb]" : "text-foreground"}`}>{e.label}</p>
                        <p className="text-[10px] text-muted-foreground">{e.desc}</p>
                      </div>
                      {executionType === e.value && <CheckCircle2 className="size-3.5 text-[#7B3FBE] ml-auto shrink-0" />}
                    </button>
                  ))}
                </div>
                <FieldError msg={errors.execution_type?.message} />
              </div>

              {/* Frequency */}
              <div>
                <label className={LABEL}>Frequency <span className="text-destructive">*</span></label>
                <div className="grid grid-cols-2 gap-1.5">
                  {FREQUENCIES.map((f) => (
                    <button
                      key={f.value}
                      type="button"
                      onClick={() => setValue("frequency", f.value)}
                      className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium text-left transition-all ${
                        frequency === f.value
                          ? "border-[#7B3FBE] bg-[#EDE9F8] dark:bg-[#3B1F6A]/20 text-[#3B1F6A] dark:text-[#a78bdb] ring-1 ring-[#7B3FBE]"
                          : "border-border bg-card hover:bg-muted/50 text-foreground"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
                <FieldError msg={errors.frequency?.message} />
              </div>
            </div>

            {/* Optional dates */}
            <div className="mt-5 pt-5 border-t border-border">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                Key dates <span className="normal-case font-normal">(optional)</span>
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { name: "date_implementation",      label: "Implementation date" },
                  { name: "date_monitored_design",    label: "Design check date" },
                  { name: "date_monitored_operating", label: "Operating check date" },
                ].map((d) => (
                  <div key={d.name}>
                    <label className={LABEL}>{d.label}</label>
                    <input type="date" disabled={submitting} {...register(d.name)} className={INPUT} />
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}

        {/* ── Step 5: Assign employee ───────────────────────────────── */}
        {step4Ready && (
          <Card>
            <SectionHeading step={5} title="Assign owner" subtitle="Who is responsible for this response?" />

            {loadingEmployees ? (
              <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
                <Loader2 className="size-4 animate-spin" /><span className="text-sm">Loading employees…</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {employee_options?.map((emp) => (
                  <EmployeeCard
                    key={emp.id}
                    employee={emp}
                    selected={selectedEmployee === emp.id}
                    onSelect={() => setValue("response_employee", emp.id)}
                  />
                ))}
              </div>
            )}

            {selectedEmployeeObj && (
              <div className="mt-4 flex items-center gap-2.5 p-3 rounded-xl bg-[#EDE9F8] dark:bg-[#3B1F6A]/20 border border-[#7B3FBE]/30">
                <div className="flex size-7 items-center justify-center rounded-full bg-[#3B1F6A] text-white text-[10px] font-bold shrink-0">
                  {selectedEmployeeObj.first_name?.[0]}{selectedEmployeeObj.last_name?.[0]}
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#3B1F6A] dark:text-[#a78bdb]">
                    {selectedEmployeeObj.first_name} {selectedEmployeeObj.last_name}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Assigned owner</p>
                </div>
              </div>
            )}
            <FieldError msg={errors.response_employee?.message} />
          </Card>
        )}

        {/* ── API error ─────────────────────────────────────────────── */}
        {apiError && (
          <div className="flex items-center gap-2.5 bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-3 text-sm text-destructive">
            <XCircle className="size-4 shrink-0" /> {apiError}
          </div>
        )}

        {/* ── Submit ────────────────────────────────────────────────── */}
        {step5Ready && (
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-[#3B1F6A] hover:bg-[#52298F] rounded-lg transition-colors disabled:opacity-60 shadow-sm"
            >
              {submitting
                ? <><Loader2 className="size-4 animate-spin" /> Creating…</>
                : <><ShieldCheck className="size-4" /> Create response</>}
            </button>
          </div>
        )}
      </form>
    </div>
  )
}