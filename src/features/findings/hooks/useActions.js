import { useState, useEffect } from "react"
import { getFindingActions } from "@/features/findings/api/actionsApi"

export function useActions(findingId, page = 1, status = "") {
  const [items, setItems]     = useState([])
  const [total, setTotal]     = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  const SIZE = 10
  const totalPages = Math.ceil(total / SIZE) || 1

  useEffect(() => {
    if (!findingId) return
    let cancelled = false
    setLoading(true)
    setError(null)

    const params = {
      page,
      ...(status && { status }),
    }

    getFindingActions(findingId, params)
      .then((res) => {
        if (cancelled) return
        const body = res
        setItems(body.items ?? [])
        setTotal(body.total ?? 0)
      })
      .catch((err) => { if (!cancelled) setError(err) })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [findingId, page, status])

  return { items, total, totalPages, loading, error, setItems }
}