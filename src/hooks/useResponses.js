import { useState, useEffect } from "react"
import { getResponses } from "@/api/endpoints/responsesApi"

export function useResponses(filters = {}) {
  const [responses, setResponses] = useState([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState(null)

  useEffect(() => {
    getResponses(filters)
      .then((res) => setResponses(res.data))
      .catch((err) => setError(err))
      .finally(() => setLoading(false))
  }, [JSON.stringify(filters)])

  return { responses, setResponses, loading, error }
}

