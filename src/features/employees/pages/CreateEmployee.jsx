import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react"
import { createEmployee } from "@/features/employees/api/employeesApi"
import { EMPLOYEE_LEVEL } from "@/features/employees/hooks/useEmployees"
import { useDepts } from "@/features/departments/hooks/useDept"

// ── Validation ────────────────────────────────────────────────────────────────
// Levels come from the shared enum in useEmployees, so the form, the list
// filters and the API all use the same values.

const LEVEL_VALUES = Object.values(EMPLOYEE_LEVEL)

const createEmployeeSchema = z.object({
  first_name: z
    .string()
    .trim()
    .min(2, "First name must be at least 2 characters")
    .max(50, "First name must be 50 characters or fewer"),
  last_name: z
    .string()
    .trim()
    .min(2, "Last name must be at least 2 characters")
    .max(50, "Last name must be 50 characters or fewer"),
  department_id: z
    .string()
    .min(1, "Select a department")
    .uuid("Select a valid department"),
  job_title: z
    .string()
    .trim()
    .min(2, "Job title must be at least 2 characters")
    .max(100, "Job title must be 100 characters or fewer"),
  level: z.string().refine((v) => LEVEL_VALUES.includes(v), "Select a level"),
})

// ── Helpers ───────────────────────────────────────────────────────────────────

function titleCase(str) {
  const s = String(str ?? "").replace(/_/g, " ").toLowerCase()
  return s.charAt(0).toUpperCase() + s.slice(1)
}

// FastAPI can return `detail` as a string or as a list of validation errors.
function extractError(err) {
  const detail = err?.response?.data?.detail
  if (typeof detail === "string") return detail
  if (Array.isArray(detail)) return detail.map((d) => d.msg).filter(Boolean).join(". ")
  return err?.message || "Couldn’t create the employee. Try again."
}

const FIELD_CLS =
  "w-full rounded-lg border bg-card px-3 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-[#7B3FBE] transition-colors disabled:opacity-60"

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

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CreateEmployee() {
  const navigate = useNavigate()
  const { depts, loading: deptsLoading, error: deptsError } = useDepts()
  const deptList = Array.isArray(depts) ? depts : depts?.items ?? []

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(createEmployeeSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      department_id: "",
      job_title: "",
      level: "",
    },
  })

  const [apiError, setApiError] = useState("")

  const onSubmit = async (data) => {
    setApiError("")
    try {
      // createEmployee already shows a success toast through the API layer.
      await createEmployee({
        first_name: data.first_name,
        last_name: data.last_name,
        department_id: data.department_id,
        job_title: data.job_title,
        level: data.level,
      })
      navigate("/employees")
    } catch (err) {
      setApiError(extractError(err))
    }
  }

  const border = (field) => (errors[field] ? "border-red-400" : "border-input")

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-16">
      <button
        onClick={() => navigate("/employees")}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="size-4" />
        Employees
      </button>

      <div>
        <h1 className="text-xl font-semibold text-foreground tracking-tight">Add employee</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Add a new employee to your organization.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
        {/* Personal information */}
        <section className="rounded-xl border border-border bg-card p-6 space-y-5">
          <h2 className="text-sm font-semibold text-foreground">Personal information</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field label="First name" required error={errors.first_name?.message}>
              <input
                type="text"
                autoComplete="given-name"
                autoFocus
                disabled={isSubmitting}
                placeholder="e.g. Amine"
                {...register("first_name")}
                className={`${FIELD_CLS} ${border("first_name")}`}
              />
            </Field>

            <Field label="Last name" required error={errors.last_name?.message}>
              <input
                type="text"
                autoComplete="family-name"
                disabled={isSubmitting}
                placeholder="e.g. Lacamora"
                {...register("last_name")}
                className={`${FIELD_CLS} ${border("last_name")}`}
              />
            </Field>
          </div>
        </section>

        {/* Job information */}
        <section className="rounded-xl border border-border bg-card p-6 space-y-5">
          <h2 className="text-sm font-semibold text-foreground">Job information</h2>

          <Field
            label="Department"
            required
            error={errors.department_id?.message || (deptsError ? "Couldn’t load departments. Refresh to try again." : "")}
          >
            <select
              disabled={isSubmitting || deptsLoading || !!deptsError}
              {...register("department_id")}
              className={`${FIELD_CLS} cursor-pointer ${border("department_id")}`}
            >
              <option value="">{deptsLoading ? "Loading departments…" : "Select a department"}</option>
              {deptList.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field label="Job title" required error={errors.job_title?.message}>
              <input
                type="text"
                disabled={isSubmitting}
                placeholder="e.g. Quality"
                {...register("job_title")}
                className={`${FIELD_CLS} ${border("job_title")}`}
              />
            </Field>

            <Field label="Level" required error={errors.level?.message}>
              <select
                disabled={isSubmitting}
                {...register("level")}
                className={`${FIELD_CLS} cursor-pointer ${border("level")}`}
              >
                <option value="">Select a level</option>
                {LEVEL_VALUES.map((level) => (
                  <option key={level} value={level}>{titleCase(level)}</option>
                ))}
              </select>
            </Field>
          </div>
        </section>

        {apiError && (
          <div role="alert" className="flex items-start gap-2 text-sm text-red-600">
            <AlertCircle className="size-4 shrink-0 mt-0.5" />
            {apiError}
          </div>
        )}

        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => navigate("/employees")}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#3B1F6A] rounded-lg hover:bg-[#52298F] transition-colors disabled:opacity-60"
          >
            {isSubmitting && <Loader2 className="size-4 animate-spin" />}
            Add employee
          </button>
        </div>
      </form>
    </div>
  )
}