import { useState, useEffect } from "react"
import { getFindings } from "@/features/findings/api/findingsApi"

export function useFindings(
  filters = {}, // { status, finding_source, deficiency_severity }
  page = 1,
  size = 10,
  orderBy = { columns: ["created_at"], direction: "desc" }
) {
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const totalPages = Math.ceil(total / size) || 1

  useEffect(() => {
    let cancelled = false

    setLoading(true)
    setError(null)

    // Only include filters that have a real value
    const cleanFilters = Object.fromEntries(
      Object.entries(filters).filter(([, v]) => v !== "" && v != null)
    )

    const params = {
      ...cleanFilters,
      page,
      size,
      columns: orderBy.columns,
      direction: orderBy.direction,
    }

    getFindings(params)
      .then((res) => {
        if (cancelled) return

        // Assumes the API interceptor returns the response body directly
        setItems(res.items ?? [])
        setTotal(res.total ?? 0)
      })
      .catch((err) => {
        if (cancelled) return

        setError(err)
        setItems([])
        setTotal(0)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [
    JSON.stringify(filters),
    page,
    size,
    JSON.stringify(orderBy.columns),
    orderBy.direction,
  ])

  return { items, total, totalPages, loading, error }
}