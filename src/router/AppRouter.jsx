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
import ComponentDetails from "@/pages/isqm_components/ComponentDetails"
import Responses from "@/pages/risks/responses/Responses"
import ResponseDetails from "@/pages/risks/responses/ResponseDetails"
import CreateRisk from "@/pages/risks/CreateRisk"
import RiskDetails from "../pages/risks/RiskDetails"
import Employees from "@/pages/employees/Employees"
import CreateEmployee from "@/pages/employees/CreateEmployee"
import CreateResponse from "@/pages/risks/responses/CreateResponse"
import Risks from "@/pages/risks/Risks"
import Matrix from "@/pages/risks/Matrix"
import Documents from "@/pages/documents/Documents"

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
            <Route path="/components/:id" element={<ComponentDetails />} />


            <Route path="/users" element={<UsersPage />} />
            <Route path="/employees" element={<Employees />} />
            <Route path="/employees/create" element={<CreateEmployee />} />
            <Route path="/departments" element={<Departments />} />
            {/* add more protected routes here */}
            
            
            <Route path="/objectives" element={<Objectives />} />
            <Route path="/objectives/create" element={<CreateObjective />} />
            <Route path="/objectives/:id"     element={<ObjectiveDetails />} />

            <Route path="/risks"     element={<Risks />} />
            <Route path="/risks/create"     element={<CreateRisk />} />
            <Route path="/risks/:id"     element={<RiskDetails />} />

            <Route path="/responses"     element={<Responses />} />
            <Route path="/responses/create"     element={<CreateResponse />} />
             <Route path="/responses/:id"     element={<ResponseDetails />} />

             <Route path="/documents"     element={<Documents />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}