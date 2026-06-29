import { useState, useEffect } from "react"
import { getUserOptions } from "@/api/endpoints/usersApi"

export function useUserOptions() {
  const [user_options, setUserOptions] = useState(null)
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState(null)

  useEffect(() => {
    getUserOptions()
      .then((res) => setUserOptions(res.data))
      .catch((err) => setError(err))
      .finally(() => setLoading(false))
  }, [])

  return { user_options, setUserOptions, loading, error }
}


