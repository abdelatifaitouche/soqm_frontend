import { useState, useEffect } from "react"
import { getObjective } from "@/features/objectives/api/objectivesApi"

export function useObjective(id) {
  const [objective, setObjective] = useState(null)
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(null)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    getObjective(id)
      .then((res) => setObjective(res))
      .catch((err) => setError(err))
      .finally(() => setLoading(false))
  }, [id])

  return { objective, setObjective, loading, error }
}