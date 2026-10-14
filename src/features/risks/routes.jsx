import { Route } from "react-router-dom";
import Risks from "./pages/Risks";
import RiskDetails from "./pages/RiskDetails";
import CreateRisk from "./pages/CreateRisk";


export const riskRoutes = (
    <>
        <Route path="/risks"     element={<Risks />} />
        <Route path="/risks/create"     element={<CreateRisk />} />
        <Route path="/risks/:id"     element={<RiskDetails />} />
    </>
) ;