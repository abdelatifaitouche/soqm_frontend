import { useState } from "react"
import { submitActionEvidence } from "@/features/findings/api/actionsApi"

export function useSubmitEvidence(actionId) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Resolves with the API response; rejects on failure so the caller can show the error.
  const submit = async (payload) => {
    setLoading(true)
    setError(null)

    try {
      return await submitActionEvidence(actionId, payload)
    } catch (err) {
      setError(err)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return { submit, loading, error }
}