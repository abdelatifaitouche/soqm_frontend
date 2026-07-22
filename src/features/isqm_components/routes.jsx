import { Route } from "react-router-dom";
import IsqmComponents from "./pages/IsqmComponents";
import CreateComponent from "./pages/CreateComponent";
import ComponentDetails from "./pages/ComponentDetails";

export const isqmComponentsRoutes = (
    <>
        <Route path="/components" element={<IsqmComponents />} />
        <Route path="/components/create" element={<CreateComponent />} />
        <Route path="/components/:id" element={<ComponentDetails />} />

    </>
);