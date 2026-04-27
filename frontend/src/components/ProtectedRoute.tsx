import type { ReactNode } from "react"
import { Navigate } from "react-router-dom"
import { getRole, isAuthenticated } from "../auth"
import type { UserRole } from "../auth"

interface Props {
  children: ReactNode
  role?: UserRole
}

export default function ProtectedRoute({ children, role }: Props) {
  if (!isAuthenticated()) {
    return <Navigate to="/" replace />
  }

  const userRole = getRole()
  if (role && userRole !== role) {
    if (userRole === "admin") return <Navigate to="/admin" replace />
    if (userRole === "employee") return <Navigate to="/employee" replace />
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
