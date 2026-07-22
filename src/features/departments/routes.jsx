import { Route } from "react-router-dom";
import Departments from "./pages/Departments";

export const departmentRoutes = (
    <>
        <Route path="/departments" element={<Departments />} />

    </>
);