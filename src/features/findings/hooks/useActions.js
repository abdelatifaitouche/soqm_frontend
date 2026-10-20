import { useState, useEffect } from "react"
import { getFindingActions, deleteAction } from "@/features/findings/api/actionsApi"

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

    getFindingActions(findingId, { page, ...(status && { status }) })
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

export function useDeleteAction() {
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)

  const mutate = async (actionId) => {
    setLoading(true)
    setError(null)
    try {
      await deleteAction(actionId) // 204 No Content
    } catch (err) {
      setError(err)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return { mutate, loading, error }
}