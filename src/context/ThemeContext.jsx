import { createContext, useContext, useEffect, useState } from "react"

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("soqm-theme") ?? "light"
  })

  useEffect(() => {
    const root = document.documentElement
    root.classList.remove("light", "dark")
    root.classList.add(theme)
    localStorage.setItem("soqm-theme", theme)
  }, [theme])

  const toggle = () => setTheme((t) => t === "light" ? "dark" : "light")

  return (
    <ThemeContext.Provider value={{ theme, toggle, isDark: theme === "dark" }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider")
  return ctx
}