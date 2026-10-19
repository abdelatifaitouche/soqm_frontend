// features/findings/hooks/useRootCauseTaxonomy.js
import { useState, useEffect } from "react"
import { getRca } from "@/features/findings/api/rcaApi"

// The taxonomy rarely changes, so fetch it once per page load and share it
// between every component that uses the hook.
let cache = null

export function useRootCauseTaxonomy() {
  const [data, setData] = useState(cache)
  const [loading, setLoading] = useState(!cache)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (cache) return
    let cancelled = false

    getRca()
      .then((res) => {
        cache = res ?? []
        if (!cancelled) setData(cache)
      })
      .catch((err) => { if (!cancelled) setError(err) })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [])

  return { data, loading, error }
}