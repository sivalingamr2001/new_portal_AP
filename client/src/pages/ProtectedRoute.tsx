import { Navigate, Outlet, useLocation } from "react-router-dom"
import { Loader } from "@/components/Loader"
import { useAuth } from "@/context/AuthContext"
import { DEV_BYPASS_AUTH } from "@/lib/config/auth-config"

export const ProtectedRoute = () => {
  const { isAuthenticated, currentUser } = useAuth()

  const location = useLocation()

  if (DEV_BYPASS_AUTH) {
    return <Outlet />
  }

  if (currentUser === undefined) {
    return <Loader />
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location,
        }}
      />
    )
  }

  return <Outlet />
}
