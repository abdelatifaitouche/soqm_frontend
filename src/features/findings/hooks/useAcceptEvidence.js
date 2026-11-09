import { useState } from "react"
import { acceptActionEvidence } from "@/features/findings/api/actionsApi"

// Resolves with the API response; rejects on failure so the caller can show the error.
export function useAcceptEvidence(actionId) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const accept = async (evidenceId) => {
    setLoading(true)
    setError(null)

    try {
      return await acceptActionEvidence(actionId, evidenceId)
    } catch (err) {
      setError(err)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return { accept, loading, error }
}