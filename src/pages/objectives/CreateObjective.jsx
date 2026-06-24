import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { createObjective } from "@/api/endpoints/objectivesApi"
import { useComponents } from "@/hooks/useComponents"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  ArrowLeft, Loader2, AlertCircle,
  Target, Calendar, FileText, LayoutGrid,
} from "lucide-react"

const EMPTY_FORM = {
  description:    "",
  review_date:    "",
  component_id:   "",
}

export default function CreateObjectivePage() {
  const navigate    = useNavigate()
  const { components, loading: compsLoading, error: compsError } = useComponents()
  const [form, setForm]           = useState(EMPTY_FORM)
  const [saving, setSaving]       = useState(false)
  const [formError, setFormError] = useState("")
  const [fieldErrors, setFieldErrors] = useState({})

  const set = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }))
    setFieldErrors((fe) => ({ ...fe, [field]: undefined }))
  }

  const validate = () => {
    const errors = {}
    if (!form.description.trim()) errors.description = "Objective description is required."
    if (!form.component_id)          errors.component_id   = "Please select a component."
    if (!form.review_date)           errors.review_date    = "Review date is required."
    return errors
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errors = validate()
    if (Object.keys(errors).length) { setFieldErrors(errors); return }
    setFieldErrors({})
    setFormError("")
    setSaving(true)
    try {
      await createObjective(form)
      navigate("/objectives")
    }  catch (err) {
  const msg =
    err?.response?.data?.message ??
    err?.message ??
    "Something went wrong. Please try again."
  setFormError(msg)
} finally {
      setSaving(false)
    }
  }

  const selectedComponent = components.find((c) => c.id === form.component_id)
  const sorted = [...components].sort((a, b) => a.display_order - b.display_order)

  return (
    <div className="max-w-3xl mx-auto space-y-8">

      {/* Page header */}
      <div>
        <button
          onClick={() => navigate("/objectives")}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-5"
        >
          <ArrowLeft className="size-3.5" /> Back to Objectives
        </button>
        <div className="flex items-start gap-4">
          <div className="flex size-11 items-center justify-center rounded-xl bg-[#EDE9F8] dark:bg-accent shrink-0">
            <Target className="size-5 text-[#7B3FBE]" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground tracking-tight">
              New Quality Objective
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Define a quality objective and link it to an ISQM 1 component.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Component selector card */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <div className="flex items-center gap-2.5 mb-1">
            <LayoutGrid className="size-4 text-[#7B3FBE]" />
            <h2 className="text-sm font-semibold text-foreground">ISQM Component</h2>
            <span className="text-[10px] text-red-500 font-medium">Required</span>
          </div>

          {compsLoading ? (
            <div className="flex items-center gap-2 h-10 px-3 border border-border rounded-lg text-sm text-muted-foreground bg-muted/30">
              <Loader2 className="size-3.5 animate-spin" /> Loading components…
            </div>
          ) : compsError ? (
            <div className="flex items-center gap-2 h-10 px-3 border border-destructive/40 rounded-lg text-sm text-destructive bg-red-50 dark:bg-red-950/20">
              <AlertCircle className="size-3.5" /> Failed to load components.
            </div>
          ) : (
            <select
              value={form.component_id}
              onChange={set("component_id")}
              className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-[#7B3FBE] transition-colors"
            >
              <option value="" disabled>Select a component…</option>
              {sorted.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.display_order}. {c.name}
                </option>
              ))}
            </select>
          )}

          {fieldErrors.component_id && (
            <p className="text-xs text-red-500">{fieldErrors.component_id}</p>
          )}

          {/* Selected component preview */}
          {selectedComponent && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-[#EDE9F8] dark:bg-accent border border-[#C4B0E8] dark:border-border">
              <div className="flex size-8 items-center justify-center rounded-md bg-[#3B1F6A] shrink-0">
                <Target className="size-4 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-[#1E0A3C] dark:text-foreground truncate">
                  {selectedComponent.name}
                </p>
                <p className="text-[11px] text-[#7B3FBE] dark:text-muted-foreground mt-0.5">
                  {selectedComponent.isqm_reference}
                  {selectedComponent.description && (
                    <span className="text-muted-foreground"> · {selectedComponent.description}</span>
                  )}
                </p>
              </div>
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ${
                selectedComponent.is_active
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
                  : "bg-gray-100 text-gray-500 dark:bg-muted dark:text-muted-foreground"
              }`}>
                {selectedComponent.is_active ? "Active" : "Inactive"}
              </span>
            </div>
          )}
        </div>

        {/* Objective details card */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-5">
          <div className="flex items-center gap-2.5 mb-1">
            <FileText className="size-4 text-[#7B3FBE]" />
            <h2 className="text-sm font-semibold text-foreground">Objective Details</h2>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Description
              <span className="normal-case font-normal text-muted-foreground ml-1">(optional)</span>
            </Label>
            <textarea
              value={form.description}
              onChange={set("description")}
              rows={2}
              placeholder="Additional context or notes about this objective…"
              className="w-full rounded-lg border border-input bg-background px-3.5 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-[#7B3FBE] resize-none transition-colors placeholder:text-muted-foreground"
            />
          </div>

          {/* Review date */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Review Date <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
              <Input
                type="date"
                value={form.review_date}
                onChange={set("review_date")}
                min={new Date().toISOString().split("T")[0]}
                className={`pl-9 focus-visible:ring-[#7B3FBE] ${
                  fieldErrors.review_date ? "border-red-400" : ""
                }`}
              />
            </div>
            {fieldErrors.review_date && (
              <p className="text-xs text-red-500">{fieldErrors.review_date}</p>
            )}
          </div>
        </div>

        {/* Global error */}
        {formError && (
          <div className="flex items-center gap-2.5 px-4 py-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900">
            <AlertCircle className="size-4 text-red-500 shrink-0" />
            <p className="text-sm text-red-600 dark:text-red-400">{formError}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate("/objectives")}
            className="px-5 py-2.5 text-sm rounded-lg border border-border hover:bg-muted transition-colors text-foreground"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || compsLoading}
            className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium bg-[#3B1F6A] hover:bg-[#52298F] text-white rounded-lg transition-colors disabled:opacity-60"
          >
            {saving && <Loader2 className="size-3.5 animate-spin" />}
            {saving ? "Creating…" : "Create Objective"}
          </button>
        </div>

      </form>
    </div>
  )
}