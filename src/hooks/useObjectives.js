import { useState, useEffect } from "react"
import { getObjectives } from "@/api/endpoints/objectivesApi"

export function useObjectives(page = 1, status = "", componentId = "") {
  const [items, setItems]       = useState([])
  const [total, setTotal]       = useState(0)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)

  const SIZE = 10

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    const params = {
      page,
      ...(status      && { status }),
      ...(componentId && { component_id: componentId }),
    }
    getObjectives(params)
      .then((res) => {
        if (cancelled) return
        const body = res
        setItems(body.items ?? [])
        setTotal(body.total ?? 0)
      })
      .catch((err) => { if (!cancelled) setError(err) })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [page, status, componentId])

  const totalPages = Math.ceil(total / SIZE) || 1

  return { items, total, totalPages, loading, error }
}