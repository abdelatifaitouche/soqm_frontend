import { useState, useEffect } from "react"
import { getDepts } from "@/features/departments/api/departmentApi"

export function useDepts() {
  const [depts, setDepts]     = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  useEffect(() => {
    getDepts()
      .then((res) => setDepts(res))
      .catch((err) => setError(err))
      .finally(() => setLoading(false))
  }, [])

  return { depts, setDepts, loading, error }
}