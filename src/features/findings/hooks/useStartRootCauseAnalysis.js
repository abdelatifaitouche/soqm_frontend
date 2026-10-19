import { useState } from "react"
import { startRootCauseAnalysis } from "@/features/findings/api/findingsApi"

export function useStartRootCauseAnalysis(findingId) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const start = async (payload) => {
    setLoading(true)
    setError(null)

    try {
      return await startRootCauseAnalysis(findingId, payload)
    } catch (err) {
      setError(err)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return { start, loading, error }
}