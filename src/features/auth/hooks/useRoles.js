import { useState, useEffect } from "react"
import { getRoles } from "@/features/auth/api/usersApi"

export function useRoles() {
  const [roles, setRoles]     = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getRoles()
      .then((res) => setRoles(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return { roles, loading }
}