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
import Departments from "@/pages/departments/Departments"
import Objectives from "@/pages/objectives/Objectives"
import CreateObjective from "@/pages/objectives/CreateObjective"
import ObjectiveDetails from "@/pages/objectives/ObjectiveDetails"
import CreateComponent from "@/pages/isqm_components/CreateComponent"
import RiskMatrix from "@/pages/risks/RiskMatrix"

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
            <Route path="/components/create" element={<CreateComponent />} />


            <Route path="/users" element={<UsersPage />} />
            <Route path="/departments" element={<Departments />} />
            {/* add more protected routes here */}
            
            
            <Route path="/objectives" element={<Objectives />} />
            <Route path="/objectives/create" element={<CreateObjective />} />
            <Route path="/objectives/:id"     element={<ObjectiveDetails />} />

            <Route path="/risks"     element={<RiskMatrix />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}