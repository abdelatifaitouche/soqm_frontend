import { useState, useEffect } from "react"
import { getRiskOptions } from "@/features/risks/api/riskApi"

export function useRiskOptions(filters = {}) {
  const [risk_options, setRiskOptions] = useState(null)
  const [risk_loading, setLoading]       = useState(true)
  const [risk_error, setError]           = useState(null)

  useEffect(() => {
    getRiskOptions(filters)
      .then((res) => setRiskOptions(res))
      .catch((err) => setError(err))
      .finally(() => setLoading(false))
  }, [JSON.stringify(filters)])

  return { risk_options, setRiskOptions, risk_loading, risk_error }
}


