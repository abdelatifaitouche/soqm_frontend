import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useUserOptions } from "@/hooks/useUserOptions"
import { useComponentsOptions } from "@/hooks/useComponentsOptions"
import { createEmployee } from "@/api/endpoints/employeesApi"
import {
  AlertTriangle,
  Loader2,
  CheckCircle2,
  XCircle,
  User,
  Mail,
  Briefcase,
  DollarSign,
  Users,
} from "lucide-react"
import { useDepts } from "@/hooks/useDept"

// ============================================================
// CONSTANTS & VALIDATION
// ============================================================

const EMPLOYEE_LEVEL = {
  INTERN: "INTERN",
  JUNIOR: "JUNIOR",
  MID: "MID",
  SENIOR: "SENIOR",
  MANAGER: "MANAGER",
  SENIOR_MANAGER: "SENIOR_MANAGER",
  DIRECTOR: "DIRECTOR",
  PARTNER: "PARTNER",
}

const LEVEL_COLORS = {
  INTERN: "bg-purple-100 text-purple-700",
  JUNIOR: "bg-blue-100 text-blue-700",
  MID: "bg-cyan-100 text-cyan-700",
  SENIOR: "bg-emerald-100 text-emerald-700",
  MANAGER: "bg-orange-100 text-orange-700",
  SENIOR_MANAGER: "bg-red-100 text-red-700",
  DIRECTOR: "bg-indigo-100 text-indigo-700",
  PARTNER: "bg-rose-100 text-rose-700",
}

// Zod validation schema
const createEmployeeSchema = z.object({
  first_name: z
    .string()
    .min(2, "First name must be at least 2 characters")
    .max(50, "First name must be less than 50 characters"),
  last_name: z
    .string()
    .min(2, "Last name must be at least 2 characters")
    .max(50, "Last name must be less than 50 characters"),
  department_id: z.string().uuid("Invalid department"),
  job_title: z
    .string()
    .min(2, "Job title must be at least 2 characters")
    .max(100, "Job title must be less than 100 characters"),
  level: z
    .enum(Object.values(EMPLOYEE_LEVEL))
    .refine((val) => Object.values(EMPLOYEE_LEVEL).includes(val), {
      message: "Invalid employee level",
    }),
  user_id: z.string().uuid("Invalid user").optional().nullable(),
})

// ============================================================
// COMPONENTS
// ============================================================

function Label({ children, required }) {
  return (
    <label className="block text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-2">
      {children}
      {required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
  )
}

function FieldError({ msg }) {
  if (!msg) return null
  return (
    <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
      <XCircle className="size-3" />
      {msg}
    </p>
  )
}

function SelectField({
  icon: Icon,
  placeholder,
  value,
  onChange,
  options,
  loading,
  error,
  disabled,
}) {
  return (
    <div className="relative">
      <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
        {loading ? (
          <Loader2 className="size-3.5 text-slate-400 animate-spin" />
        ) : (
          <Icon className="size-3.5 text-slate-400" />
        )}
      </div>
      <select
        value={value}
        onChange={onChange}
        disabled={loading || disabled}
        className={`w-full appearance-none pl-9 pr-3 py-2.5 text-sm border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#3B1F6A]/20 focus:border-[#3B1F6A]/50 transition-all
          ${error ? "border-red-300" : "border-slate-200"}
          ${loading || disabled ? "opacity-50 cursor-not-allowed bg-slate-50" : "cursor-pointer"}
          ${!value ? "text-slate-400" : "text-slate-800"}`}
      >
        <option value="">{loading ? "Loading…" : placeholder}</option>
        {options?.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  )
}

// ============================================================
// MAIN PAGE
// ============================================================

export default function CreateEmployee() {
  const navigate = useNavigate()

  // Hooks
  const { user_options, loading: loadingUsers, error: userError } = useUserOptions()
  const { depts: departmentOptions, loading: loadingDepartments } =
    useDepts()

  // Form
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
  } = useForm({
    resolver: zodResolver(createEmployeeSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      department_id: "",
      job_title: "",
      level: "JUNIOR",
      user_id: undefined,
    },
  })

  // State
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [apiError, setApiError] = useState(null)

  // Watch form values
  const levelValue = watch("level")

  // Handle submit
  const onSubmit = async (data) => {
    setSubmitting(true)
    setApiError(null)

    try {
      // Build payload - only include user_id if provided
      const payload = {
        first_name: data.first_name,
        last_name: data.last_name,
        department_id: data.department_id,
        job_title: data.job_title,
        level: data.level,
      }

      // Add optional user_id if provided
      if (data.user_id) {
        
        payload.user_id = data.user_id
    }

      await createEmployee(payload)
      setSuccess(true)
      setTimeout(() => navigate(-1), 1800)
    } catch (err) {
      setApiError(
        err?.response?.data?.detail || err?.message || "Failed to create employee"
      )
    } finally {
      setSubmitting(false)
    }
  }

  // Map options
  const userOptionsMapped =
    user_options?.map((u) => ({
      id: u.id,
      label: u.email,
    })) || []

  const departmentsMapped =
    departmentOptions?.map((d) => ({
      id: d.id,
      label: d.name,
    })) || []

  // Success state
  if (success) {
    return (
      <div className="min-h-screen bg-slate-50/60 flex items-center justify-center p-6">
        <div className="bg-white border border-emerald-200 rounded-2xl px-10 py-12 flex flex-col items-center gap-3 shadow-sm max-w-sm w-full text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-emerald-50 border border-emerald-200">
            <CheckCircle2 className="size-7 text-emerald-600" />
          </div>
          <p className="text-base font-bold text-slate-800">Employee created!</p>
          <p className="text-sm text-slate-500">Redirecting you back…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-slate-50/60 flex flex-col min-h-screen py-6">
      <div className="max-w-2xl w-full flex flex-col gap-5 flex-1 px-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-xl bg-[#3B1F6A] shadow-sm">
            <User className="size-4 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Create Employee
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Add a new employee to your organization
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col gap-5">
          {/* Personal Information Card */}
          <div className="bg-white border border-slate-200 rounded-xl px-5 py-4 space-y-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
              Personal Information
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label required>First Name</Label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="e.g., Abdelatif"
                    disabled={submitting}
                    {...register("first_name")}
                    className={`w-full pl-9 pr-3 py-2.5 text-sm border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#3B1F6A]/20 focus:border-[#3B1F6A]/50 transition-all ${
                      errors.first_name ? "border-red-300" : "border-slate-200"
                    }`}
                  />
                </div>
                <FieldError msg={errors.first_name?.message} />
              </div>

              <div>
                <Label required>Last Name</Label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="e.g., Aitouche"
                    disabled={submitting}
                    {...register("last_name")}
                    className={`w-full pl-9 pr-3 py-2.5 text-sm border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#3B1F6A]/20 focus:border-[#3B1F6A]/50 transition-all ${
                      errors.last_name ? "border-red-300" : "border-slate-200"
                    }`}
                  />
                </div>
                <FieldError msg={errors.last_name?.message} />
              </div>
            </div>
          </div>

          {/* Job Information Card */}
          <div className="bg-white border border-slate-200 rounded-xl px-5 py-4 space-y-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
              Job Information
            </p>

            <div>
              <Label required>Department</Label>
              <SelectField
                icon={Briefcase}
                placeholder="Select a department…"
                value={watch("department_id")}
                onChange={(e) => {
                  const event = {
                    target: { name: "department_id", value: e.target.value },
                  }
                  register("department_id").onChange(event)
                }}
                options={departmentsMapped}
                loading={loadingDepartments}
                error={errors.department_id}
              />
              <FieldError msg={errors.department_id?.message} />
            </div>

            <div>
              <Label required>Job Title</Label>
              <div className="relative">
                <Briefcase className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="e.g., Consultant, Developer, Manager"
                  disabled={submitting}
                  {...register("job_title")}
                  className={`w-full pl-9 pr-3 py-2.5 text-sm border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#3B1F6A]/20 focus:border-[#3B1F6A]/50 transition-all ${
                    errors.job_title ? "border-red-300" : "border-slate-200"
                  }`}
                />
              </div>
              <FieldError msg={errors.job_title?.message} />
            </div>

            <div>
              <Label required>Level</Label>
              <select
                {...register("level")}
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#3B1F6A]/20 focus:border-[#3B1F6A]/50 transition-all"
              >
                {Object.values(EMPLOYEE_LEVEL).map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
              <FieldError msg={errors.level?.message} />

              {/* Level preview */}
              {levelValue && (
                <div className="mt-2">
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-lg inline-block ${
                      LEVEL_COLORS[levelValue]
                    }`}
                  >
                    {levelValue}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* User Account Card (Optional) */}
          <div className="bg-white border border-slate-200 rounded-xl px-5 py-4 space-y-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
              User Account{" "}
              <span className="text-slate-300">(Optional)</span>
            </p>

            <div>
              <Label>Link User Account</Label>
              <SelectField
                icon={Mail}
                placeholder="Select a user account (optional)…"
                value={watch("user_id") || ""}
                onChange={(e) => {
                  const event = {
                    target: { name: "user_id", value: e.target.value || undefined,},
                  }
                  register("user_id").onChange(event)
                }}
                options={userOptionsMapped}
                loading={loadingUsers}
                error={errors.user_id}
                disabled={false}
              />
              <p className="text-xs text-slate-500 mt-2">
                💡 You can link a user account later if you don't have one
                selected now.
              </p>
            </div>
          </div>

          {/* API Error */}
          {apiError && (
            <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <XCircle className="size-4 text-red-500 shrink-0 mt-0.5" />
              <p className="text-xs text-red-600">{apiError}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:border-slate-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-[#3B1F6A] rounded-lg hover:bg-[#2e1854] disabled:opacity-60 transition-colors shadow-sm"
            >
              {submitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Creating…
                </>
              ) : (
                <>
                  <User className="size-4" /> Create Employee
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}