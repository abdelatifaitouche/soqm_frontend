import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useComponents } from "@/features/isqm_components/hooks/useComponents"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  ArrowLeft, Loader2, AlertCircle,
  Target, FileText, Hash, ListOrdered,
} from "lucide-react"
import { createComponent } from "@/features/isqm_components/api/componentsApi"

const EMPTY_FORM = {
  name: "",
  description: "",
  isqm_reference: "",
  display_order: "",
}

export default function CreateComponent() {
  const navigate = useNavigate()
  const { components, loading: compsLoading } = useComponents()
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState("")
  const [fieldErrors, setFieldErrors] = useState({})

  const set = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }))
    setFieldErrors((fe) => ({ ...fe, [field]: undefined }))
  }

  const validate = () => {
    const errors = {}
    if (!form.name.trim()) errors.name = "Component name is required."
    if (!form.description.trim()) errors.description = "Please write a description."
    if (!form.isqm_reference.trim()) errors.isqm_reference = "ISQM reference is required."
    // display_order can legitimately be 0, so check for an empty/invalid
    // string rather than falsiness (0 is falsy but a valid order value).
    if (form.display_order === "" || Number.isNaN(Number(form.display_order))) {
      errors.display_order = "Display order is required."
    }
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
      await createComponent({
        ...form,
        display_order: Number(form.display_order),
      })
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
    <div className="max-w mx-auto space-y-8">

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
              Define a component of the system of quality management
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="rounded-xl border border-border bg-card p-6 space-y-5">
          <div className="flex items-center gap-2.5 mb-1">
            <FileText className="size-4 text-[#7B3FBE]" />
            <h2 className="text-sm font-semibold text-foreground">ISQM Component</h2>
          </div>

          {/* Name — single line, full width */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Component Name <span className="text-red-500">*</span>
            </Label>
            <Input
              value={form.name}
              onChange={set("name")}
              placeholder="Governance and leadership"
              className={`w-full rounded-lg border bg-background px-3.5 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-[#7B3FBE] transition-colors placeholder:text-muted-foreground ${
                fieldErrors.name ? "border-red-400" : "border-input"
              }`}
            />
            {fieldErrors.name && (
              <p className="text-xs text-red-500">{fieldErrors.name}</p>
            )}
          </div>

          {/* Reference + Display order — inlined side by side, since both
              are short values that don't need their own full-width row */}
          <div className="grid grid-cols-[1fr_160px] gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                <Hash className="size-3" />
                ISQM Reference <span className="text-red-500">*</span>
              </Label>
              <Input
                value={form.isqm_reference}
                onChange={set("isqm_reference")}
                placeholder="ISQM 1.16-29"
                className={`w-full rounded-lg border bg-background px-3.5 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-[#7B3FBE] transition-colors placeholder:text-muted-foreground ${
                  fieldErrors.isqm_reference ? "border-red-400" : "border-input"
                }`}
              />
              {fieldErrors.isqm_reference && (
                <p className="text-xs text-red-500">{fieldErrors.isqm_reference}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                <ListOrdered className="size-3" />
                Order <span className="text-red-500">*</span>
              </Label>
              <Input
                type="number"
                min={1}
                max={8}
                value={form.display_order}
                onChange={set("display_order")}
                placeholder="1–8"
                className={`w-full rounded-lg border bg-background px-3.5 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-[#7B3FBE] transition-colors placeholder:text-muted-foreground ${
                  fieldErrors.display_order ? "border-red-400" : "border-input"
                }`}
              />
              {fieldErrors.display_order && (
                <p className="text-xs text-red-500">{fieldErrors.display_order}</p>
              )}
            </div>
          </div>

          {/* Description — the one field that actually benefits from a textarea */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Description <span className="text-red-500">*</span>
            </Label>
            <textarea
              value={form.description}
              onChange={set("description")}
              rows={4}
              placeholder="What this component covers and why it matters…"
              className={`w-full rounded-lg border bg-background px-3.5 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-[#7B3FBE] resize-none transition-colors placeholder:text-muted-foreground ${
                fieldErrors.description ? "border-red-400" : "border-input"
              }`}
            />
            {fieldErrors.description && (
              <p className="text-xs text-red-500">{fieldErrors.description}</p>
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
            {saving ? "Creating…" : "Create Component"}
          </button>
        </div>

      </form>
    </div>
  )
}