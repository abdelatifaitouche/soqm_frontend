import { useState, useEffect } from "react"
import { getRisks } from "@/api/endpoints/riskApi"

export function useRisks() {
  const [risks, setRisks] = useState([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState(null)

  useEffect(() => {
    getRisks()
      .then((res) => setRisks(res.data))
      .catch((err) => setError(err))
      .finally(() => setLoading(false))
  }, [])

  return { risks, setRisks, loading, error }
}