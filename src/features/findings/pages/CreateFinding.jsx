import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, Loader2, AlertCircle, AlertTriangle, ShieldAlert } from "lucide-react"
import { useCreateFinding } from "@/features/findings/hooks/useCreateFinding"
import { useDepts } from "@/features/departments/hooks/useDept"

// ── Enums (match backend) ─────────────────────────────────────────────────────

const SOURCE_OPTIONS = [
  { value: "Gtar", label: "GTAR" },
  { value: "external_quality_review", label: "External quality review" },
  { value: "external_engagement_system_review", label: "External engagement system review" },
  { value: "internal_quality_management_system_review", label: "Internal quality management system review" },
  { value: "internal_engagement_review", label: "Internal engagement review" },
  { value: "restatements", label: "Restatements" },
  { value: "other_quality_events", label: "Other quality events" },
]

// Descriptions are guidance for the person identifying the finding.
// Align the wording with the firm's own evaluation methodology.
const SEVERITY_OPTIONS = [
  {
    value: "deficiency",
    label: "Deficiency",
    icon: AlertCircle,
    iconCls: "text-yellow-600 dark:text-yellow-400",
    hint: "A shortcoming in the system of quality management.",
  },
  {
    value: "significant_deficiency",
    label: "Significant deficiency",
    icon: AlertTriangle,
    iconCls: "text-orange-600 dark:text-orange-400",
    hint: "A deficiency that meaningfully affects the ability to achieve a quality objective.",
  },
  {
    value: "material_deficiency",
    label: "Material deficiency",
    icon: ShieldAlert,
    iconCls: "text-red-600 dark:text-red-400",
    hint: "A deficiency serious enough to call into question reasonable assurance.",
  },
]

const FIELD_CLS =
  "w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-[#7B3FBE] transition-colors disabled:opacity-60"

// FastAPI can return `detail` as a string or as a list of validation errors.
function extractError(err) {
  const detail = err?.response?.data?.detail
  if (typeof detail === "string") return detail
  if (Array.isArray(detail)) return detail.map((d) => d.msg).filter(Boolean).join(". ")
  return "Couldn’t identify this finding. Check the fields and try again."
}

function Field({ label, required, error, hint, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-1.5">
        {label}
        {required && <span className="text-muted-foreground font-normal"> *</span>}
      </label>
      {children}
      {error ? (
        <p className="text-xs text-red-600 mt-1.5">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground mt-1.5">{hint}</p>
      ) : null}
    </div>
  )
}

function CreateFinding() {
  const navigate = useNavigate()
  const { create, loading: saving } = useCreateFinding()
  const { depts, loading: deptsLoading, error: deptsError } = useDepts()

  const [form, setForm] = useState({
    description: "",
    finding_source: "",
    department: "",
    deficiency_severity: "",
  })
  const [submitted, setSubmitted] = useState(false)
  const [apiError, setApiError] = useState("")

  // The departments endpoint may return a plain array or a paginated { items } object.
  const deptList = Array.isArray(depts) ? depts : depts?.items ?? []

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const errors = {
    description: !form.description.trim() ? "Describe what was found." : "",
    finding_source: !form.finding_source ? "Select where this finding came from." : "",
    department: !form.department ? "Select the department concerned." : "",
    deficiency_severity: !form.deficiency_severity ? "Select a severity." : "",
  }
  const hasErrors = Object.values(errors).some(Boolean)
  const show = (field) => (submitted ? errors[field] : "")

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitted(true)
    setApiError("")
    if (hasErrors) return

    try {
      await create({
        description: form.description.trim(),
        finding_source: form.finding_source,
        department: form.department,
        deficiency_severity: form.deficiency_severity,
      })
      // Switch to `/findings/${result.id}` once the detail page exists.
      navigate("/findings")
    } catch (err) {
      setApiError(extractError(err))
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-16">
      <button
        onClick={() => navigate("/findings")}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="size-4" />
        Findings
      </button>

      <div>
        <h1 className="text-xl font-semibold text-foreground tracking-tight">Identify a finding</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Record an issue raised by monitoring or a review. Action plans can be added once it’s recorded.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        {/* What was found */}
        <section className="rounded-xl border border-border bg-card p-6 space-y-5">
          <h2 className="text-sm font-semibold text-foreground">What was found</h2>

          <Field
            label="Description"
            required
            error={show("description")}
            hint="Be specific: what happened, where, and what requirement or objective it relates to."
          >
            <textarea
              value={form.description}
              onChange={set("description")}
              rows={5}
              disabled={saving}
              placeholder="Describe the finding"
              className={`${FIELD_CLS} resize-y leading-relaxed ${show("description") ? "border-red-400" : ""}`}
            />
          </Field>
        </section>

        {/* Context */}
        <section className="rounded-xl border border-border bg-card p-6 space-y-5">
          <h2 className="text-sm font-semibold text-foreground">Context</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field label="Source" required error={show("finding_source")}>
              <select
                value={form.finding_source}
                onChange={set("finding_source")}
                disabled={saving}
                className={`${FIELD_CLS} cursor-pointer ${show("finding_source") ? "border-red-400" : ""}`}
              >
                <option value="">Select a source</option>
                {SOURCE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </Field>

            <Field
              label="Department"
              required
              error={show("department") || (deptsError ? "Couldn’t load departments. Refresh to try again." : "")}
            >
              <select
                value={form.department}
                onChange={set("department")}
                disabled={saving || deptsLoading || !!deptsError}
                className={`${FIELD_CLS} cursor-pointer ${show("department") ? "border-red-400" : ""}`}
              >
                <option value="">{deptsLoading ? "Loading departments…" : "Select a department"}</option>
                {deptList.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </Field>
          </div>
        </section>

        {/* Severity */}
        <section className="rounded-xl border border-border bg-card p-6">
          <fieldset disabled={saving} className="space-y-4">
            <legend className="text-sm font-semibold text-foreground mb-1">
              Severity <span className="text-muted-foreground font-normal">*</span>
            </legend>
            <p className="text-xs text-muted-foreground -mt-1">
              Your initial assessment. It can be revisited as the finding is evaluated.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {SEVERITY_OPTIONS.map((o) => {
                const selected = form.deficiency_severity === o.value
                const Icon = o.icon
                return (
                  <label
                    key={o.value}
                    className={`relative flex flex-col gap-2 rounded-lg border p-4 cursor-pointer transition-colors ${
                      selected
                        ? "border-[#3B1F6A] bg-[#EDE9F8]/50 ring-1 ring-[#3B1F6A] dark:bg-accent dark:border-[#7B3FBE] dark:ring-[#7B3FBE]"
                        : "border-border hover:bg-muted/30"
                    }`}
                  >
                    <input
                      type="radio"
                      name="deficiency_severity"
                      value={o.value}
                      checked={selected}
                      onChange={set("deficiency_severity")}
                      className="sr-only"
                    />
                    <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <Icon className={`size-4 ${o.iconCls}`} />
                      {o.label}
                    </span>
                    <span className="text-xs text-muted-foreground leading-relaxed">{o.hint}</span>
                  </label>
                )
              })}
            </div>

            {show("deficiency_severity") && (
              <p className="text-xs text-red-600">{show("deficiency_severity")}</p>
            )}
          </fieldset>
        </section>

        {apiError && (
          <div className="flex items-start gap-2 text-sm text-red-600" role="alert">
            <AlertCircle className="size-4 shrink-0 mt-0.5" />
            {apiError}
          </div>
        )}

        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => navigate("/findings")}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#3B1F6A] rounded-lg hover:bg-[#52298F] transition-colors disabled:opacity-60"
          >
            {saving && <Loader2 className="size-4 animate-spin" />}
            Identify finding
          </button>
        </div>
      </form>
    </div>
  )
}

export default CreateFinding