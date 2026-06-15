import { useState, useEffect } from "react"
import { getObjectives } from "@/api/endpoints/objectivesApi"

export function useObjectives() {
  const [objectives, setObjectives] = useState([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState(null)

  useEffect(() => {
    getObjectives()
      .then((res) => setObjectives(res.data))
      .catch((err) => setError(err))
      .finally(() => setLoading(false))
  }, [])

  return { objectives, setObjectives, loading, error }
}