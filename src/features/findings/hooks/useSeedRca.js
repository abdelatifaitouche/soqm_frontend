import { useState } from "react"
import { seedRca } from "@/features/findings/api/rcaApi"

export function useSeedRca() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const seed = async (file) => {
    setLoading(true)
    setError(null)

    try {
      return await seedRca(file)
    } catch (err) {
      setError(err)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return { seed, loading, error }
}