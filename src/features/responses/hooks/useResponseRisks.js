import { useState, useEffect } from "react"
import { getResponseRisks } from "@/features/risks/api/riskApi"

export function useResponseRisks(response_id) {
  const [response_risks, setResponseRisks] = useState(null)
  const [risks_loading, setLoading]       = useState(true)
  const [risks_error, setError]           = useState(null)

  useEffect(() => {
    getResponseRisks(response_id)
      .then((res) => setResponseRisks(res))
      .catch((err) => setError(err))
      .finally(() => setLoading(false))
  }, [response_id])
  console.log(response_risks)
  return { response_risks, setResponseRisks, risks_loading, risks_error }
}


