export interface RegisterData {
  email: string
  password: string
  reset_method: "key" | "question"
  reset_key?: string
  security_question?: string
  security_answer?: string
  first_name?: string
  last_name?: string
  contact_number?: string
  address?: string
}

export interface LoginAttempt {
  id: number
  email: string
  ip_address: string
  success: boolean
  attempt_time: string
}

export interface LoginSummary {
  email: string
  success: number
  failed: number
}

export interface LoginData {
  email: string
  password: string
}

export interface LoginResponse {
  access_token: string
  token_type: string
  role: "admin" | "employee"
  user_id: number
  email: string
}

export interface ForgotPasswordData {
  email: string
  reset_method: "key" | "question"
  reset_key?: string
  security_answer?: string
}

export interface ResetPasswordData {
  email: string
  token: string
  password: string
}

export interface BlockedUser {
  id: number
  email: string
  blocked_until: string
}

export type AttemptFilter = "all" | "failed" | "success" | "blocked"

export interface Department {
  department_id: number
  department_name: string
}

export interface DepartmentCreate {
  department_name: string
}

export interface EmployeeUser {
  id: number
  email: string
  role: string
}

export interface Employee {
  employee_id: number
  user_id: number
  department_id: number | null
  first_name: string | null
  last_name: string | null
  contact_number: string | null
  address: string | null
  user?: EmployeeUser | null
  department?: Department | null
}

export interface EmployeeCreate {
  email: string
  password: string
  first_name?: string
  last_name?: string
  contact_number?: string
  address?: string
  department_id?: number
  reset_method?: "key" | "question"
  reset_key?: string
}

export interface EmployeeProfileUpdate {
  first_name?: string
  last_name?: string
  contact_number?: string
  address?: string
}

export interface PasswordChange {
  old_password: string
  new_password: string
}
