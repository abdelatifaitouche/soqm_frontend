import { Route } from "react-router-dom";
import ObjectiveDetails from "./pages/ObjectiveDetails";
import Objectives from "./pages/Objectives";
import CreateObjective from "@/features/objectives/pages/CreateObjective"


export const objectiveRoutes = (
    <>
        <Route path="/objectives" element={<Objectives />} />
        <Route path="/objectives/create" element={<CreateObjective />} />
        <Route path="/objectives/:id"     element={<ObjectiveDetails />} />
                
    </>
);