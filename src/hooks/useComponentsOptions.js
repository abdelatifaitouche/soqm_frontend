import { useState, useEffect } from "react"
import { getComponentsOptions } from "@/api/endpoints/componentsApi"

export function useComponentsOptions() {
  const [options, setOptions] = useState([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState(null)

  useEffect(() => {
    getComponentsOptions()
      .then((res) => setOptions(res))
      .catch((err) => setError(err))
      .finally(() => setLoading(false))
  }, [])

  return { options, setOptions, loading, error }
}


