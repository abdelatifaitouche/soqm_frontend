import { Route } from "react-router-dom";
import Employees from "./pages/Employees";
import CreateEmployee from "./pages/CreateEmployee";

export const employeeRoutes = (
    <>
        <Route path="/employees" element={<Employees />} />
        <Route path="/employees/create" element={<CreateEmployee />} />
    </>
);
