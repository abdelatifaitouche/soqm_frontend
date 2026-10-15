import { useState, useEffect } from "react"
import { getFindingById } from "@/features/findings/api/findingsApi"

export function useFinding(findingId) {
  const [finding, setFinding] = useState(null)
  const [loading, setLoading] = useState(Boolean(findingId))
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!findingId) {
      setFinding(null)
      setLoading(false)
      setError(null)
      return
    }

    let cancelled = false

    setLoading(true)
    setError(null)

    getFindingById(findingId)
      .then((res) => {
        if (cancelled) return
        setFinding(res)
      })
      .catch((err) => {
        if (cancelled) return
        setError(err)
        setFinding(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [findingId])

  return { finding, loading, error }
}