import { useState, useEffect } from "react"
import { getResponse } from "@/features/responses/api/responsesApi"

export function useResponse(id) {
  const [response, setResponse] = useState(null)
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(null)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    getResponse(id)
      .then((res) => setResponse(res.data))
      .catch((err) => setError(err))
      .finally(() => setLoading(false))
  }, [id])

  return { response, setResponse, loading, error }
}