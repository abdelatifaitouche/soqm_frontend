import { BrowserRouter, Routes, Route } from "react-router-dom"
import PrivateRoute from "./PrivateRoute"
import PublicRoute from "./PublicRoute"
import AppLayout from "@/layouts/AppLayout"
import AuthLayout from "@/layouts/AuthLayout"
import LoginPage from "@/pages/auth/login"
import DashboardPage from "@/pages/dashboard/dashboard"
import NotFoundPage from "@/pages/NotFoundPage"
import IsqmComponents from "@/pages/isqm_components/IsqmComponents"
import UsersPage from "@/pages/users/Users"

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public only (redirect to / if already logged in) */}
        <Route element={<PublicRoute />}>
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
          </Route>
        </Route>

        {/* Protected */}
        <Route element={<PrivateRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/components" element={<IsqmComponents />} />
            <Route path="/users" element={<UsersPage />} />
            {/* add more protected routes here */}
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}