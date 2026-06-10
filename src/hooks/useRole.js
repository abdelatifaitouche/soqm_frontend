import { useAuth } from "@/hooks/useAuth"

const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN"]

export function useRole() {
  const { user } = useAuth()
  const role = user?.role ?? null

  return {
    role,
    isAdmin: ADMIN_ROLES.includes(role),
    isSuperAdmin: role === "SUPER_ADMIN",
  }
}