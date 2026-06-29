import { useState, useEffect } from "react"
import { getRisks } from "@/api/endpoints/riskApi"
 
// ============================================================
// HOOK: useRisks with pagination
// ============================================================
 
export function useRisks(filters = {}, page = 1, limit = 10) {
  const [risks, setRisks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    total_pages: 0,
  })
 
  useEffect(() => {
    setLoading(true)
    setError(null)
 
    // Build params: include filters + pagination
    const params = {
      ...filters,
      page,
      limit,
    }
 
    getRisks(params)
      .then((res) => {
        // Handle both response structures:
        // 1. { data: [...], pagination: {...} }
        // 2. { risks: [...], total: 0, ... }
        if (res.data) {
          setRisks(res.data)
          setPagination(res.pagination || {})
        } else if (res.risks) {
          setRisks(res.risks)
          setPagination({
            total: res.total || 0,
            page: res.page || 1,
            limit: res.limit || 10,
            total_pages: Math.ceil((res.total || 0) / (res.limit || 10)),
          })
        } else {
          // Assume res is array of risks
          setRisks(Array.isArray(res) ? res : [])
          setPagination({
            total: Array.isArray(res) ? res.length : 0,
            page: 1,
            limit,
            total_pages: 1,
          })
        }
      })
      .catch((err) => {
        setError(err)
        setRisks([])
        setPagination({ total: 0, page: 1, limit, total_pages: 0 })
      })
      .finally(() => setLoading(false))
  }, [JSON.stringify(filters), page, limit])
 
  return { risks, setRisks, loading, error, pagination }
}