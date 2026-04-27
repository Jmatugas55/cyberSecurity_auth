import { useState } from "react"
import type { FormEvent } from "react"
import { useLocation, Link, useNavigate } from "react-router-dom"
import Notification from "../components/Modal"
import { loginUser } from "../api/api"
import { saveSession } from "../auth"
import { Eye, EyeOff } from "lucide-react"
import login from '../images/login.png'
import { ThemeToggle } from "../theme"

export default function Login() {
  const [notificationOpen, setNotificationOpen] = useState(false)
  const [notificationType, setNotificationType] = useState<"success" | "error">("success")
  const [notificationMessage, setNotificationMessage] = useState("")
  const navigate = useNavigate()
  const location = useLocation()
  const state = (location.state as any) || {}
  const prefillEmail = state.email || ""
  const prefillPassword = state.password || ""

  const [email, setEmail] = useState(prefillEmail)
  const [password, setPassword] = useState(prefillPassword)
  const [showPassword, setShowPassword] = useState(false)

  const handleLogin = async (data: { email: string; password: string }) => {
    try {
      const res = await loginUser(data)
      const payload = res.data
      saveSession({
        access_token: payload.access_token,
        role: payload.role,
        user_id: payload.user_id,
        email: payload.email,
      })
      setNotificationType("success")
      setNotificationMessage("Login successful")
      setNotificationOpen(true)
      const target = payload.role === "admin" ? "/admin" : "/employee"
      setTimeout(() => navigate(target), 1200)
    } catch (err: any) {
      let message: string
      if (err.response) {
        message = err.response.data?.detail || "Login failed"
      } else if (err.request) {
        message = "Unable to contact server. Is the backend running?"
      } else {
        message = err.message || "Login failed"
      }
      setNotificationType("error")
      setNotificationMessage(message)
      setNotificationOpen(true)
    }
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    handleLogin({ email, password })
  }

  return (
    <div className="h-screen w-full flex bg-slate-50 dark:bg-slate-950 transition-colors">
      <div className="hidden md:block md:w-1/2 h-full">
        <img
          src={login}
          alt="Login Visual"
          className="w-full h-full object-cover"
        />
      </div>
      <div className="relative w-full md:w-1/2 flex items-center justify-center bg-white dark:bg-slate-900 px-8 transition-colors">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
        <div className="w-full max-w-md gap-5">
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white text-center">
            Welcome Back
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-center mt-2 mb-8">
            Login to your account
          </p>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-sm text-slate-600 dark:text-slate-300">Email Address</label>
              <input
                type="email"
                placeholder="example@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1 w-full px-4 py-3 rounded-lg outline-none transition
                  bg-white text-slate-700 border border-slate-300 placeholder-slate-400 focus:ring-2 focus:ring-blue-500
                  dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700 dark:placeholder-slate-500"
              />
            </div>
            <div>
              <label className="text-sm text-slate-600 dark:text-slate-300">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="mt-1 w-full px-4 py-3 pr-12 rounded-lg outline-none transition
                    bg-white text-slate-700 border border-slate-300 placeholder-slate-400 focus:ring-2 focus:ring-blue-500
                    dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700 dark:placeholder-slate-500"
                />
                <span
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute top-1/2 right-4 transform -translate-y-1/2 text-slate-500 dark:text-slate-400 cursor-pointer"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <div className="text-right">
                <Link
                  to="/forgot"
                  state={{ email }}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline underline"
                >
                  Forgot password?
                </Link>
                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-semibold shadow-md mt-2"
                >
                  Login
                </button>
              </div>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-600 dark:text-slate-400">No account yet?</p>
            <Link to="/register" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">
              Create an account
            </Link>
          </div>
        </div>
      </div>

      <Notification
        open={notificationOpen}
        type={notificationType}
        message={notificationMessage}
        onClose={() => setNotificationOpen(false)}
        duration={2000}
      />
    </div>
  )
}
