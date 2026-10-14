import { useState, useEffect } from "react"
import { getRiskMatrix } from "@/features/risks/api/riskApi"

export function useRiskMatrix() {
  const [cells, setCells]     = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    getRiskMatrix()
      .then((res) => {
        if (cancelled) return
        setCells(res.cells ?? [])
      })
      .catch((err) => { if (!cancelled) setError(err) })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [])

  // Build a lookup map: "sig-occ" → cell data for O(1) access in the grid
  const cellMap = Object.fromEntries(
    cells.map((c) => [`${c.significance}-${c.occurence}`, c])
  )

  return { cells, cellMap, loading, error }
}