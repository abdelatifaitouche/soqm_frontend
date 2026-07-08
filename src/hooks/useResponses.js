import { useState, useEffect, useCallback } from "react"
import { getResponses } from "@/api/endpoints/responsesApi"

/**
 * Backend payload shape:
 * {
 *   total: number,
 *   size: number,
 *   page: number,
 *   items: [...]
 * }
 *
 * Pagination and filtering both happen server-side — this hook just
 * forwards `page` + any filters as query params and mirrors back
 * whatever the backend says the current page/total/size are.
 */
export function useResponses(filters = {}) {
  const [responses, setResponses] = useState([])
  const [pagination, setPagination] = useState({ total: 0, size: 10, page: 1 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // page is just another filter as far as the API is concerned,
  // but we track it separately so callers get a dedicated setPage()
  const [page, setPage] = useState(filters.page ?? 1)

  // Reset to page 1 whenever the filters themselves change (not the page)
  useEffect(() => {
    setPage(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(filters)])

  useEffect(() => {
    let cancelled = false

    setLoading(true)
    setError(null)

    getResponses({ ...filters, page })
      .then((res) => {
        if (cancelled) return
        const body = res.data

        // Expected shape: { total, size, page, items }
        // Fallback to raw array in case an endpoint ever returns one directly.
        if (Array.isArray(body)) {
          setResponses(body)
          setPagination({ total: body.length, size: body.length, page: 1 })
        } else {
          setResponses(Array.isArray(body?.items) ? body.items : [])
          setPagination({
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

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(filters), page])

  const totalPages = pagination.size > 0 ? Math.max(1, Math.ceil(pagination.total / pagination.size)) : 1

  const goToPage = useCallback(
    (p) => {
      setPage(Math.min(Math.max(1, p), totalPages))
    },
    [totalPages]
  )

  const nextPage = useCallback(() => goToPage(page + 1), [goToPage, page])
  const prevPage = useCallback(() => goToPage(page - 1), [goToPage, page])

  return {
    responses,
    setResponses,
    loading,
    error,
    // pagination
    page,
    setPage: goToPage,
    nextPage,
    prevPage,
    total: pagination.total,
    size: pagination.size,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  }
}