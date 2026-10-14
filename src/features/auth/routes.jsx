import { Route } from "react-router-dom";
import UsersPage from "./pages/Users";



export const userRoutes = (
    <>
        <Route path="/users" element={<UsersPage />} />
    </>
);