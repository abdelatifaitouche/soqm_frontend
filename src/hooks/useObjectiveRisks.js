import { useEffect, useState } from "react"
import { getObjectiveRisks } from "@/api/endpoints/objectivesApi"

export function useObjectiveRisks(objectiveId) {
  const [risks, setRisks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!objectiveId) return

    getObjectiveRisks(objectiveId)
      .then((res) => setRisks(res))
      .catch((err) => setError(err))
      .finally(() => setLoading(false))
  }, [objectiveId])

  return {
    risks,
    setRisks,
    loading,
    error
  }
}