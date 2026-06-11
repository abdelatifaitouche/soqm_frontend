import { useState, useEffect } from "react"
import { getUsers } from "@/api/endpoints/usersApi"

export function useUsers(page = 1) {
  const [users, setUsers]   = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState(null)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    setLoading(true)
    getUsers(page)
      .then((res) => {
        // handle both paginated {results, total_pages} and plain array
        if (Array.isArray(res.data)) {
          setUsers(res.data)
        } else {
          setUsers(res.data.results ?? res.data.items ?? [])
          setTotalPages(res.data.total_pages ?? res.data.pages ?? 1)
        }
      })
      .catch((err) => setError(err))
      .finally(() => setLoading(false))
  }, [page])

  return { users, setUsers, loading, error, totalPages }
}