import { useState, useEffect } from "react"
import { getComponents } from "@/api/endpoints/componentsApi"

export function useComponents() {
  const [components, setComponents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    getComponents()
      .then((res) => setComponents(res.data))
      .catch((err) => setError(err))
      .finally(() => setLoading(false))
  }, [])

  return { components, loading, error }
}