import { useAuth } from "@/context/AuthContext"
import { Navigate } from "react-router-dom"

export const RootRedirect = () => {
  const { currentUserRole, isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  switch (currentUserRole) {
    case "hod":
      return <Navigate to="/dashboard" replace />
    case "user":
      return <Navigate to="/my-requests" replace />
    default:
      return <Navigate to="/dashboard" replace />
  }
}
