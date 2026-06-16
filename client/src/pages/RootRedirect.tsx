import { useAuth } from "@/context/AuthContext"
import { Navigate } from "react-router-dom"

export const RootRedirect = () => {
  const { isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <Navigate to="/dashboard" replace />
}
