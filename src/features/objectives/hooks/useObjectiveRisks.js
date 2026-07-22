import { useEffect, useState } from "react"
import { getObjectiveRisks } from "@/features/objectives/api/objectivesApi"

/**
 * filters:  { score, status, component_id } — all optional, matches RiskFilters
 * orderBy:  { order_by: "score" | "created_at", direction: "ASC" | "DESC" }
 * page:     backend only reads ?page=, everything else (size, total) comes back
 *           in the response envelope
 */
export function useObjectiveRisks(
  objectiveId,
  filters = {},
  page = 1,
  orderBy = { order_by: "created_at", direction: "DESC" }
) {
  const [risks, setRisks] = useState([])
  const [total, setTotal] = useState(0)
  const [size, setSize]   = useState(10)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!objectiveId) return

    let cancelled = false
    setLoading(true)
    setError(null)

    // Drop empty/undefined filter values so we don't send e.g. status=
    // as a literal empty query param.
    const cleanFilters = Object.fromEntries(
      Object.entries(filters).filter(([, v]) => v !== "" && v != null)
    )

    const params = {
      ...cleanFilters,
      page,
      order_by: orderBy.order_by,
      direction: orderBy.direction,
    }

    getObjectiveRisks(objectiveId, params)
      .then((res) => {
        if (cancelled) return
        // `res` is already the response body for this api instance.
        // Backend returns { total, page, size, items }.
        setRisks(res?.items ?? [])
        setTotal(res?.total ?? 0)
        setSize(res?.size ?? 10)
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err)
          setRisks([])
          setTotal(0)
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [objectiveId, JSON.stringify(filters), page, orderBy.order_by, orderBy.direction])

  const totalPages = size > 0 ? Math.max(1, Math.ceil(total / size)) : 1

  return {
    risks,
    setRisks,
    total,
    size,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
    loading,
    error,
  }
}