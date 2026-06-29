import { useState, useEffect } from "react"
import { getEmployees } from "@/api/endpoints/employeesApi"

// ============================================================
// EMPLOYEE ENUMS
// ============================================================

export const EMPLOYEE_STATUS = {
  ACTIVE: "ACTIVE",
  INVITED: "INVITED",
  ON_LEAVE: "ON_LEAVE",
  IN_ACTIVE: "IN_ACTIVE",
  TERMINATED: "TERMINATED",
}

export const EMPLOYEE_LEVEL = {
  INTERN: "INTERN",
  JUNIOR: "JUNIOR",
  MID: "MID",
  SENIOR: "SENIOR",
  MANAGER: "MANAGER",
  SENIOR_MANAGER: "SENIOR_MANAGER",
  DIRECTOR: "DIRECTOR",
  PARTNER: "PARTNER",
}

// ============================================================
// HOOK: useEmployees with pagination & filtering
// ============================================================

/**
 * Backend returns: [] or [{id, first_name, last_name, ...}, ...]
 * No pagination info in response, so we calculate it client-side
 */

const ITEMS_PER_PAGE = 10

export function useEmployees(filters = {}, page = 1) {
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    total_pages: 0,
  })

  useEffect(() => {
    setLoading(true)
    setError(null)

    // Build params
    const params = {
      ...filters,
      page,
    }


    getEmployees(params)
      .then((res) => {

        // Your backend returns: [] or [{...}, {...}]
        if (!res) {
          setEmployees([])
          setPagination({ total: 0, page: 1, total_pages: 0 })
          return
        }

        // Check if response is an array (YOUR BACKEND FORMAT)
        if (Array.isArray(res)) {

          // Get all employees from array
          const allEmployees = res

          // Calculate pagination client-side
          const total = allEmployees.length
          const totalPages = Math.ceil(total / ITEMS_PER_PAGE)

          // Get employees for current page
          const startIndex = (page - 1) * ITEMS_PER_PAGE
          const endIndex = startIndex + ITEMS_PER_PAGE
          const pageEmployees = allEmployees.slice(startIndex, endIndex)

          setEmployees(pageEmployees)
          setPagination({
            total,
            page,
            total_pages: totalPages || 1,
          })

        
          return
        }

        // Fallback: Try other formats for future API changes
        let parsedEmployees = []
        let parsedPagination = { total: 0, page: 1, total_pages: 0 }

        // Format 2: { data: [...], pagination: {...} }
        if (res.data && Array.isArray(res.data)) {
          parsedEmployees = res.data
          parsedPagination = res.pagination || {
            total: res.data.length,
            page: 1,
            total_pages: 1,
          }
        }
        // Format 3: { employees: [...], total, page, total_pages }
        else if (res.employees && Array.isArray(res.employees)) {
          parsedEmployees = res.employees
          parsedPagination = {
            total: res.total || 0,
            page: res.page || 1,
            total_pages: res.total_pages || Math.ceil((res.total || 0) / ITEMS_PER_PAGE),
          }
        }
        // Format 4: { items: [...] }
        else if (res.items && Array.isArray(res.items)) {
          parsedEmployees = res.items
          parsedPagination = {
            total: res.total || res.items.length,
            page: res.page || 1,
            total_pages: res.total_pages || 1,
          }
        }
        // Fallback: Try to find any array
        else {
          const arrayProp = Object.keys(res).find(
            (key) => Array.isArray(res[key]) && res[key].length > 0
          )

          if (arrayProp) {
            parsedEmployees = res[arrayProp]
            parsedPagination = {
              total: res.total || parsedEmployees.length,
              page: res.page || 1,
              total_pages: res.total_pages || 1,
            }
          } else {
            parsedEmployees = []
            parsedPagination = { total: 0, page: 1, total_pages: 0 }
          }
        }

        setEmployees(parsedEmployees)
        setPagination(parsedPagination)
      })
      .catch((err) => {
      

        setError(err)
        setEmployees([])
        setPagination({ total: 0, page: 1, total_pages: 0 })
      })
      .finally(() => {
        setLoading(false)
      })
  }, [JSON.stringify(filters), page])

  return { employees, setEmployees, loading, error, pagination }
}