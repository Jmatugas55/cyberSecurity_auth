export type UserRole = "admin" | "employee"

export interface SessionPayload {
  access_token: string
  role: UserRole | string
  user_id: number
  email: string
}

export const saveSession = (data: SessionPayload) => {
  localStorage.setItem("accessToken", data.access_token)
  localStorage.setItem("userRole", data.role)
  localStorage.setItem("userId", String(data.user_id))
  localStorage.setItem("userEmail", data.email)
}

export const clearSession = () => {
  localStorage.removeItem("accessToken")
  localStorage.removeItem("userRole")
  localStorage.removeItem("userId")
  localStorage.removeItem("userEmail")
  localStorage.removeItem("userPassword")
  localStorage.removeItem("adminToken")
  localStorage.removeItem("adminRole")
  localStorage.removeItem("adminUserId")
  localStorage.removeItem("adminEmail")
}

export const getRole = (): UserRole | null => {
  const r = localStorage.getItem("userRole")
  return r === "admin" || r === "employee" ? r : null
}

export const getToken = (): string | null => localStorage.getItem("accessToken")

export const getEmail = (): string => localStorage.getItem("userEmail") || ""

export const isAuthenticated = (): boolean => Boolean(getToken())

export const startImpersonation = (target: SessionPayload) => {
  const token = localStorage.getItem("accessToken")
  const role = localStorage.getItem("userRole")
  const userId = localStorage.getItem("userId")
  const email = localStorage.getItem("userEmail")
  if (token && role && userId && email) {
    localStorage.setItem("adminToken", token)
    localStorage.setItem("adminRole", role)
    localStorage.setItem("adminUserId", userId)
    localStorage.setItem("adminEmail", email)
  }
  saveSession(target)
}

export const isImpersonating = (): boolean =>
  Boolean(localStorage.getItem("adminToken"))

export const getImpersonationAdminEmail = (): string =>
  localStorage.getItem("adminEmail") || ""

export const endImpersonation = () => {
  const token = localStorage.getItem("adminToken")
  const role = localStorage.getItem("adminRole")
  const userId = localStorage.getItem("adminUserId")
  const email = localStorage.getItem("adminEmail")
  if (!token || !role || !userId || !email) return false
  localStorage.setItem("accessToken", token)
  localStorage.setItem("userRole", role)
  localStorage.setItem("userId", userId)
  localStorage.setItem("userEmail", email)
  localStorage.removeItem("adminToken")
  localStorage.removeItem("adminRole")
  localStorage.removeItem("adminUserId")
  localStorage.removeItem("adminEmail")
  return true
}
