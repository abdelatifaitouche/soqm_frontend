import { useState, useEffect } from "react"
import { getRisks } from "@/api/endpoints/riskApi"

export function useRisks(
  filters = {},   // { score, status, component_id, objective_id }
  page = 1,
  size = 10,
  orderBy = { column: "created_at", direction: "desc" }
) {
  const [items, setItems]       = useState([])
  const [total, setTotal]       = useState(0)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)

  const totalPages = Math.ceil(total / size) || 1

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    // Only include filter keys that have a real value
    const cleanFilters = Object.fromEntries(
      Object.entries(filters).filter(([, v]) => v !== "" && v != null)
    )

    const params = {
      ...cleanFilters,
      page,
      size,
      column:    orderBy.column,
      direction: orderBy.direction,
    }

    getRisks(params)
      .then((res) => {
        if (cancelled) return
        // axios wraps body in res.data; backend returns { total, page, size, items }
        const body = res
        setItems(body.items ?? [])
        setTotal(body.total ?? 0)
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err)
          setItems([])
          setTotal(0)
        }
      })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [JSON.stringify(filters), page, size, orderBy.column, orderBy.direction])

  return { items, total, totalPages, loading, error }
}