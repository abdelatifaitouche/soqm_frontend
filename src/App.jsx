import AppRouter from "@/router/AppRouter"
import { Toaster } from "sonner"
import { useContext } from "react"
import { AuthContext } from "./context/AuthContext"

export default function App() {
  const {authReady} = useContext(AuthContext);

  if (!authReady) return <p>Loading .........</p>;

  return <>
  <AppRouter />
    <Toaster richColors position="top-right" />
  </>
}