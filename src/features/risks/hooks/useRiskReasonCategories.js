import { useState, useEffect, useCallback } from "react"
import { fetchRiskReasonCategories } from "@/features/risks/api/riskApi"

// The reason categories rarely change, so fetch them once per page load and
// share them between every component that uses the hook.
let cache = null

export function useRiskReasonCategories() {
  const [categories, setCategories] = useState(cache ?? [])
  const [loading, setLoading] = useState(!cache)
  const [error, setError] = useState(null)

  const load = useCallback(async ({ force = false } = {}) => {
    if (cache && !force) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetchRiskReasonCategories()
      cache = Array.isArray(res) ? res : res?.items ?? []
      setCategories(cache)
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const refetch = useCallback(() => load({ force: true }), [load])

  return { categories, loading, error, refetch }
}