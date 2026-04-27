import axios, { type InternalAxiosRequestConfig, type AxiosResponse } from "axios"
import type {
  RegisterData,
  LoginData,
  LoginResponse,
  ForgotPasswordData,
  Department,
  DepartmentCreate,
  Employee,
  EmployeeCreate,
  EmployeeProfileUpdate,
  PasswordChange,
} from "../types"

const API = axios.create({
  baseURL: "http://127.0.0.1:8000",
})

API.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem("accessToken")
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

API.interceptors.response.use(
  (resp: AxiosResponse) => resp,
  (error: { response?: { status?: number } }) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("accessToken")
      localStorage.removeItem("userRole")
      localStorage.removeItem("userEmail")
      localStorage.removeItem("userId")
    }
    return Promise.reject(error)
  },
)

export const registerUser = async (data: RegisterData) => {
  const response = await API.post("/register", data)
  return response.data
}

export const loginUser = async (data: LoginData) => {
  const response = await API.post<LoginResponse>("/login", data)
  return response
}

export const getLoginAttempts = async (filter?: string) => {
  let url = "/login-attempts"
  if (filter && filter !== "all") {
    url += `?filter=${filter}`
  }
  const response = await API.get(url)
  return response.data
}

export const deleteLoginAttempt = (id: number) =>
  API.delete(`/login-attempts/${id}`)

export const resetFailedAttempts = (email: string) =>
  API.post(`/login-attempts/reset-failed/${encodeURIComponent(email)}`)

export const resetSuccessAttempts = (email: string) =>
  API.post(`/login-attempts/reset-success/${encodeURIComponent(email)}`)

export const getBlockedUsers = async () => {
  const resp = await API.get("/blocked-users")
  return resp.data
}

export const unblockUser = (id: number) =>
  API.post(`/unblock-user/${id}`)

export const requestPasswordReset = (data: ForgotPasswordData) =>
  API.post(`/forgot-password`, data)

export const getSecurityQuestion = (email: string) =>
  API.get(`/security-question`, { params: { email } })

export const resetPassword = (data: { email: string; token: string; new_password: string }) =>
  API.post(`/reset-password`, data)

export const listDepartments = async (): Promise<Department[]> => {
  const resp = await API.get<Department[]>("/departments")
  return resp.data
}

export const createDepartment = async (data: DepartmentCreate): Promise<Department> => {
  const resp = await API.post<Department>("/departments", data)
  return resp.data
}

export const listEmployees = async (): Promise<Employee[]> => {
  const resp = await API.get<Employee[]>("/employees")
  return resp.data
}

export const createEmployee = async (data: EmployeeCreate): Promise<Employee> => {
  const resp = await API.post<Employee>("/employees", data)
  return resp.data
}

export const deleteEmployee = (id: number) => API.delete(`/employees/${id}`)

export const impersonateEmployee = async (employeeId: number): Promise<LoginResponse> => {
  const resp = await API.post<LoginResponse>(`/employees/${employeeId}/impersonate`)
  return resp.data
}

export const getProfile = async (): Promise<Employee> => {
  const resp = await API.get<Employee>("/profile")
  return resp.data
}

export const updateProfile = async (data: EmployeeProfileUpdate): Promise<Employee> => {
  const resp = await API.put<Employee>("/profile", data)
  return resp.data
}

export const updateProfilePassword = (data: PasswordChange) =>
  API.put(`/profile/password`, data)

export const updateProfileDepartment = async (department_id: number): Promise<Employee> => {
  const resp = await API.put<Employee>(`/profile/department`, { department_id })
  return resp.data
}
