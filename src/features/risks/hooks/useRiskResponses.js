import { useEffect, useState } from "react"
import { getRiskResponses } from "@/features/responses/api/responsesApi"

export function useRiskResponses(
  id,
  filters = {},
  page = 1,
  orderBy = { order_by: "created_at", direction: "DESC" }
) {
  const [responses, setResponses] = useState([])
  const [total, setTotal] = useState(0)
  const [size, setSize] = useState(10)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!id) {
      setResponses([])
      setTotal(0)
      setLoading(false)
      return
    }

    let cancelled = false

    setLoading(true)
    setError(null)

    const cleanFilters = Object.fromEntries(
      Object.entries(filters).filter(([, v]) => v !== "" && v != null)
    )

    const params = {
      ...cleanFilters,
      risk_id: id,
      page,
      order_by: orderBy.order_by,
      direction: orderBy.direction,
    }

    getRiskResponses(params)
      .then((res) => {
        if (cancelled) return

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

    return () => {
      cancelled = true
    }
  }, [id, JSON.stringify(filters), page, orderBy.order_by, orderBy.direction])

  const totalPages =
    size > 0 ? Math.max(1, Math.ceil(total / size)) : 1

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