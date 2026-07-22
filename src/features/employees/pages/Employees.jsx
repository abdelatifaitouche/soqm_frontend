import React, { useState } from "react"
import { useEmployees, EMPLOYEE_STATUS, EMPLOYEE_LEVEL } from "@/features/employees/hooks/useEmployees"
import {
  Loader2, AlertCircle, ChevronLeft, ChevronRight, X,
  Users, Filter, Download, RotateCcw,
} from "lucide-react"
import { useNavigate } from "react-router-dom"

// ============================================================
// CONSTANTS & HELPERS
// ============================================================

const STATUS_CONFIG = {
  ACTIVE: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-400" },
  INVITED: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", dot: "bg-blue-400" },
  ON_LEAVE: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", dot: "bg-amber-400" },
  IN_ACTIVE: { bg: "bg-slate-50", text: "text-slate-700", border: "border-slate-200", dot: "bg-slate-400" },
  TERMINATED: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", dot: "bg-red-400" },
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

// ============================================================
// COMPONENTS
// ============================================================

function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status]
  if (!config) return null

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${config.bg} ${config.border}`}>
      <span className={`size-2 rounded-full ${config.dot}`} />
      <span className={`text-xs font-semibold ${config.text}`}>
        {status.replace(/_/g, " ")}
      </span>
    </div>
  )
}

function LevelBadge({ level }) {
  const colors = LEVEL_COLORS[level]
  if (!colors) return null

  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${colors}`}>
      {level}
    </span>
  )
}

function EmployeeCard({ employee }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-slate-900">
            {employee.first_name} {employee.last_name}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">{employee.job_title}</p>
        </div>
        <StatusBadge status={employee.status} />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500">Level</span>
          <LevelBadge level={employee.level} />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500">Department</span>
          <span className="text-xs font-medium text-slate-900">{employee.department}</span>
        </div>
      </div>
    </div>
  )
}

function EmployeeTableRow({ employee }) {
  return (
    <tr className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
      <td className="px-4 py-3">
        <div>
          <p className="text-sm font-medium text-slate-900">
            {employee.first_name} {employee.last_name}
          </p>
        </div>
      </td>
      <td className="px-4 py-3">
        <p className="text-sm text-slate-600">{employee.job_title}</p>
      </td>
      <td className="px-4 py-3">
        <p className="text-sm text-slate-600">{employee.department}</p>
      </td>
      <td className="px-4 py-3">
        <LevelBadge level={employee.level} />
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={employee.status} />
      </td>
    </tr>
  )
}

function Pagination({ pagination, onPageChange, loading }) {
  const { page, total_pages } = pagination

  if (!total_pages || total_pages <= 1) return null

  return (
    <div className="flex items-center justify-center gap-3">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1 || loading}
        className="flex size-8 items-center justify-center rounded border border-slate-300 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        title="Previous page"
      >
        <ChevronLeft className="size-4" />
      </button>

      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-slate-900">
          Page {page} of {total_pages}
        </span>
      </div>

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= total_pages || loading}
        className="flex size-8 items-center justify-center rounded border border-slate-300 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        title="Next page"
      >
        <ChevronRight className="size-4" />
      </button>
    </div>
  )
}

// ============================================================
// MAIN PAGE
// ============================================================

export default function Employees() {
    const navigate = useNavigate()
  // State
  const [filters, setFilters] = useState({ status: "", level: "" })
  const [page, setPage] = useState(1)
  const [viewMode, setViewMode] = useState("table")

  // Build API params - only send filters, no limit
  const apiParams = Object.fromEntries(
    Object.entries(filters).filter(([, v]) => v !== "")
  )

  // Fetch employees
  const { employees = [], loading, error, pagination } = useEmployees(apiParams, page)

  // Handlers
  const setFilter = (key) => (e) => {
    setFilters((f) => ({ ...f, [key]: e.target.value }))
    setPage(1)
  }

  const clearFilters = () => {
    setFilters({ status: "", level: "" })
    setPage(1)
  }

  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= pagination.total_pages) {
      setPage(newPage)
      document.querySelector('[data-employees-top]')?.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const hasFilters = Object.values(filters).some(Boolean)

  // Error state with retry button
  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="flex justify-center mb-3">
            <AlertCircle className="size-8 text-red-600" />
          </div>
          <p className="font-medium text-slate-900">Failed to load employees</p>
          <p className="text-sm text-slate-500 mt-1">
            {error.message || "An error occurred while fetching employees"}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 flex items-center gap-2 mx-auto px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-sm font-medium text-slate-700 transition-colors"
          >
            <RotateCcw className="size-4" /> Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5" data-employees-top>
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Users className="size-6 text-slate-900" />
            <h1 className="text-2xl font-bold text-slate-900">Employees</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            {pagination.total || 0} total employee{pagination.total !== 1 ? "s" : ""}
            {hasFilters && " · filtered"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={()=>navigate("/employees/create")} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-sm font-medium text-slate-700 transition-colors">
            <Download className="size-4" /> Create
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="size-4 text-slate-500" />
            <span className="text-sm font-semibold text-slate-700">Filters</span>
          </div>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 transition-colors"
            >
              <X className="size-3" /> Clear all
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-2">Status</label>
            <select
              value={filters.status}
              onChange={setFilter("status")}
              disabled={loading}
              className="w-full h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#7B3FBE] transition-colors disabled:opacity-50"
            >
              <option value="">All statuses</option>
              {Object.values(EMPLOYEE_STATUS).map((status) => (
                <option key={status} value={status}>
                  {status.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-2">Level</label>
            <select
              value={filters.level}
              onChange={setFilter("level")}
              disabled={loading}
              className="w-full h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#7B3FBE] transition-colors disabled:opacity-50"
            >
              <option value="">All levels</option>
              {Object.values(EMPLOYEE_LEVEL).map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* View Mode Toggle */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setViewMode("table")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            viewMode === "table"
              ? "bg-[#3B1F6A] text-white"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          Table view
        </button>
        <button
          onClick={() => setViewMode("grid")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            viewMode === "grid"
              ? "bg-[#3B1F6A] text-white"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          Grid view
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-16 gap-2">
          <Loader2 className="size-5 animate-spin text-slate-400" />
          <span className="text-sm text-slate-600">Loading employees…</span>
        </div>
      ) : employees.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-2">
          <Users className="size-8 text-slate-300" />
          <p className="text-sm text-slate-500">
            {hasFilters ? "No employees found with these filters" : "No employees available"}
          </p>
        </div>
      ) : viewMode === "table" ? (
        // Table View
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Job Title
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Level
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {employees.map((employee) => (
                  <EmployeeTableRow key={employee.id} employee={employee} />
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.total_pages > 1 && (
            <div className="px-4 py-4 border-t border-slate-200 bg-slate-50">
              <Pagination
                pagination={pagination}
                onPageChange={handlePageChange}
                loading={loading}
              />
            </div>
          )}
        </div>
      ) : (
        // Grid View
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {employees.map((employee) => (
              <EmployeeCard key={employee.id} employee={employee} />
            ))}
          </div>

          {/* Pagination */}
          {pagination.total_pages > 1 && (
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <Pagination
                pagination={pagination}
                onPageChange={handlePageChange}
                loading={loading}
              />
            </div>
          )}
        </>
      )}
    </div>
  )
}