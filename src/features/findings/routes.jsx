import { Route } from "react-router-dom";
import FindingsPage from "./pages/FindingsPage";
import CreateFinding from "./pages/CreateFinding";
import FindingDetails from "./pages/FindingDetails";
import RcaTrackerPage from "./pages/RcaTrackerPage";
import ActionDetails from "./pages/ActionsPage";


export const findingsRoutes = (
    <>
        <Route path="/findings"     element={<FindingsPage />} />
        <Route path="/findings/identify"     element={<CreateFinding />} />
        <Route path="/findings/:id"     element={<FindingDetails />} />
        <Route path="/rca_tracker"  element={<RcaTrackerPage/>}/>
        <Route path="/actions/:action_id"  element={<ActionDetails/>}/>

    </>
) ;