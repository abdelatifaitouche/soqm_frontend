import { useEffect, useState } from "react"
import { getRiskResponses } from "@/api/endpoints/responsesApi"

/**
 * filters:  { status, risk_id, assigned_employee, created_by, execution_type,
 *             frequency, component_id } — all optional, matches ResponseFilters
 * orderBy:  { order_by: "created_at", direction: "ASC" | "DESC" }
 * page:     backend only reads ?page=, everything else (size, total) comes back
 *           in the response envelope
 */
export function useRiskResponses(
  id,
  filters = {},
  page = 1,
  orderBy = { order_by: "created_at", direction: "DESC" }
) {
  const [responses, setResponses] = useState([])
  const [total, setTotal] = useState(0)
  const [size, setSize]   = useState(10)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!id) return

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

    getRiskResponses(id, params)
      .then((res) => {
        if (cancelled) return
        // `res` is already the response body for this api instance.
        // Backend returns { total, page, size, items }.
        setResponses(res?.items ?? [])
        setTotal(res?.total ?? 0)
        setSize(res?.size ?? 10)
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err)
          setResponses([])
          setTotal(0)
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [id, JSON.stringify(filters), page, orderBy.order_by, orderBy.direction])

  const totalPages = size > 0 ? Math.max(1, Math.ceil(total / size)) : 1

  return {
    responses,
    setResponses,
    total,
    size,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
    loading,
    error,
  }
}