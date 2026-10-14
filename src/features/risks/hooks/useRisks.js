import { useState, useEffect } from "react"
import { getRisks } from "@/features/risks/api/riskApi"

export function useRisks(
  filters = {},   // { score, status, component_id, objective_id }
  page = 1,
  size = 10,
  // Backend now takes a `columns` list (multi-column ordering) instead of a
  // single `column`. For risks specifically, the default order is by
  // sequence_number then component_order, not created_at.
  orderBy = { columns: ["sequence_number", "component_order"], direction: "desc" }
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
      columns:   orderBy.columns,
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
    // JSON.stringify the columns array — a new array literal every render
    // (e.g. an inline default) would otherwise retrigger the effect forever.
  }, [JSON.stringify(filters), page, size, JSON.stringify(orderBy.columns), orderBy.direction])

  return { items, total, totalPages, loading, error }
}