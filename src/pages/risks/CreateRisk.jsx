import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useObjectivesOptions } from "@/hooks/useObjectiveOptions"
import { useComponentsOptions } from "@/hooks/useComponentsOptions"
import { createRisk } from "@/api/endpoints/riskApi"
import {
  AlertTriangle, ArrowLeft, ChevronDown,
  Loader2, Calendar, Hash, FileText,
  Target, Layers, CheckCircle2, XCircle,
} from "lucide-react"

// ─── 3×3 matrix config ───────────────────────────────────────────────────────
// score = occurrence × significance, max = 9
const MATRIX_COLORS = {
  1: { bg: "bg-emerald-100", text: "text-emerald-800", label: "Low"      },
  2: { bg: "bg-emerald-100", text: "text-emerald-800", label: "Low"      },
  3: { bg: "bg-amber-100",   text: "text-amber-800",   label: "Medium"   },
  4: { bg: "bg-amber-100",   text: "text-amber-800",   label: "Medium"   },
  6: { bg: "bg-orange-100",  text: "text-orange-800",  label: "High"     },
  9: { bg: "bg-red-100",     text: "text-red-800",     label: "Critical" },
}
function matrixCell(o, s) {
  const score = o * s
  return MATRIX_COLORS[score] || { bg: "bg-slate-100", text: "text-slate-500", label: score }
}

const SCORE_BADGE = {
  1: { bg: "bg-emerald-50",  text: "text-emerald-700", border: "border-emerald-200", bar: "bg-emerald-400", label: "Low"      },
  2: { bg: "bg-emerald-50",  text: "text-emerald-700", border: "border-emerald-200", bar: "bg-emerald-400", label: "Low"      },
  3: { bg: "bg-amber-50",    text: "text-amber-700",   border: "border-amber-200",   bar: "bg-amber-400",   label: "Medium"   },
  4: { bg: "bg-amber-50",    text: "text-amber-700",   border: "border-amber-200",   bar: "bg-amber-400",   label: "Medium"   },
  6: { bg: "bg-orange-50",   text: "text-orange-700",  border: "border-orange-200",  bar: "bg-orange-500",  label: "High"     },
  9: { bg: "bg-red-50",      text: "text-red-700",     border: "border-red-200",     bar: "bg-red-500",     label: "Critical" },
}
const LEVEL_LABELS = { 1: "Low", 2: "Med", 3: "High" }

// ─── Small helpers ────────────────────────────────────────────────────────────

function Label({ children, required }) {
  return (
    <label className="block text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-1.5">
      {children}{required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
  )
}
function FieldError({ msg }) {
  if (!msg) return null
  return <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><XCircle className="size-3" />{msg}</p>
}

function SelectField({ icon: Icon, placeholder, value, onChange, options, loading, error, disabled }) {
  return (
    <div className="relative">
      <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
        {loading
          ? <Loader2 className="size-3.5 text-slate-400 animate-spin" />
          : <Icon className="size-3.5 text-slate-400" />}
      </div>
      <select
        value={value} onChange={onChange} disabled={loading || disabled}
        className={`w-full appearance-none pl-9 pr-8 py-2.5 text-sm border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#3B1F6A]/20 focus:border-[#3B1F6A]/50 transition-all
          ${error ? "border-red-300" : "border-slate-200"}
          ${loading || disabled ? "opacity-50 cursor-not-allowed bg-slate-50" : "cursor-pointer"}
          ${!value ? "text-slate-400" : "text-slate-800"}`}
      >
        <option value="">{loading ? "Loading…" : placeholder}</option>
        {options?.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
    </div>
  )
}

// ─── Button picker (1-2-3) ────────────────────────────────────────────────────

function ButtonPicker({ value, onChange }) {
  return (
    <div className="flex gap-2">
      {[1, 2, 3].map((n) => (
        <button
          key={n} type="button"
          onClick={() => onChange(String(n))}
          className={`flex-1 py-2.5 rounded-lg text-sm font-bold border transition-all duration-150 ${
            Number(value) === n
              ? "bg-[#3B1F6A] text-white border-[#3B1F6A] shadow-sm"
              : "bg-white text-slate-500 border-slate-200 hover:border-[#3B1F6A]/30 hover:text-[#3B1F6A]"
          }`}
        >
          {n}
          <span className={`block text-[9px] font-semibold uppercase tracking-wider mt-0.5 ${Number(value) === n ? "text-white/70" : "text-slate-400"}`}>
            {LEVEL_LABELS[n]}
          </span>
        </button>
      ))}
    </div>
  )
}

// ─── 3×3 Matrix visual ────────────────────────────────────────────────────────

function RiskMatrix({ occ, sig }) {
  const o = Number(occ)
  const s = Number(sig)
  const score = o * s
  const badge = SCORE_BADGE[score]

  return (
    <div className="space-y-2">
      {/* Grid: rows = significance (3→1), cols = occurrence (1→3) */}
      <div className="flex gap-1">
        {/* Y-axis label */}
        <div className="flex flex-col justify-between items-center pr-1 py-1" style={{ width: 20 }}>
          <span className="text-[8px] text-slate-400 font-semibold" style={{ writingMode: "vertical-rl", transform: "rotate(180deg)", letterSpacing: "0.1em" }}>SIGNIFICANCE</span>
        </div>
        <div className="flex-1 space-y-1">
          {[3, 2, 1].map((sigRow) => (
            <div key={sigRow} className="flex gap-1 items-center">
              <span className="text-[9px] text-slate-400 font-bold w-3 text-right shrink-0">{sigRow}</span>
              {[1, 2, 3].map((occCol) => {
                const cell = matrixCell(occCol, sigRow)
                const isActive = occCol === o && sigRow === s
                return (
                  <div
                    key={occCol}
                    className={`flex-1 h-8 rounded-md flex items-center justify-center text-[10px] font-bold transition-all duration-150
                      ${cell.bg} ${cell.text}
                      ${isActive ? "ring-2 ring-offset-1 ring-[#3B1F6A] scale-110 shadow-md z-10" : "opacity-60"}
                    `}
                  >
                    {occCol * sigRow}
                  </div>
                )
              })}
            </div>
          ))}
          {/* X-axis numbers */}
          <div className="flex gap-1 items-center">
            <span className="w-3 shrink-0" />
            {[1, 2, 3].map((n) => (
              <div key={n} className="flex-1 text-center text-[9px] text-slate-400 font-bold">{n}</div>
            ))}
          </div>
          <p className="text-center text-[8px] text-slate-400 font-semibold uppercase tracking-wider">Occurrence</p>
        </div>
      </div>

      {/* Score result */}
      {badge && (
        <div className={`flex items-center gap-2.5 rounded-lg border px-3 py-2 ${badge.bg} ${badge.border}`}>
          <div className={`flex flex-col items-center justify-center size-9 rounded-lg bg-white border ${badge.border} shrink-0`}>
            <span className={`text-base font-extrabold leading-none ${badge.text}`}>{score}</span>
          </div>
          <div className="flex-1">
            <p className={`text-xs font-bold ${badge.text}`}>{badge.label} Risk</p>
            <p className={`text-[10px] opacity-70 ${badge.text}`}>{occ} × {sig} = {score}</p>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Validation ───────────────────────────────────────────────────────────────

const INITIAL = {
  objective_id: "", component_id: "", risk_ref: "",
  risk_discription: "", occurence: "1", significance: "1", next_review_date: "",
}

function validate(form) {
  const e = {}
  if (!form.objective_id)            e.objective_id     = "Select an objective."
  if (!form.component_id)            e.component_id     = "Select a component."
  if (!form.risk_ref.trim())         e.risk_ref         = "Risk reference is required."
  if (!form.risk_discription.trim()) e.risk_discription = "Description is required."
  if (!form.next_review_date)        e.next_review_date = "Review date is required."
  return e
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function CreateRisk() {
  const navigate = useNavigate()
  const { options: componentOptions, loading: loadingComponents } = useComponentsOptions()

  const [form,       setForm]       = useState(INITIAL)

  const { options: objectiveOptions, loading: loadingObjectives } = useObjectivesOptions(
    form.component_id ? { component_id: form.component_id } : {}
  )
  const [errors,     setErrors]     = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [success,    setSuccess]    = useState(false)
  const [apiError,   setApiError]   = useState(null)

  const set = (field) => (e) => {
    const val = typeof e === "string" ? e : e.target.value
    setForm((p) => ({
      ...p,
      [field]: val,
      // reset objective whenever component changes
      ...(field === "component_id" ? { objective_id: "" } : {}),
    }))
    if (errors[field]) setErrors((p) => ({ ...p, [field]: null }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate(form)
    if (Object.keys(errs).length) { setErrors(errs); return }
    setSubmitting(true); setApiError(null)
    try {
      await createRisk({ ...form, occurence: Number(form.occurence), significance: Number(form.significance) })
      setSuccess(true)
      setTimeout(() => navigate(-1), 1800)
    } catch (err) {
      setApiError(err?.response?.data?.detail || "Something went wrong. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  const componentsMapped = componentOptions?.map((o) => ({ id: o.id, label: o.name }))
  const objectivesMapped = objectiveOptions?.map((o)  => ({ id: o.id, label: o.ref  }))

  if (success) return (
    <div className="min-h-screen bg-slate-50/60 flex items-center justify-center p-6">
      <div className="bg-white border border-emerald-200 rounded-2xl px-10 py-12 flex flex-col items-center gap-3 shadow-sm max-w-sm w-full text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-emerald-50 border border-emerald-200">
          <CheckCircle2 className="size-7 text-emerald-600" />
        </div>
        <p className="text-base font-bold text-slate-800">Risk created!</p>
        <p className="text-sm text-slate-500">Redirecting you back…</p>
      </div>
    </div>
  )

  return (
    <div className=" bg-slate-50/60 flex flex-col">
      <div className="max-w-5xl  w-full flex flex-col gap-5 flex-1">

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-xl bg-[#3B1F6A] shadow-sm">
            <AlertTriangle className="size-4 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Create Risk</h1>
            <p className="text-xs text-slate-400 mt-0.5">Define a new risk linked to a component and objective</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col gap-5">

          {/* ── Main 2-col grid ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 flex-1">

            {/* LEFT column */}
            <div className="flex flex-col gap-4">

              {/* Classification card */}
              <div className="bg-white border border-slate-200 rounded-xl px-5 py-4 space-y-4">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Classification</p>
                <div>
                  <Label required>Component</Label>
                  <SelectField icon={Layers} placeholder="Select a component…"
                    value={form.component_id} onChange={set("component_id")}
                    options={componentsMapped} loading={loadingComponents} error={errors.component_id} />
                  <FieldError msg={errors.component_id} />
                </div>
                <div>
                  <Label required>Objective</Label>
                  <SelectField icon={Target}
                    placeholder={!form.component_id ? "Select a component first…" : "Select an objective…"}
                    value={form.objective_id} onChange={set("objective_id")}
                    options={objectivesMapped} loading={loadingObjectives && !!form.component_id}
                    error={errors.objective_id}
                    disabled={!form.component_id} />
                  <FieldError msg={errors.objective_id} />
                </div>
              </div>

              {/* Identification card */}
              <div className="bg-white border border-slate-200 rounded-xl px-5 py-4 space-y-4 flex-1">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Identification</p>
                <div>
                  <Label required>Risk Reference</Label>
                  <div className="relative">
                    <Hash className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
                    <input type="text" placeholder="e.g. 1-b" value={form.risk_ref} onChange={set("risk_ref")}
                      className={`w-full pl-9 pr-3 py-2.5 text-sm border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#3B1F6A]/20 focus:border-[#3B1F6A]/50 transition-all placeholder:text-slate-400 ${errors.risk_ref ? "border-red-300" : "border-slate-200"}`} />
                  </div>
                  <FieldError msg={errors.risk_ref} />
                </div>
                <div className="flex-1">
                  <Label required>Description</Label>
                  <div className="relative">
                    <FileText className="pointer-events-none absolute left-3 top-3 size-3.5 text-slate-400" />
                    <textarea rows={4} placeholder="Describe the risk in detail…"
                      value={form.risk_discription} onChange={set("risk_discription")}
                      className={`w-full pl-9 pr-3 py-2.5 text-sm border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#3B1F6A]/20 focus:border-[#3B1F6A]/50 transition-all placeholder:text-slate-400 resize-none ${errors.risk_discription ? "border-red-300" : "border-slate-200"}`} />
                  </div>
                  <FieldError msg={errors.risk_discription} />
                </div>
              </div>
            </div>

            {/* RIGHT column */}
            <div className="flex flex-col gap-4">

              {/* Scoring card */}
              <div className="bg-white border border-slate-200 rounded-xl px-5 py-4 space-y-4">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Risk Scoring — 3×3 Matrix</p>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label required>Occurrence</Label>
                    <ButtonPicker value={form.occurence} onChange={set("occurence")} />
                  </div>
                  <div>
                    <Label required>Significance</Label>
                    <ButtonPicker value={form.significance} onChange={set("significance")} />
                  </div>
                </div>

                <RiskMatrix occ={form.occurence} sig={form.significance} />
              </div>

              {/* Review date card */}
              <div className="bg-white border border-slate-200 rounded-xl px-5 py-4 space-y-4">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Review Schedule</p>
                <div>
                  <Label required>Next Review Date</Label>
                  <div className="relative">
                    <Calendar className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
                    <input type="date" value={form.next_review_date} onChange={set("next_review_date")}
                      min={new Date().toISOString().split("T")[0]}
                      className={`w-full pl-9 pr-3 py-2.5 text-sm border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#3B1F6A]/20 focus:border-[#3B1F6A]/50 transition-all ${errors.next_review_date ? "border-red-300" : "border-slate-200"}`} />
                  </div>
                  <FieldError msg={errors.next_review_date} />
                </div>
              </div>
            </div>
          </div>

          {/* API error */}
          {apiError && (
            <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <XCircle className="size-4 text-red-500 shrink-0 mt-0.5" />
              <p className="text-xs text-red-600">{apiError}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pb-2">
            <button type="button" onClick={() => navigate(-1)}
              className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:border-slate-300 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={submitting}
              className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-[#3B1F6A] rounded-lg hover:bg-[#2e1854] disabled:opacity-60 transition-colors shadow-sm">
              {submitting
                ? <><Loader2 className="size-4 animate-spin" /> Creating…</>
                : <><AlertTriangle className="size-4" /> Create Risk</>}
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}

export default CreateRisk