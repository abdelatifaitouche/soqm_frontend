import { useState, useEffect } from "react"
import { getDepts } from "@/api/endpoints/departmentApi"

export function useDepts() {
  const [depts, setDepts]     = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  useEffect(() => {
    getDepts()
      .then((res) => setDepts(res.data))
      .catch((err) => setError(err))
      .finally(() => setLoading(false))
  }, [])

  return { depts, setDepts, loading, error }
}