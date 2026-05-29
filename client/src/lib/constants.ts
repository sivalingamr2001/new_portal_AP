import Logo from "@/assets/jana.png"
import { useState, useEffect } from "react"

export default Logo

export const ENV_CONFIG = {
  BASE_API_URL: import.meta.env.VITE_BASE_API_URL || "/api",
}

export function useDebounce<T>(value: T, delay?: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay || 500)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}

export const UserRole = {
  Admin: 1,
  It: 2,
  Hod: 3,
  User: 4,
} as const
