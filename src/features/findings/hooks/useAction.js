import { useState, useEffect } from "react"
import { getActionDetails } from "@/features/findings/api/actionsApi"

export function useAction(actionId) {
  const [action, setAction]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  useEffect(() => {
    if (!actionId) return
    let cancelled = false
    setLoading(true)
    setError(null)

    getActionDetails(actionId)
      .then((res) => {
        if (cancelled) return
        setAction(res.data ?? res)
      })
      .catch((err) => { if (!cancelled) setError(err) })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [actionId])

  return { action, setAction, loading, error }
}