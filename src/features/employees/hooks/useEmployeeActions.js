import { useState } from "react"
import {
  updateEmployee,
  blockEmployee,
  activateEmployee,
} from "@/features/employees/api/employeesApi"

/**
 * Mutations for one employee. Each action resolves with the API response and
 * rejects on failure, so the caller decides how to show errors.
 * `busy` is "update" | "block" | "activate" | null.
 */
export function useEmployeeActions(id) {
  const [busy, setBusy] = useState(null)

  const run = async (name, fn) => {
    setBusy(name)
    try {
      return await fn()
    } finally {
      setBusy(null)
    }
  }

  return {
    busy,
    update: (data) => run("update", () => updateEmployee(id, data)),
    block: () => run("block", () => blockEmployee(id)),
    activate: () => run("activate", () => activateEmployee(id)),
  }
}