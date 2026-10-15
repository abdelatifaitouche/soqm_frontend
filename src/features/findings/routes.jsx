import { Route } from "react-router-dom";
import FindingsPage from "./pages/FindingsPage";
import CreateFinding from "./pages/CreateFinding";
import FindingDetails from "./pages/FindingDetails";


export const findingsRoutes = (
    <>
        <Route path="/findings"     element={<FindingsPage />} />
        <Route path="/findings/identify"     element={<CreateFinding />} />
        <Route path="/findings/:id"     element={<FindingDetails />} />
    </>
) ;