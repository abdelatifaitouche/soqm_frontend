import { BrowserRouter, Routes, Route } from "react-router-dom"
import PrivateRoute from "./PrivateRoute"
import PublicRoute from "./PublicRoute"
import AppLayout from "@/layouts/AppLayout"
import AuthLayout from "@/layouts/AuthLayout"
import LoginPage from "@/features/auth/pages/login"
import NotFoundPage from "@/pages/NotFoundPage"
import { riskRoutes } from "@/features/risks/routes"
import { responseRoutes } from "@/features/responses/routes"
import { objectiveRoutes } from "@/features/objectives/routes"
import { isqmComponentsRoutes } from "@/features/isqm_components/routes"
import { employeeRoutes } from "@/features/employees/routes"
import { documentRoutes } from "@/features/documents/routes"
import { departmentRoutes } from "@/features/departments/routes"
import { userRoutes } from "@/features/auth/routes"
import { dashboardRoutes } from "@/features/dashboard/routes"

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
            {dashboardRoutes}
            {isqmComponentsRoutes}
            {employeeRoutes}
            {documentRoutes}
            {departmentRoutes}
            {userRoutes}            
            {objectiveRoutes}
            {riskRoutes}
            {responseRoutes}
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}