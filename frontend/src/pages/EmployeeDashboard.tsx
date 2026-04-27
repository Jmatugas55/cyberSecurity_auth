import { useEffect, useMemo, useState } from "react"
import type { FormEvent } from "react"
import { useNavigate } from "react-router-dom"
import { FiUser, FiBriefcase, FiLock, FiLogOut, FiShield, FiArrowLeft } from "react-icons/fi"
import {
  getProfile,
  updateProfile,
  updateProfilePassword,
  updateProfileDepartment,
  listDepartments,
} from "../api/api"
import type { Department, Employee } from "../types"
import { clearSession, endImpersonation, getEmail, getImpersonationAdminEmail, isImpersonating } from "../auth"
import Notification from "../components/Modal"
import { ThemeToggle } from "../theme"

type Panel = "profile" | "department" | "password"

export default function EmployeeDashboard() {
  const navigate = useNavigate()
  const [panel, setPanel] = useState<Panel>("profile")
  const [profile, setProfile] = useState<Employee | null>(null)
  const [departments, setDepartments] = useState<Department[]>([])

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    contact_number: "",
    address: "",
  })

  const [selectedDept, setSelectedDept] = useState<string>("")
  const [pwForm, setPwForm] = useState({
    old_password: "",
    new_password: "",
    confirm: "",
  })

  const [notifOpen, setNotifOpen] = useState(false)
  const [notifType, setNotifType] = useState<"success" | "error">("success")
  const [notifMsg, setNotifMsg] = useState("")

  const email = useMemo(() => getEmail(), [])
  const initial = email ? email.charAt(0).toUpperCase() : "E"
  const impersonating = useMemo(() => isImpersonating(), [])
  const adminEmail = useMemo(() => getImpersonationAdminEmail(), [])

  const handleExitImpersonation = () => {
    if (endImpersonation()) {
      navigate("/admin")
    } else {
      navigate("/")
    }
  }

  const showNotif = (type: "success" | "error", msg: string) => {
    setNotifType(type)
    setNotifMsg(msg)
    setNotifOpen(true)
  }

  const loadAll = async () => {
    try {
      const [p, ds] = await Promise.all([getProfile(), listDepartments()])
      setProfile(p)
      setDepartments(ds)
      setForm({
        first_name: p.first_name || "",
        last_name: p.last_name || "",
        contact_number: p.contact_number || "",
        address: p.address || "",
      })
      setSelectedDept(p.department_id ? String(p.department_id) : "")
    } catch (err: any) {
      showNotif("error", err.response?.data?.detail || "Failed to load profile")
    }
  }

  useEffect(() => {
    loadAll()
  }, [])

  const handleSaveProfile = async (e: FormEvent) => {
    e.preventDefault()
    try {
      const updated = await updateProfile(form)
      setProfile(updated)
      showNotif("success", "Profile updated")
    } catch (err: any) {
      showNotif("error", err.response?.data?.detail || "Failed to update profile")
    }
  }

  const handleChangeDepartment = async (e: FormEvent) => {
    e.preventDefault()
    if (!selectedDept) {
      showNotif("error", "Pick a department first")
      return
    }
    try {
      const updated = await updateProfileDepartment(Number(selectedDept))
      setProfile(updated)
      showNotif("success", "Department updated")
    } catch (err: any) {
      showNotif("error", err.response?.data?.detail || "Failed to update department")
    }
  }

  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault()
    if (pwForm.new_password !== pwForm.confirm) {
      showNotif("error", "New passwords don't match")
      return
    }
    try {
      await updateProfilePassword({
        old_password: pwForm.old_password,
        new_password: pwForm.new_password,
      })
      showNotif("success", "Password updated")
      setPwForm({ old_password: "", new_password: "", confirm: "" })
    } catch (err: any) {
      showNotif("error", err.response?.data?.detail || "Failed to update password")
    }
  }

  const handleLogout = () => {
    clearSession()
    navigate("/")
  }

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800 dark:bg-slate-950 dark:text-slate-100 transition-colors">
      <aside className="w-64 bg-white border-r border-slate-200 dark:bg-slate-900 dark:border-slate-800 flex flex-col transition-colors">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-blue-600 flex items-center justify-center text-xl font-bold text-white">
            {initial}
          </div>
          <div>
            <p className="font-semibold truncate max-w-40">{email}</p>
            <p className="text-xs text-slate-500 dark:text-slate-300">Employee</p>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-2">
          <SidebarBtn icon={<FiUser />} label="Profile" active={panel === "profile"} onClick={() => setPanel("profile")} />
          <SidebarBtn icon={<FiBriefcase />} label="Department" active={panel === "department"} onClick={() => setPanel("department")} />
          <SidebarBtn icon={<FiLock />} label="Password" active={panel === "password"} onClick={() => setPanel("password")} />
        </nav>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-2 m-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-rose-600 dark:text-red-400 transition border border-transparent hover:border-rose-300 dark:hover:border-rose-500/30"
        >
          <FiLogOut /> Logout
        </button>
      </aside>

      <main className="flex-1 p-8 overflow-y-auto">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-blue-600 dark:text-blue-400">My Workspace</h1>
            <p className="text-slate-500 dark:text-gray-300">View your profile and update your account settings.</p>
          </div>
          <ThemeToggle showLabel />
        </div>

        {impersonating && (
          <div className="mb-6 flex items-center justify-between gap-4 px-5 py-3 rounded-xl border border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200">
            <div className="flex items-center gap-3">
              <FiShield className="text-amber-500 dark:text-amber-300 shrink-0" />
              <div className="text-sm">
                <p className="font-semibold">Viewing as {email}</p>
                <p className="text-amber-700/80 dark:text-amber-300/80 text-xs">
                  Signed in by admin {adminEmail}. Actions on this page affect this employee's account.
                </p>
              </div>
            </div>
            <button
              onClick={handleExitImpersonation}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-800 border border-amber-300 dark:bg-amber-500/20 dark:hover:bg-amber-500/30 dark:text-amber-100 dark:border-amber-500/40 text-sm transition shrink-0"
            >
              <FiArrowLeft /> Return to admin
            </button>
          </div>
        )}

        {panel === "profile" && (
          <Card>
            <h2 className="text-xl font-semibold mb-4">Profile</h2>
            <div className="text-sm text-slate-600 dark:text-gray-300 mb-4">
              <p>Email: <span className="text-slate-900 dark:text-white">{profile?.user?.email}</span></p>
              <p>Department: <span className="text-slate-900 dark:text-white">{profile?.department?.department_name || "Unassigned"}</span></p>
            </div>
            <form onSubmit={handleSaveProfile} className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input label="First name" value={form.first_name} onChange={(v) => setForm({ ...form, first_name: v })} />
              <Input label="Last name" value={form.last_name} onChange={(v) => setForm({ ...form, last_name: v })} />
              <Input label="Contact number" value={form.contact_number} onChange={(v) => setForm({ ...form, contact_number: v })} />
              <Input label="Address" value={form.address} onChange={(v) => setForm({ ...form, address: v })} />
              <div className="md:col-span-2">
                <button className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition">
                  Save Profile
                </button>
              </div>
            </form>
          </Card>
        )}

        {panel === "department" && (
          <Card max="max-w-xl">
            <h2 className="text-xl font-semibold mb-4">Select Department</h2>
            <p className="text-sm text-slate-600 dark:text-gray-300 mb-3">
              Current: <span className="text-slate-900 dark:text-white">{profile?.department?.department_name || "Unassigned"}</span>
            </p>
            <form onSubmit={handleChangeDepartment} className="space-y-3">
              <select
                className="w-full px-3 py-2 rounded-lg bg-white text-slate-800 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:text-white dark:border-slate-700"
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
              >
                <option value="">— Choose department —</option>
                {departments.map((d) => (
                  <option key={d.department_id} value={d.department_id}>
                    {d.department_name}
                  </option>
                ))}
              </select>
              <button className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition">
                Save Department
              </button>
            </form>
          </Card>
        )}

        {panel === "password" && (
          <Card max="max-w-xl">
            <h2 className="text-xl font-semibold mb-4">Update Password</h2>
            <form onSubmit={handleChangePassword} className="space-y-3">
              <Input label="Current password" type="password" value={pwForm.old_password} onChange={(v) => setPwForm({ ...pwForm, old_password: v })} required />
              <Input label="New password" type="password" value={pwForm.new_password} onChange={(v) => setPwForm({ ...pwForm, new_password: v })} required />
              <Input label="Confirm new password" type="password" value={pwForm.confirm} onChange={(v) => setPwForm({ ...pwForm, confirm: v })} required />
              <p className="text-xs text-slate-500 dark:text-gray-400">
                Min 8 chars, must include uppercase, lowercase, number, and a special character.
              </p>
              <span className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer block ml-1" onClick={() => { navigate("/forgot") }}>
                forgot password?
              </span>
              <button className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition">
                Update Password
              </button>
            </form>
          </Card>
        )}
      </main>

      <Notification
        open={notifOpen}
        type={notifType}
        message={notifMsg}
        onClose={() => setNotifOpen(false)}
        duration={2500}
      />
    </div>
  )
}

function Card({ children, max = "max-w-2xl" }: { children: React.ReactNode; max?: string }) {
  return (
    <div className={`bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800 p-6 rounded-xl shadow-sm ${max}`}>
      {children}
    </div>
  )
}

function SidebarBtn({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center w-full gap-2 px-3 py-2 rounded-lg text-sm transition ${
        active
          ? "bg-blue-600 text-white"
          : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
      }`}
    >
      {icon}
      {label}
    </button>
  )
}

function Input({
  label,
  value,
  onChange,
  type = "text",
  required = false,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  required?: boolean
}) {
  return (
    <div>
      <label className="text-sm text-slate-600 dark:text-slate-300">{label}</label>
      <input
        type={type}
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        className="w-full mt-1 px-3 py-2 rounded-lg bg-white text-slate-800 border border-slate-300 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:text-white dark:border-slate-700 dark:placeholder-slate-500"
      />
    </div>
  )
}
