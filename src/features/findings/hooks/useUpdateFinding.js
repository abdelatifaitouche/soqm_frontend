import { useState } from "react"
import { updateFinding } from "@/features/findings/api/findingsApi"

// The endpoint returns 204 No Content, so there is nothing to read back:
// callers apply the changes they sent.
export function useUpdateFinding(findingId) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const update = async (payload) => {
    setLoading(true)
    setError(null)

    try {
      await updateFinding(findingId, payload)
    } catch (err) {
      setError(err)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return { update, loading, error }
}