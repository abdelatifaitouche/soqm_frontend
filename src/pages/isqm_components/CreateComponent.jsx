import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useComponents } from "@/hooks/useComponents"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  ArrowLeft, Loader2, AlertCircle,
  Target, Calendar, FileText, LayoutGrid,
} from "lucide-react"
import { createComponent } from "@/api/endpoints/componentsApi"

const EMPTY_FORM = {
  name: "",
  description:    "",
  isqm_reference:    "",
  display_order:   0,
}

export default function CreateComponent() {
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
    if (!form.name.trim()) errors.name = "ISQM Component name is required."
    if (!form.description)          errors.description   = "Please write a description."
    if (!form.isqm_reference)           errors.isqm_reference    = "ISQM reference is required"
    if (!form.display_order)           errors.display_order    = "Display Order is required"
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
      await createComponent(form)
      navigate("/components")
    } catch (err) {
  const msg =
    err?.response?.data?.message ??
    err?.message ??
    "Something went wrong. Please try again."
  setFormError(msg)
} finally {
      setSaving(false)
    }
  }



  return (
    <div className="max-w-3xl mx-auto space-y-8">

      {/* Page header */}
      <div>
        <button
          onClick={() => navigate("/components")}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-5"
        >
          <ArrowLeft className="size-3.5" /> Back to Components
        </button>
        <div className="flex items-start gap-4">
          <div className="flex size-11 items-center justify-center rounded-xl bg-[#EDE9F8] dark:bg-accent shrink-0">
            <Target className="size-5 text-[#7B3FBE]" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground tracking-tight">
              New ISQM Component
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Define a ISQM Component 
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">

          

        {/* Objective details card */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-5">
          <div className="flex items-center gap-2.5 mb-1">
            <FileText className="size-4 text-[#7B3FBE]" />
            <h2 className="text-sm font-semibold text-foreground">ISQM Component</h2>
          </div>

          {/* Objective text */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Component Name <span className="text-red-500">*</span>
            </Label>
            <textarea
              value={form.name}
              onChange={set("name")}
              rows={4}
              placeholder="1. Governance and leadership"
              className={`w-full rounded-lg border bg-background px-3.5 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-[#7B3FBE] resize-none transition-colors placeholder:text-muted-foreground ${
                fieldErrors.name ? "border-red-400" : "border-input"
              }`}
            />
            {fieldErrors.name && (
              <p className="text-xs text-red-500">{fieldErrors.objective_text}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Description
              <span className="normal-case font-normal text-muted-foreground ml-1">(required)</span>
            </Label>
            <textarea
              value={form.description}
              onChange={set("description")}
              rows={2}
              placeholder="Component Description…"
              className="w-full rounded-lg border border-input bg-background px-3.5 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-[#7B3FBE] resize-none transition-colors placeholder:text-muted-foreground"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Isqm Reference
              <span className="normal-case font-normal text-muted-foreground ml-1">(required)</span>
            </Label>
            <textarea
              value={form.isqm_reference}
              onChange={set("isqm_reference")}
              rows={2}
              placeholder="ISQM reference…"
              className="w-full rounded-lg border border-input bg-background px-3.5 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-[#7B3FBE] resize-none transition-colors placeholder:text-muted-foreground"
            />
          </div>
        
        <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Display Order
              <span className="normal-case font-normal text-muted-foreground ml-1">(required)</span>
            </Label>
            <Input
            type={Number}
              value={form.display_order}
              onChange={set("display_order")}
              rows={2}
              placeholder="Display order from 1 - 8…"
              className="w-full rounded-lg border border-input bg-background px-3.5 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-[#7B3FBE] resize-none transition-colors placeholder:text-muted-foreground"
            />
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
            onClick={() => navigate("/components")}
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