import { Route } from "react-router-dom";
import Documents from "./pages/Documents";


export const documentRoutes = (
    <>
        <Route path="/documents"     element={<Documents />} />

    </>
);