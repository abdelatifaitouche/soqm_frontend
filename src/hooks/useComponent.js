import { useState, useEffect } from "react"
import { getComponent } from "@/api/endpoints/componentsApi"

export function useComponent(id) {
  const [component, setComponent] = useState(null)
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState(null)

  useEffect(() => {
    getComponent(id)
      .then((res) => setComponent(res))
      .catch((err) => setError(err))
      .finally(() => setLoading(false))

  }, [id])

  return { component, setComponent, loading, error }
}


