import { useState, useEffect } from "react"
import { getRisks } from "@/api/endpoints/riskApi"

export function useRisks(filters = {}) {
  const [risks, setRisks]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  useEffect(() => {
    setLoading(true)
    getRisks(filters)
      .then((res) => setRisks(res))
      .catch((err) => setError(err))
      .finally(() => setLoading(false))
  }, [JSON.stringify(filters)])

  return { risks, setRisks, loading, error }
}