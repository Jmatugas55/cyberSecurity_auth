import { useState } from "react"
import type { FormEvent } from "react"
import { Link } from "react-router-dom"

interface Props {
  currentPassword: string
  onSavePassword: (newPassword: string) => void
}

export default function ResetPasswordPanel({ currentPassword, onSavePassword }: Props) {
  const [oldPassword, setOldPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const validatePassword = (pwd: string) => {
    if (pwd.length < 8) return "Password must be at least 8 characters"
    if (!/[A-Z]/.test(pwd)) return "Must include at least one uppercase letter"
    if (!/[a-z]/.test(pwd)) return "Must include at least one lowercase letter"
    if (!/[0-9]/.test(pwd)) return "Must include at least one number"
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) return "Must include at least one special character"
    return ""
  }

  const handleResetSubmit = (e: FormEvent) => {
    e.preventDefault()
    setMessage(null)

    if (!oldPassword) {
      setMessage({ type: "error", text: "Current password is required." })
      return
    }
    if (oldPassword !== currentPassword) {
      setMessage({ type: "error", text: "Current password does not match." })
      return
    }

    const validationError = validatePassword(newPassword)
    if (validationError) {
      setMessage({ type: "error", text: validationError })
      return
    }

    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "New password and confirmation must match." })
      return
    }

    onSavePassword(newPassword)
    setMessage({ type: "success", text: "Password successfully updated." })
    setOldPassword("")
    setNewPassword("")
    setConfirmPassword("")
  }

  const inputClass =
    "w-full px-3 py-2 rounded-lg outline-none transition " +
    "bg-white text-slate-800 border border-slate-300 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 " +
    "dark:bg-slate-900 dark:text-white dark:border-slate-700 dark:placeholder-slate-500"

  return (
    <div className="w-full max-w-xl p-6 rounded-xl shadow-sm transition-colors
      bg-white text-slate-800 border border-slate-200
      dark:bg-slate-900 dark:text-white dark:border-slate-700 dark:shadow-lg">
      <h3 className="text-2xl font-bold mb-4">Reset Password</h3>
      <p className="mb-4 text-slate-600 dark:text-gray-300">Enter your current password and choose a new password.</p>
      <form onSubmit={handleResetSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-slate-700 dark:text-gray-200 mb-1">Current Password</label>
          <input
            type="password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            required
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm text-slate-700 dark:text-gray-200 mb-1">New Password</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm text-slate-700 dark:text-gray-200 mb-1">Confirm New Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className={inputClass}
          />
        </div>

        {message && (
          <p className={`text-sm ${message.type === "error" ? "text-rose-500 dark:text-red-400" : "text-emerald-600 dark:text-green-400"}`}>{message.text}</p>
        )}

        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-semibold transition"
        >
          Update Password
        </button>
      </form>

      <p className="text-slate-600 dark:text-gray-300 mt-4 text-sm">
        Forgot your password?&nbsp;
        <Link to="/forgot" state={{ email: localStorage.getItem("userEmail") || "" }} className="text-blue-600 hover:text-blue-700 dark:text-blue-300 dark:hover:text-blue-100 underline">
          go to reset method
        </Link>
      </p>
    </div>
  )
}
