import { createContext, useContext, useEffect, useState } from "react"
import type { ReactNode } from "react"
import { FiMoon, FiSun } from "react-icons/fi"

type Theme = "light" | "dark"

interface ThemeContextValue {
  theme: Theme
  toggle: () => void
  setTheme: (t: Theme) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

const STORAGE_KEY = "appTheme"

function readInitialTheme(): Theme {
  if (typeof window === "undefined") return "light"
  const saved = window.localStorage.getItem(STORAGE_KEY)
  if (saved === "light" || saved === "dark") return saved
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

function applyTheme(theme: Theme) {
  const root = document.documentElement
  if (theme === "dark") {
    root.classList.add("dark")
    root.style.colorScheme = "dark"
  } else {
    root.classList.remove("dark")
    root.style.colorScheme = "light"
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    const t = readInitialTheme()
    applyTheme(t)
    return t
  })

  useEffect(() => {
    applyTheme(theme)
    window.localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  const value: ThemeContextValue = {
    theme,
    toggle: () => setThemeState((t) => (t === "dark" ? "light" : "dark")),
    setTheme: setThemeState,
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider")
  return ctx
}

export function ThemeToggle({
  className = "",
  showLabel = false,
}: {
  className?: string
  showLabel?: boolean
}) {
  const { theme, toggle } = useTheme()
  const isDark = theme === "dark"
  return (
    <button
      type="button"
      onClick={toggle}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={`inline-flex items-center gap-2 h-9 px-3 rounded-lg border text-sm transition
        bg-white text-slate-700 border-slate-200 hover:bg-slate-100
        dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 dark:hover:bg-slate-700
        ${className}`}
    >
      {isDark ? <FiSun /> : <FiMoon />}
      {showLabel && <span>{isDark ? "Light" : "Dark"}</span>}
    </button>
  )
}
