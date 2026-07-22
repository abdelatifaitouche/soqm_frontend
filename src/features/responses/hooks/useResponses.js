import { useState, useEffect } from "react"
import { getResponses } from "@/features/responses/api/responsesApi"

/**
 * Backend payload shape:
 * { total, size, page, items: [...] }
 *
 * `filters` should NOT include `page` — pass page separately so changing
 * filters can reset to page 1 without the caller having to remember to do it.
 */
export function useResponses(filters = {}, page = 1) {
  const [responses, setResponses] = useState([])
  const [meta, setMeta]           = useState({ total: 0, size: 10, page: 1 })
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(null)

  useEffect(() => {
    let cancelled = false

    setLoading(true)
    setError(null)

    getResponses({ ...filters, page })
      .then((res) => {
        if (cancelled) return
        const body = res.data

        if (Array.isArray(body)) {
          // Fallback: some endpoints might still return a bare array
          setResponses(body)
          setMeta({ total: body.length, size: body.length || 1, page: 1 })
        } else {
          setResponses(Array.isArray(body?.items) ? body.items : [])
          setMeta({
            total: body?.total ?? 0,
            size: body?.size ?? 10,
            page: body?.page ?? page,
          })
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [JSON.stringify(filters), page])

  const totalPages = meta.size > 0 ? Math.max(1, Math.ceil(meta.total / meta.size)) : 1

  return {
    responses,
    setResponses,
    loading,
    error,
    total: meta.total,
    size: meta.size,
    page: meta.page,
    totalPages,
    hasNextPage: meta.page < totalPages,
    hasPrevPage: meta.page > 1,
  }
}