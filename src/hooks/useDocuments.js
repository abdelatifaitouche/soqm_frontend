import { useState, useEffect } from "react"
import { getDocuments } from "@/api/endpoints/documentApi"

/**
 * filters: { document_type, status } — both optional, sent as query params
 * exactly as-is (lowercase enum values expected by the backend).
 */
export function useDocuments(filters = {}, page = 1) {
  const [documents, setDocuments]       = useState([])
  const [documents_loading, setLoading] = useState(true)
  const [documents_error, setError]     = useState(null)
  const [total, setTotal]               = useState(0)
  const [size, setSize]                 = useState(10)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    // Drop empty-string filters so we don't send document_type= / status=
    // as literal empty query params.
    const cleanFilters = Object.fromEntries(
      Object.entries(filters).filter(([, v]) => v !== "" && v != null)
    )

    getDocuments({ ...cleanFilters, page })
      .then((res) => {
        if (cancelled) return
        // `res` is already the response body (this api instance unwraps .data
        // itself). Backend returns { total, size, page, items }.
        setDocuments(res?.items ?? [])
        setTotal(res?.total ?? 0)
        setSize(res?.size ?? 10)
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err)
          setDocuments([])
          setTotal(0)
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [JSON.stringify(filters), page])

  const totalPages = size > 0 ? Math.max(1, Math.ceil(total / size)) : 1

  return {
    documents,
    setDocuments,
    documents_loading,
    documents_error,
    total,
    size,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  }
}