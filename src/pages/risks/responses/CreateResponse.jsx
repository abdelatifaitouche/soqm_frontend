import React, { useState, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useComponentsOptions } from "@/hooks/useComponentsOptions"
import { useRiskOptions } from "@/hooks/useRiskOptions"
import { useEmployeeOptions } from "@/hooks/useEmployeeOptions"
import { createResponse } from "@/api/endpoints/responsesApi"
import {
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Shield,
  AlertTriangle,
  Users,
} from "lucide-react"

// ============================================================
// CONSTANTS & VALIDATION
// ============================================================

const RESPONSE_TYPE = {
  DETECTIVE: "DETECTIVE",
  PREVENTIVE: "PREVENTIVE",
  CORRECTIVE: "CORRECTIVE",
  MITIGATING: "MITIGATING",
}

const RESPONSE_TYPE_COLORS = {
  DETECTIVE: "bg-blue-100 text-blue-700",
  PREVENTIVE: "bg-green-100 text-green-700",
  CORRECTIVE: "bg-orange-100 text-orange-700",
  MITIGATING: "bg-purple-100 text-purple-700",
}

const createResponseSchema = z.object({
  component_id: z.string().uuid("Invalid component"),
  risks: z
    .array(z.string().uuid())
    .min(1, "Select at least one risk"),
  response_name: z
    .string()
    .min(3, "Name must be at least 3 characters")
    .max(200, "Name must be less than 200 characters"),
  response_description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(1000, "Description must be less than 1000 characters"),
  response_type: z.enum(Object.values(RESPONSE_TYPE)),
  response_employee: z.string().uuid("Invalid employee"),
  evidence_notes: z
    .string()
    .min(5, "Evidence notes must be at least 5 characters")
    .max(500, "Evidence notes must be less than 500 characters"),
})

// ============================================================
// COMPONENTS
// ============================================================

function Label({ children, required }) {
  return (
    <label className="block text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-1.5">
      {children}
      {required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
  )
}

function FieldError({ msg }) {
  if (!msg) return null
  return (
    <p className="mt-0.5 text-xs text-red-500 flex items-center gap-1">
      <XCircle className="size-3" />
      {msg}
    </p>
  )
}

function RiskCheckbox({ risk, checked, onChange }) {
  return (
    <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="size-4 rounded border-slate-300"
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-900 truncate">
          {risk.risk_ref}
        </p>
        <p className="text-xs text-slate-500 truncate">
          {risk.description}
        </p>
      </div>
    </label>
  )
}

function EmployeeOption({ employee, isSelected }) {
  return (
    <div
      className={`p-3 rounded-lg border-2 transition-all cursor-pointer ${
        isSelected
          ? "border-[#3B1F6A] bg-[#3B1F6A]/5"
          : "border-slate-200 hover:border-slate-300"
      }`}
    >
      <p className="font-medium text-slate-900">
        {employee.first_name} {employee.last_name}
      </p>
      <p className="text-xs text-slate-500 mt-0.5">{employee.id}</p>
    </div>
  )
}

// ============================================================
// MAIN PAGE
// ============================================================

export default function CreateResponse() {
  const navigate = useNavigate()

  // Hooks
  const { options: components, loading: loadingComponents } =
    useComponentsOptions()
  const { employee_options, employee_loading: loadingEmployees } =
    useEmployeeOptions()

  // Form
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm({
    resolver: zodResolver(createResponseSchema),
    defaultValues: {
      component_id: "",
      risks: [],
      response_name: "",
      response_description: "",
      response_type: "DETECTIVE",
      response_employee: "",
      evidence_notes: "",
    },
  })

  // Watch values
  const componentId = watch("component_id")
  const selectedRisks = watch("risks")
  const selectedEmployee = watch("response_employee")
  const responseType = watch("response_type")

  // Get filtered risks based on selected component
  const { risk_options, risk_loading } = useRiskOptions(
    componentId ? { component_id: componentId } : {}
  )

  // State
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [apiError, setApiError] = useState(null)
  const [expandedRisks, setExpandedRisks] = useState(false)

  // Handle risk checkbox
  const handleRiskToggle = (riskId) => {
    const current = selectedRisks || []
    const updated = current.includes(riskId)
      ? current.filter((id) => id !== riskId)
      : [...current, riskId]
    setValue("risks", updated)
  }

  // Get selected risk objects for display
  const selectedRiskObjects = useMemo(() => {
    if (!risk_options || !selectedRisks) return []
    return risk_options.filter((r) => selectedRisks.includes(r.id))
  }, [risk_options, selectedRisks])

  // Get selected employee
  const selectedEmployeeObj = useMemo(() => {
    if (!employee_options || !selectedEmployee) return null
    return employee_options.find((e) => e.id === selectedEmployee)
  }, [employee_options, selectedEmployee])

  // Handle submit
  const onSubmit = async (data) => {
    setSubmitting(true)
    setApiError(null)

    try {
      await createResponse({
        risks: data.risks,
        component_id: data.component_id,
        response_name: data.response_name,
        response_description: data.response_description,
        response_type: data.response_type,
        response_employee: data.response_employee,
        evidence_notes: data.evidence_notes,
      })
      setSuccess(true)
      setTimeout(() => navigate(-1), 1800)
    } catch (err) {
      setApiError(
        err?.response?.data?.detail || err?.message || "Failed to create response"
      )
    } finally {
      setSubmitting(false)
    }
  }

  // Success state
  if (success) {
    return (
      <div className="fixed inset-0 bg-black/20 flex items-center justify-center p-4 z-50">
        <div className="bg-white border border-emerald-200 rounded-2xl px-8 py-10 flex flex-col items-center gap-3 shadow-lg max-w-sm w-full text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-emerald-50 border border-emerald-200">
            <CheckCircle2 className="size-7 text-emerald-600" />
          </div>
          <p className="text-base font-bold text-slate-800">Response created!</p>
          <p className="text-sm text-slate-500">Redirecting you back…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50/60 p-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex size-10 items-center justify-center rounded-xl bg-[#3B1F6A] shadow-sm">
            <Shield className="size-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Create Response</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Define your risk response strategy
            </p>
          </div>
        </div>

        {/* Form Container */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Step 1: Select Component */}
            <div className="pb-4 border-b border-slate-200">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">
                Step 1: Select Component
              </h2>
              <div>
                <Label required>Component</Label>
                <select
                  {...register("component_id")}
                  disabled={submitting}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#3B1F6A]/20 focus:border-[#3B1F6A]/50 transition-all"
                >
                  <option value="">Select a component…</option>
                  {components?.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <FieldError msg={errors.component_id?.message} />
              </div>
            </div>

            {/* Step 2: Select Risks */}
            {componentId && (
              <div className="pb-4 border-b border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                    Step 2: Select Risks (Min 1)
                  </h2>
                  {selectedRisks?.length > 0 && (
                    <span className="text-xs font-medium text-[#3B1F6A]">
                      {selectedRisks.length} selected
                    </span>
                  )}
                </div>

                {risk_loading ? (
                  <div className="flex items-center gap-2 py-8">
                    <Loader2 className="size-4 animate-spin" />
                    <span className="text-sm text-slate-500">Loading risks…</span>
                  </div>
                ) : risk_options?.length === 0 ? (
                  <div className="py-8 text-center">
                    <AlertTriangle className="size-8 text-amber-400 mx-auto mb-2" />
                    <p className="text-sm text-slate-500">No risks found for this component</p>
                  </div>
                ) : (
                  <>
                    {/* Risk Selection */}
                    <div className="space-y-2 max-h-48 overflow-y-auto mb-3 p-3 border border-slate-200 rounded-lg bg-slate-50">
                      {risk_options?.map((risk) => (
                        <RiskCheckbox
                          key={risk.id}
                          risk={risk}
                          checked={selectedRisks?.includes(risk.id) || false}
                          onChange={() => handleRiskToggle(risk.id)}
                        />
                      ))}
                    </div>

                    {/* Selected Risks Display */}
                    {selectedRiskObjects.length > 0 && (
                      <div className="p-3 bg-[#3B1F6A]/5 border border-[#3B1F6A]/20 rounded-lg">
                        <p className="text-xs font-medium text-slate-600 mb-2">
                          Selected Risks:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {selectedRiskObjects.map((risk) => (
                            <span
                              key={risk.id}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs font-medium text-slate-700"
                            >
                              {risk.risk_ref}
                              <button
                                type="button"
                                onClick={() => handleRiskToggle(risk.id)}
                                className="hover:text-red-600"
                              >
                                ✕
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <FieldError msg={errors.risks?.message} />
                  </>
                )}
              </div>
            )}

            {/* Step 3: Response Details */}
            {componentId && selectedRisks?.length > 0 && (
              <div className="pb-4 border-b border-slate-200">
                <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">
                  Step 3: Response Details
                </h2>

                <div className="grid grid-cols-2 gap-3">
                  {/* Response Name */}
                  <div>
                    <Label required>Response Name</Label>
                    <input
                      type="text"
                      placeholder="e.g., Implement security training"
                      disabled={submitting}
                      {...register("response_name")}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#3B1F6A]/20 focus:border-[#3B1F6A]/50 transition-all"
                    />
                    <FieldError msg={errors.response_name?.message} />
                  </div>

                  {/* Response Type */}
                  <div>
                    <Label required>Type</Label>
                    <select
                      {...register("response_type")}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#3B1F6A]/20 focus:border-[#3B1F6A]/50 transition-all"
                    >
                      {Object.values(RESPONSE_TYPE).map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                    <FieldError msg={errors.response_type?.message} />
                  </div>

                  {/* Type Preview */}
                  {responseType && (
                    <div className="col-span-2">
                      <span
                        className={`text-xs font-semibold px-2.5 py-1 rounded-lg inline-block ${
                          RESPONSE_TYPE_COLORS[responseType]
                        }`}
                      >
                        {responseType}
                      </span>
                    </div>
                  )}

                  {/* Description */}
                  <div className="col-span-2">
                    <Label required>Description</Label>
                    <textarea
                      placeholder="Detailed description of the response…"
                      disabled={submitting}
                      {...register("response_description")}
                      rows="2"
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#3B1F6A]/20 focus:border-[#3B1F6A]/50 transition-all resize-none"
                    />
                    <FieldError msg={errors.response_description?.message} />
                  </div>

                  {/* Evidence Notes */}
                  <div className="col-span-2">
                    <Label required>Evidence Notes</Label>
                    <textarea
                      placeholder="Evidence supporting this response…"
                      disabled={submitting}
                      {...register("evidence_notes")}
                      rows="2"
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#3B1F6A]/20 focus:border-[#3B1F6A]/50 transition-all resize-none"
                    />
                    <FieldError msg={errors.evidence_notes?.message} />
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Assign Employee */}
            {componentId && selectedRisks?.length > 0 && (
              <div className="pb-4 border-b border-slate-200">
                <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">
                  Step 4: Assign Responsible Employee
                </h2>

                {loadingEmployees ? (
                  <div className="flex items-center gap-2 py-8">
                    <Loader2 className="size-4 animate-spin" />
                    <span className="text-sm text-slate-500">Loading employees…</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-2 border border-slate-200 rounded-lg bg-slate-50">
                    {employee_options?.map((emp) => (
                      <div
                        key={emp.id}
                        onClick={() => setValue("response_employee", emp.id)}
                        className="cursor-pointer"
                      >
                        <EmployeeOption
                          employee={emp}
                          isSelected={selectedEmployee === emp.id}
                        />
                      </div>
                    ))}
                  </div>
                )}

                {selectedEmployeeObj && (
                  <div className="mt-3 p-3 bg-[#3B1F6A]/5 border border-[#3B1F6A]/20 rounded-lg flex items-center gap-2">
                    <Users className="size-4 text-[#3B1F6A]" />
                    <div>
                      <p className="text-xs font-medium text-slate-900">
                        {selectedEmployeeObj.first_name} {selectedEmployeeObj.last_name}
                      </p>
                      <p className="text-xs text-slate-500">Assigned to this response</p>
                    </div>
                  </div>
                )}

                <FieldError msg={errors.response_employee?.message} />
              </div>
            )}

            {/* API Error */}
            {apiError && (
              <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
                <XCircle className="size-4 text-red-500 shrink-0 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-red-600">{apiError}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-3 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:border-slate-300 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={
                  submitting ||
                  !componentId ||
                  !selectedRisks?.length ||
                  !selectedEmployee
                }
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#3B1F6A] rounded-lg hover:bg-[#2e1854] disabled:opacity-60 transition-colors shadow-sm"
              >
                {submitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Creating…
                  </>
                ) : (
                  <>
                    <Shield className="size-4" />
                    Create Response
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}