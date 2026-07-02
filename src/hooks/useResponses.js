import { useState, useEffect } from "react"
import { getResponses } from "@/api/endpoints/responsesApi"

export function useResponses(filters = {}) {
  const [responses, setResponses] = useState([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(null)

  useEffect(() => {
    let cancelled = false

    setLoading(true)
    setError(null)

    getResponses(filters)
      .then((res) => {
        if (cancelled) return
        // axios wraps the response: res.data is the body.
        // Handle both shapes:
        //   { data: [...] }  → res.data.data
        //   [...]            → res.data  (body is array directly)
        const body = res.data
        const list = Array.isArray(body)
          ? body
          : Array.isArray(body?.data)
          ? body.data
          : []
        setResponses(list)
      })
      .catch((err) => {
        if (!cancelled) setError(err)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [JSON.stringify(filters)])

  return { responses, setResponses, loading, error }
}