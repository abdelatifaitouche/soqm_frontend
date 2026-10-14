import { Route } from "react-router-dom";
import ResponseDetails from "./pages/ResponseDetails";
import Responses from "./pages/Responses";
import CreateResponse from "./pages/CreateResponse";

export const responseRoutes = (
    <>
        <Route path="/responses"     element={<Responses />} />
        <Route path="/responses/create"     element={<CreateResponse />} />
        <Route path="/responses/:id"     element={<ResponseDetails />} />
    </>
);