import { useState, useEffect, useCallback } from "react"
import { getEmployee } from "@/features/employees/api/employeesApi"

export function useEmployee(id) {
  const [employee, setEmployee] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    if (!id) return
    let cancelled = false

    setLoading(true)
    setError(null)

    getEmployee(id)
      .then((res) => { if (!cancelled) setEmployee(res) })
      .catch((err) => { if (!cancelled) setError(err) })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [id, reloadKey])

  const refetch = useCallback(() => setReloadKey((k) => k + 1), [])

  return { employee, setEmployee, loading, error, refetch }
}