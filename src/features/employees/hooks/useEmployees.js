import { useState, useEffect, useCallback } from "react"
import { getEmployees } from "@/features/employees/api/employeesApi"

// ============================================================
// ENUMS
// Values are what the API receives as filters. Levels are stored with a space
// ("SENIOR MANAGER"), as the list payload shows.
// ============================================================

export const EMPLOYEE_STATUS = {
  ACTIVE: "ACTIVE",
  INVITED: "INVITED",
  ON_LEAVE: "ON_LEAVE",
  IN_ACTIVE: "IN_ACTIVE",
  TERMINATED: "TERMINATED",
}

export const EMPLOYEE_LEVEL = {
  INTERN: "INTERN",
  JUNIOR: "JUNIOR",
  MID: "MID",
  SENIOR: "SENIOR",
  MANAGER: "MANAGER",
  SENIOR_MANAGER: "SENIOR MANAGER",
  DIRECTOR: "DIRECTOR",
  PARTNER: "PARTNER",
}

// ============================================================
// HOOK — server-side pagination and filtering
// API returns: { page, size, total, items: [...] }
// filters: { status, level, job_title, department_id }
// ============================================================

export function useEmployees(filters = {}, page = 1, size = 10) {
  const [employees, setEmployees] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)

  const totalPages = Math.max(1, Math.ceil(total / size))

  useEffect(() => {
    let cancelled = false

    setLoading(true)
    setError(null)

    // Only send filters that have a real value
    const cleanFilters = Object.fromEntries(
      Object.entries(filters).filter(([, v]) => v !== "" && v != null)
    )

    getEmployees({ ...cleanFilters, page, size })
      .then((res) => {
        if (cancelled) return
        setEmployees(res?.items ?? [])
        setTotal(res?.total ?? 0)
      })
      .catch((err) => {
        if (cancelled) return
        setError(err)
        setEmployees([])
        setTotal(0)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [JSON.stringify(filters), page, size, reloadKey])

  const refetch = useCallback(() => setReloadKey((k) => k + 1), [])

  return {
    employees,
    setEmployees,
    total,
    totalPages,
    // Kept so existing callers using the old shape keep working
    pagination: { total, page, size, total_pages: totalPages },
    loading,
    error,
    refetch,
  }
}