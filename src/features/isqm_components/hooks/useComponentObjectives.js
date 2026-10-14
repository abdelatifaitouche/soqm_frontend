import { useEffect, useState } from "react"
import { getComponentObjectives } from "@/features/isqm_components/api/componentsApi"

export function useComponentObjectives(componentId) {
  const [objectives, setObjectives] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!componentId) return

    getComponentObjectives(componentId)
      .then((res) => setObjectives(res))
      .catch((err) => setError(err))
      .finally(() => setLoading(false))
  }, [componentId])

  return {
    objectives,
    setObjectives,
    loading,
    error
  }
}