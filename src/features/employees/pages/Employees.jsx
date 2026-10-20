import { useState, useMemo, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import {
  Plus, AlertCircle, X, Users, Search, RotateCcw,
  List as ListIcon, LayoutGrid,
} from "lucide-react"
import { useEmployees, EMPLOYEE_STATUS, EMPLOYEE_LEVEL } from "@/features/employees/hooks/useEmployees"
import { useDepts } from "@/features/departments/hooks/useDept"
import Pagination from "@/shared/components/Pagination"

// ── Config & helpers ──────────────────────────────────────────────────────────

const SIZE = 10

// Normalises "SENIOR MANAGER", "SENIOR_MANAGER" and "senior-manager" to one key.
const keyOf = (v) => String(v ?? "").trim().toUpperCase().replace(/[\s-]+/g, "_")

const STATUS_CONFIG = {
  ACTIVE:     { label: "Active",     dot: "bg-emerald-500", cls: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900" },
  INVITED:    { label: "Invited",    dot: "bg-blue-500",    cls: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900" },
  ON_LEAVE:   { label: "On leave",   dot: "bg-amber-500",   cls: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900" },
  IN_ACTIVE:  { label: "Inactive",   dot: "bg-slate-400",   cls: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-900/40 dark:text-slate-400 dark:border-slate-800" },
  TERMINATED: { label: "Terminated", dot: "bg-red-500",     cls: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900" },
}

function titleCase(str) {
  const s = String(str ?? "").replace(/_/g, " ").toLowerCase()
  return s.charAt(0).toUpperCase() + s.slice(1)
}

const SELECT_CLS =
  "h-9 rounded-lg border border-input bg-card px-3 text-xs text-foreground outline-none focus:ring-2 focus:ring-[#7B3FBE] transition-colors cursor-pointer disabled:opacity-50"

function useDebounced(value, delay = 350) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

// ── Small components ──────────────────────────────────────────────────────────

function StatusPill({ status }) {
  const cfg = STATUS_CONFIG[keyOf(status)]
  if (!cfg) return <span className="text-xs text-muted-foreground">{titleCase(status) || "—"}</span>
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full border whitespace-nowrap ${cfg.cls}`}>
      <span className={`size-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  )
}

function LevelChip({ level }) {
  if (!level) return <span className="text-xs text-muted-foreground">—</span>
  return (
    <span className="inline-flex text-[11px] font-medium px-2.5 py-1 rounded-md bg-muted text-foreground/80 whitespace-nowrap">
      {titleCase(level)}
    </span>
  )
}

function Avatar({ employee, size = "size-9" }) {
  const initials = `${employee.first_name?.[0] ?? ""}${employee.last_name?.[0] ?? ""}`.toUpperCase()
  return (
    <div className={`${size} flex items-center justify-center rounded-full bg-[#EDE9F8] text-[#3B1F6A] dark:bg-accent dark:text-foreground text-xs font-bold shrink-0`}>
      {initials || "?"}
    </div>
  )
}

function fullName(e) {
  return `${e.first_name ?? ""} ${e.last_name ?? ""}`.trim() || "Unnamed"
}

function ViewToggle({ view, onChange }) {
  const btn = (value, Icon, label) => (
    <button
      onClick={() => onChange(value)}
      aria-pressed={view === value}
      className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md transition-colors ${
        view === value ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      <Icon className="size-3.5" /> {label}
    </button>
  )
  return (
    <div className="flex items-center gap-1 p-1 rounded-lg border border-border bg-muted/30 shrink-0">
      {btn("table", ListIcon, "Table")}
      {btn("grid", LayoutGrid, "Cards")}
    </div>
  )
}

function SkeletonRows() {
  return Array.from({ length: 6 }).map((_, i) => (
    <tr key={i} className="border-b border-border/50 last:border-0">
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-full bg-muted animate-pulse" />
          <div className="space-y-1.5">
            <div className="h-3.5 w-32 rounded bg-muted animate-pulse" />
            <div className="h-3 w-20 rounded bg-muted animate-pulse" />
          </div>
        </div>
      </td>
      {[28, 20, 16].map((w, j) => (
        <td key={j} className="px-5 py-3.5"><div className="h-5 rounded bg-muted animate-pulse" style={{ width: `${w * 4}px` }} /></td>
      ))}
    </tr>
  ))
}

// ── Page ──────────────────────────────────────────────────────────────────────

const EMPTY_FILTERS = { status: "", level: "", department_id: "", job_title: "" }

export default function Employees() {
  const navigate = useNavigate()

  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [page, setPage] = useState(1)
  const [view, setView] = useState("table")

  // Typing in the job title box shouldn't fire a request per keystroke.
  const debouncedTitle = useDebounced(filters.job_title)
  useEffect(() => { setPage(1) }, [debouncedTitle])

  const apiFilters = useMemo(
    () => ({
      status: filters.status,
      level: filters.level,
      department_id: filters.department_id,
      job_title: debouncedTitle.trim(),
    }),
    [filters.status, filters.level, filters.department_id, debouncedTitle]
  )

  const { employees, total, totalPages, loading, error, refetch } = useEmployees(apiFilters, page, SIZE)
  const { depts, loading: deptsLoading } = useDepts()
  const deptList = Array.isArray(depts) ? depts : depts?.items ?? []

  const hasFilters = Object.values(filters).some((v) => v !== "")

  const setFilter = (key) => (e) => {
    setFilters((f) => ({ ...f, [key]: e.target.value }))
    if (key !== "job_title") setPage(1)
  }

  const clearFilters = () => {
    setFilters(EMPTY_FILTERS)
    setPage(1)
  }

  const open = (id) => navigate(`/employee/${id}`)
  const onRowKey = (e, id) => { if (e.key === "Enter") open(id) }

  const initialLoading = loading && employees.length === 0
  const refetching = loading && employees.length > 0

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold text-foreground tracking-tight">Employees</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {initialLoading
              ? "Loading…"
              : `${total} employee${total !== 1 ? "s" : ""}${hasFilters ? " match your filters" : ""}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ViewToggle view={view} onChange={setView} />
          <button
            onClick={() => navigate("/employees/create")}
            className="flex items-center gap-1.5 text-xs font-medium px-3.5 py-2 rounded-lg bg-[#3B1F6A] hover:bg-[#52298F] text-white transition-colors shrink-0"
          >
            <Plus className="size-3.5" /> Add employee
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative w-full sm:w-56">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <input
            value={filters.job_title}
            onChange={setFilter("job_title")}
            placeholder="Search job title"
            aria-label="Filter by job title"
            className="w-full h-9 rounded-lg border border-input bg-card pl-9 pr-3 text-xs text-foreground outline-none focus:ring-2 focus:ring-[#7B3FBE] transition-colors"
          />
        </div>

        <select value={filters.department_id} onChange={setFilter("department_id")} disabled={deptsLoading} aria-label="Filter by department" className={SELECT_CLS}>
          <option value="">All departments</option>
          {deptList.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>

        <select value={filters.level} onChange={setFilter("level")} aria-label="Filter by level" className={SELECT_CLS}>
          <option value="">All levels</option>
          {Object.values(EMPLOYEE_LEVEL).map((level) => (
            <option key={level} value={level}>{titleCase(level)}</option>
          ))}
        </select>

        <select value={filters.status} onChange={setFilter("status")} aria-label="Filter by status" className={SELECT_CLS}>
          <option value="">All statuses</option>
          {Object.values(EMPLOYEE_STATUS).map((status) => (
            <option key={status} value={status}>{STATUS_CONFIG[keyOf(status)]?.label ?? titleCase(status)}</option>
          ))}
        </select>

        {hasFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors ml-auto"
          >
            <X className="size-3" /> Clear filters
          </button>
        )}
      </div>

      {/* Content */}
      {error ? (
        <div className="rounded-xl border border-border bg-card flex flex-col items-center gap-3 py-16">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="size-4" />
            <span className="text-sm">{error?.response?.data?.detail ?? "Couldn’t load employees."}</span>
          </div>
          <button
            onClick={refetch}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-muted text-xs font-medium text-foreground transition-colors"
          >
            <RotateCcw className="size-3.5" /> Try again
          </button>
        </div>
      ) : !loading && employees.length === 0 ? (
        <div className="rounded-xl border border-border bg-card flex flex-col items-center gap-2 py-16">
          <div className="flex size-10 items-center justify-center rounded-xl bg-muted">
            <Users className="size-4 text-muted-foreground/40" />
          </div>
          <p className="text-sm text-muted-foreground">
            {hasFilters ? "No employees match these filters." : "No employees yet."}
          </p>
          {hasFilters && (
            <button onClick={clearFilters} className="text-xs text-[#7B3FBE] hover:underline mt-1">Clear filters</button>
          )}
        </div>
      ) : (
        <div className={`rounded-xl border border-border bg-card overflow-hidden transition-opacity ${refetching ? "opacity-60" : ""}`} aria-busy={loading}>
          {view === "table" ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px]">
                <thead>
                  <tr className="border-b border-border bg-muted/20">
                    {["Employee", "Department", "Level", "Status"].map((h) => (
                      <th key={h} className="text-left text-xs font-medium text-muted-foreground px-5 py-3 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {initialLoading ? (
                    <SkeletonRows />
                  ) : (
                    employees.map((e) => (
                      <tr
                        key={e.id}
                        tabIndex={0}
                        onClick={() => open(e.id)}
                        onKeyDown={(ev) => onRowKey(ev, e.id)}
                        className="border-b border-border/50 last:border-0 hover:bg-muted/20 focus-visible:bg-muted/20 focus-visible:outline-none transition-colors cursor-pointer"
                      >
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3 min-w-0">
                            <Avatar employee={e} />
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">{fullName(e)}</p>
                              <p className="text-xs text-muted-foreground truncate">{e.job_title || "—"}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="text-sm text-foreground/90">{e.department?.name ?? "—"}</span>
                        </td>
                        <td className="px-5 py-3.5"><LevelChip level={e.level} /></td>
                        <td className="px-5 py-3.5"><StatusPill status={e.status} /></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
              {initialLoading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-36 rounded-xl border border-border bg-muted/20 animate-pulse" />
                  ))
                : employees.map((e) => (
                    <button
                      key={e.id}
                      onClick={() => open(e.id)}
                      className="text-left rounded-xl border border-border bg-card p-4 hover:shadow-md hover:border-border/80 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7B3FBE]"
                    >
                      <div className="flex items-start gap-3">
                        <Avatar employee={e} size="size-10" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">{fullName(e)}</p>
                          <p className="text-xs text-muted-foreground truncate">{e.job_title || "—"}</p>
                        </div>
                      </div>
                      <dl className="mt-4 space-y-2 text-xs">
                        <div className="flex items-center justify-between gap-3">
                          <dt className="text-muted-foreground">Department</dt>
                          <dd className="font-medium text-foreground truncate">{e.department?.name ?? "—"}</dd>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <dt className="text-muted-foreground">Level</dt>
                          <dd><LevelChip level={e.level} /></dd>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <dt className="text-muted-foreground">Status</dt>
                          <dd><StatusPill status={e.status} /></dd>
                        </div>
                      </dl>
                    </button>
                  ))}
            </div>
          )}

          {!initialLoading && (
            <Pagination
              page={page}
              totalPages={totalPages}
              total={total}
              size={SIZE}
              onPageChange={setPage}
              loading={loading}
            />
          )}
        </div>
      )}
    </div>
  )
}