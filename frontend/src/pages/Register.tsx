import { useState } from "react"
import { useNavigate } from "react-router-dom"
import AuthForm from "../components/AuthForm"
import Notification from "../components/Modal"
import { registerUser } from "../api/api"
import { Link } from "react-router-dom"
import register from '../images/register.png'
import { ThemeToggle } from "../theme"

export default function Register() {

  const navigate = useNavigate()
  const [notificationOpen, setNotificationOpen] = useState(false)
  const [notificationType, setNotificationType] = useState<"success" | "error">("success")
  const [notificationMessage, setNotificationMessage] = useState("")
  const [loadingSuccess, setLoadingSuccess] = useState(false)
  const [passwordError, setPasswordError] = useState("")
  const handleRegister = async (data: {
    email: string
    password: string
    reset_method: "key" | "question"
    reset_key?: string
    security_question?: string
    security_answer?: string
  }) => {
    setPasswordError("")

    try {
      setLoadingSuccess(true)

      await registerUser(data)
      setNotificationType("success")
      setNotificationMessage("Registration successful. Redirecting to login...")
      setNotificationOpen(true)
      localStorage.setItem("userEmail", data.email)
      localStorage.setItem("userPassword", data.password)

      setTimeout(() => {
        navigate("/", { state: { email: data.email, password: data.password } })
      }, 1100)

      return
    } catch (err: any) {
      let msg: string | undefined
      if (err.response) {
        msg = err.response.data?.detail
        if (Array.isArray(msg)) {
          msg = msg.map((e: any) => e.msg).join(" ")
        }
      } else if (err.request) {
        msg = "Unable to contact server. Is the backend running?"
      } else {
        msg = err.message || "Registration failed"
      }
      msg = msg || "Registration failed"

      setPasswordError(msg)
      setNotificationType("error")
      setNotificationMessage(msg)
      setNotificationOpen(true)
    } finally {
      setLoadingSuccess(false)
    }
  }

  return (
    <div className="h-screen w-full flex bg-slate-50 dark:bg-slate-950 transition-colors">
      <div className="hidden md:block md:w-1/2 h-full">
        <img
          src={register}
          alt="Register Visual"
          className="w-full h-full object-cover"
        />
      </div>
      <div className="relative w-full md:w-1/2 flex items-center justify-center bg-white dark:bg-slate-900 px-8 overflow-y-auto transition-colors">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
        <div className="w-full max-w-md py-10">

          <h1 className="text-3xl font-bold text-slate-800 dark:text-white text-center">
            Create Account
          </h1>

          <p className="text-slate-500 dark:text-slate-400 text-center mt-2 mb-8">
            Register to access the system
          </p>

          <AuthForm
            onSubmit={handleRegister}
            buttonText={loadingSuccess ? "Processing..." : "Register"}
            passwordError={passwordError}
            disabled={loadingSuccess}
            enablePasswordGeneration={true}
          />
          <div className="mt-6 text-center">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Already have an account?
            </p>
            <Link
              to="/"
              className="text-blue-600 dark:text-blue-400 font-semibold hover:underline"
            >
              Login here
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
