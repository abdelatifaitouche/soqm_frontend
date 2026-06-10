import { Navigate, Outlet } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"

// Prevents logged-in users from going back to /login
export default function PublicRoute() {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? <Navigate to="/" replace /> : <Outlet />
}