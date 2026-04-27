import { useEffect, useState } from "react"
import type { FormEvent } from "react"
import { useNavigate, useLocation, useSearchParams } from "react-router-dom"
import Notification from "../components/Modal"
import { requestPasswordReset, resetPassword, getSecurityQuestion } from "../api/api"
import forgot from '../images/forgot.png'
import { ThemeToggle } from "../theme"

const initialForm = {
  email: "",
  method: "key" as "key" | "question",
  key: "",
  question: "",
  answer: "",
  token: "",
  password: "",
  confirm: "",
}
const initialNotif = { open: false, type: "success" as "success" | "error", msg: "" }

const fieldClass =
  "px-4 py-3 rounded-lg outline-none transition " +
  "bg-white text-slate-700 border border-slate-300 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 " +
  "dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700 dark:placeholder-slate-500"

export default function ForgotPassword() {
  const navigate = useNavigate()
  const location = useLocation()
  const passedEmail = (location.state as any)?.email || ""
  const [searchParams, setSearchParams] = useSearchParams()
  const [form, setForm] = useState({ ...initialForm, email: passedEmail })
  const [notif, setNotif] = useState(initialNotif)
  const emailFixed = Boolean(passedEmail)
  const [status, setStatus] = useState({ loading: false, qError: "", validation: "", localError: "" })
  const isResetStage = Boolean(form.token || searchParams.get("stage") === "reset")
  const show = (type: "success" | "error", msg: string) => setNotif({ open: true, type, msg })
  const validatePassword = (pwd: string) => {
    if (pwd.length < 8) return "Password must be at least 8 characters"
    if (!/[A-Z]/.test(pwd)) return "Must include at least one uppercase"
    if (!/[a-z]/.test(pwd)) return "Must include at least one lowercase"
    if (!/[0-9]/.test(pwd)) return "Must include at least one number"
    if (!/[!@#$%^&*(),.?\":{}|<>]/.test(pwd)) return "Must include a special character"
    return ""
  }

  useEffect(() => {
    if (form.token) setSearchParams({ stage: "reset" })
  }, [form.token, setSearchParams])

  useEffect(() => {
    if (form.method !== "question") {
      setForm((f) => ({ ...f, question: "" }))
      setStatus((s) => ({ ...s, qError: "", loading: false }))
      return
    }
    if (!form.email.trim()) return setStatus((s) => ({ ...s, qError: "Enter email to load security question", loading: false }))

    setStatus((s) => ({ ...s, loading: true, qError: "" }))
    getSecurityQuestion(form.email.trim())
      .then((res) => {
        const q = res.data?.security_question || ""
        setForm((f) => ({ ...f, question: q }))
        setStatus((s) => ({ ...s, qError: q ? "" : "No security question found for this email" }))
      })
      .catch((err: any) => {
        const detail = err?.response?.data?.detail
        setForm((f) => ({ ...f, question: "" }))
        setStatus((s) => ({ ...s, qError: typeof detail === "string" ? detail : "Unable to load security question" }))
      })
      .finally(() => setStatus((s) => ({ ...s, loading: false })))
  }, [form.method, form.email])

  const requestReset = async (e: FormEvent) => {
    e.preventDefault()
    setStatus((s) => ({ ...s, validation: "" }))
    const email = form.email.trim(); if (!email) return setStatus((s) => ({ ...s, validation: "Email is required" }))

    const payload: any = { email, reset_method: form.method }
    if (form.method === "key") {
      const key = form.key.trim();
      if (!key) return setStatus((s) => ({ ...s, validation: "Reset key is required" }))
      if (!/^[A-Za-z0-9_-]{6,32}$/.test(key)) return setStatus((s) => ({ ...s, validation: "Key must be 6-32 characters, letters/digits/-/_" }))
      payload.reset_key = key
    } else {
      if (!form.question) return setStatus((s) => ({ ...s, validation: "Security question must be loaded first" }))
      if (!form.answer.trim()) return setStatus((s) => ({ ...s, validation: "Security answer is required" }))
      payload.security_question = form.question
      payload.security_answer = form.answer.trim()
    }

    try {
      const resp = await requestPasswordReset(payload)
      const token = resp.data?.token
      if (token) {
        setForm((f) => ({ ...f, token }))
        show("success", "Reset token issued; please enter new password")
      } else {
        show("error", "No token returned from server")
      }
    } catch (err: any) {
      const detail = err?.response?.data?.detail
      show("error", typeof detail === "string" ? detail : JSON.stringify(detail) || "Unable to request reset")
    }
  }

  const resetSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const err = validatePassword(form.password); if (err) return setStatus((s) => ({ ...s, localError: err }))
    if (form.password !== form.confirm) return setStatus((s) => ({ ...s, localError: "Passwords do not match" }))
    setStatus((s) => ({ ...s, localError: "" }))

    try {
      await resetPassword({ email: form.email, token: form.token, new_password: form.password })
      show("success", "Password successfully reset, please login")
      setTimeout(() => navigate("/", { state: { email: form.email, password: form.password } }), 1100)
      setForm((f) => ({ ...f, email: "", key: "", answer: "", token: "", password: "", confirm: "" }))
    } catch (err: any) {
      const detail = err?.response?.data?.detail
      show("error", typeof detail === "string" ? detail : JSON.stringify(detail) || "Reset failed")
    }
  }

  return (
    <div className="h-screen w-full flex bg-slate-50 dark:bg-slate-950 transition-colors">
      <div className="hidden md:block md:w-1/2 h-full">
        <img src={forgot} alt="Forgot Visual" className="w-full h-full object-cover" />
      </div>
      <div className="relative w-full md:w-1/2 flex items-center justify-center bg-white dark:bg-slate-900 px-8 overflow-y-auto transition-colors">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
        <div className="w-full max-w-md">
          <h1 className="text-3xl font-bold text-center text-slate-800 dark:text-white">Forgot Password</h1>
          <p className="text-slate-500 dark:text-slate-400 text-center mt-2 mb-8">Enter your email and verification method</p>
          <form onSubmit={isResetStage ? resetSubmit : requestReset} className="space-y-5 w-full">
            <div className="flex flex-col">
              <label className="text-sm text-slate-600 dark:text-slate-300 mb-1">Email Address</label>
              <input
                type="email"
                placeholder="example@email.com"
                value={form.email}
                onChange={(e) => {
                  if (!emailFixed) setForm((f) => ({ ...f, email: e.target.value }))
                }}
                required
                disabled={emailFixed}
                className={`${fieldClass} ${emailFixed ? "bg-slate-100 text-slate-500 dark:bg-slate-800/60 dark:text-slate-500" : ""}`}
              />
            </div>

            <div className="flex flex-col">
              <label className="text-sm text-slate-600 dark:text-slate-300 mb-1">Verification method</label>
              <div className="flex space-x-4">
                {(["key", "question"] as const).map((method) => (
                  <label key={method} className="inline-flex items-center">
                    <input type="radio" name="method" value={method} checked={form.method === method}
                      onChange={() => setForm((f) => ({ ...f, method }))} className="form-radio accent-blue-600" />
                    <span className="ml-2 text-slate-700 dark:text-slate-200">{method === "key" ? "Reset key" : "Security question"}</span>
                  </label>
                ))}
              </div>
            </div>

            {form.method === "key" ? (
              <div className="flex flex-col">
                <label className="text-sm text-slate-600 dark:text-slate-300 mb-1">Reset key</label>
                <input type="text" value={form.key} onChange={(e) => setForm((f) => ({ ...f, key: e.target.value }))}
                  placeholder="Enter reset key" className={fieldClass} />
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex flex-col">
                  <label className="text-sm text-slate-600 dark:text-slate-300 mb-1">Security question</label>
                  {status.loading ? (
                    <p className="text-slate-700 dark:text-slate-300">Loading your question...</p>
                  ) : form.question ? (
                    <p className="px-4 py-3 rounded-lg border bg-slate-50 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700">{form.question}</p>
                  ) : (
                    <p className="text-rose-500">{status.qError || "No security question available."}</p>
                  )}
                </div>
                <div className="flex flex-col">
                  <label className="text-sm text-slate-600 dark:text-slate-300 mb-1">Security answer</label>
                  <input type="text" value={form.answer} onChange={(e) => setForm((f) => ({ ...f, answer: e.target.value }))}
                    placeholder="Enter your security answer" className={fieldClass} />
                </div>
              </div>
            )}

            {(form.token || isResetStage) && (
              <>
                <div className="flex flex-col">
                  <label className="text-sm text-slate-600 dark:text-slate-300 mb-1">Reset Token</label>
                  <input type="text" placeholder="Enter token" value={form.token} onChange={(e) => setForm((f) => ({ ...f, token: e.target.value }))}
                    required className={fieldClass} />
                </div>

                <div className="flex flex-col">
                  <label className="text-sm text-slate-600 dark:text-slate-300 mb-1">New Password</label>
                  <input type="password" placeholder="Enter new password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                    required className={fieldClass} />
                </div>

                <div className="flex flex-col">
                  <label className="text-sm text-slate-600 dark:text-slate-300 mb-1">Confirm Password</label>
                  <input type="password" placeholder="Confirm new password" value={form.confirm} onChange={(e) => setForm((f) => ({ ...f, confirm: e.target.value }))}
                    required className={fieldClass} />
                </div>
              </>
            )}

            {status.validation && <p className="text-rose-500 text-sm mt-1">{status.validation}</p>}
            {status.localError && <p className="text-rose-500 text-sm mt-1">{status.localError}</p>}

            <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-semibold">
              {isResetStage ? "Reset Password" : "Send Reset Token"}
            </button>
          </form>

          <p className="text-md text-center mt-4">
            <span className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer text-md" onClick={() => navigate(-1)}>Back </span>
          </p>
        </div>
      </div>
      <Notification open={notif.open} type={notif.type} message={notif.msg} onClose={() => setNotif((n) => ({ ...n, open: false }))} duration={2000} />
    </div>
  )
}
