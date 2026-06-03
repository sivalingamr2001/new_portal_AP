import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"

import useSessionStorage from "@/hooks/useSessionStorage"

const STORAGE_KEY = "jan_AP_user"

type cmplUser = {
  cmplUserId: number
  cmplUserName: string
  empId: string
  mailId: string
  mobNo: string
  deptId: number
}

type user = {
  role: string
  location: string
}

type department = {
  deptId: number
  deptName: string
  hodId: string
}

type hod = {
  idRow: number
  hodName: string
  id: string
  emailId: string
  mobNo: string
}

type currentUser = {
  user: user
  cmplUser: cmplUser
  department: department
  hod: hod
}

type AuthContextType = {
  currentUser: currentUser | null
  currentUserRole: string | null
  isAuthenticated: boolean
  login: (user: any, expireInMinutes?: number) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { get, set, remove } = useSessionStorage()

  const [currentUser, setCurrentUser] = useState<any | null>(undefined)

  useEffect(() => {
    const user = get(STORAGE_KEY)

    setCurrentUser(user)
  }, [get])

  const login = (user: any, expireInMinutes = 30) => {
    set(STORAGE_KEY, user, expireInMinutes)

    setCurrentUser(user)
  }

  const logout = () => {
    remove(STORAGE_KEY)

    setCurrentUser(null)
  }

  const value = useMemo(
    () => ({
      currentUser,

      currentUserRole: currentUser?.user?.role ?? null,

      isAuthenticated: !!currentUser,

      login,

      logout,
    }),
    [currentUser]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider")
  }

  return context
}
