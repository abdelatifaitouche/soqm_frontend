import { useState, useEffect } from "react"
import { getObjectivesOptions } from "@/api/endpoints/objectivesApi"

export function useObjectivesOptions(filters = {}) {
  const [options, setOptions] = useState(null)
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState(null)

  useEffect(() => {
    getObjectivesOptions(filters)
      .then((res) => setOptions(res))
      .catch((err) => setError(err))
      .finally(() => setLoading(false))
  }, [JSON.stringify(filters)])

  return { options, setOptions, loading, error }
}


