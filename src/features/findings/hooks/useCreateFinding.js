import { useState } from "react"
import { createFinding } from "@/features/findings/api/findingsApi"

export function useCreateFinding() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const create = async (payload) => {
    setLoading(true)
    setError(null)

    try {
      const result = await createFinding(payload)
      return result
    } catch (err) {
      setError(err)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return { create, loading, error }
}