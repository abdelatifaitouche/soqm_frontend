import { useLocation } from "react-router-dom"

const ROUTE_LABELS = {
  "":         "Dashboard",
  "dashboard": "Dashboard",
  "users":    "Users",
  "settings": "Settings",
  "users": "Users",
  "departments": "Departments",

  // add more as you add pages
}

export function useBreadcrumbs() {
  const { pathname } = useLocation()

  const segments = pathname.split("/").filter(Boolean)

  if (segments.length === 0) {
    return [{ label: "Dashboard", href: "/" }]
  }

  return segments.map((segment, index) => ({
    label: ROUTE_LABELS[segment] ?? segment.charAt(0).toUpperCase() + segment.slice(1),
    href: "/" + segments.slice(0, index + 1).join("/"),
  }))
}