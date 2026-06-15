import { useTheme } from "@/context/ThemeContext"
import { Sun, Moon } from "lucide-react"

export function ThemeToggle() {
  const { theme, toggle } = useTheme()
  return (
    <button
      onClick={toggle}
      className="flex size-8 items-center justify-center rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
      title={theme === "dark" ? "Switch to light" : "Switch to dark"}
    >
      {theme === "dark"
        ? <Sun className="size-4" />
        : <Moon className="size-4" />
      }
    </button>
  )
}