import { useState, useEffect } from "react"
import { getEmployeeOptions } from "@/api/endpoints/employeesApi"

export function useEmployeeOptions() {
  const [employee_options, setEmployeeOptions] = useState(null)
  const [employee_loading, setLoading]       = useState(true)
  const [employee_error, setError]           = useState(null)

  useEffect(() => {
    getEmployeeOptions()
      .then((res) => setEmployeeOptions(res))
      .catch((err) => setError(err))
      .finally(() => setLoading(false))
  }, [])

  return { employee_options, setEmployeeOptions, employee_loading, employee_error }
}


