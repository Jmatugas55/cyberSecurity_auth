import * as React from "react"
import { useEffect, useMemo, useState } from "react"
import type { ReactNode } from "react"
import { useNavigate } from "react-router-dom"
import {
  FiHome,
  FiUsers,
  FiBriefcase,
  FiLogOut,
  FiShield,
  FiSearch,
  FiActivity,
  FiCheckCircle,
  FiXCircle,
  FiLock,
  FiUnlock,
  FiRefreshCw,
  FiTrash2,
  FiPlus,
  FiLogIn,
} from "react-icons/fi"
import {
  createDepartment,
  createEmployee,
  listDepartments,
  listEmployees,
  deleteEmployee,
  getLoginAttempts,
  getBlockedUsers,
  unblockUser,
  resetFailedAttempts,
  impersonateEmployee,
} from "../api/api"
import type {
  BlockedUser,
  Department,
  Employee,
  LoginSummary,
} from "../types"
import { clearSession, getEmail, startImpersonation } from "../auth"
import Notification from "../components/Modal"
import { ThemeToggle } from "../theme"

type Panel = "overview" | "departments" | "employees" | "attempts"
type AttemptTab = "all" | "success" | "failed" | "blocked"

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [panel, setPanel] = useState<Panel>("overview")

  const [departments, setDepartments] = useState<Department[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [attempts, setAttempts] = useState<LoginSummary[]>([])
  const [blocked, setBlocked] = useState<BlockedUser[]>([])

  const [deptName, setDeptName] = useState("")

  const [empForm, setEmpForm] = useState({
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    contact_number: "",
    address: "",
    department_id: "",
    reset_key: "TempKey-1234",
  })

  const [attemptTab, setAttemptTab] = useState<AttemptTab>("all")
  const [search, setSearch] = useState("")
  const [empSearch, setEmpSearch] = useState("")

  const [busy, setBusy] = useState<string | null>(null)

  const [notifOpen, setNotifOpen] = useState(false)
  const [notifType, setNotifType] = useState<"success" | "error">("success")
  const [notifMsg, setNotifMsg] = useState("")

  const adminEmail = useMemo(() => getEmail(), [])
  const initial = adminEmail ? adminEmail.charAt(0).toUpperCase() : "A"

  const showNotif = (type: "success" | "error", msg: string) => {
    setNotifType(type)
    setNotifMsg(msg)
    setNotifOpen(true)
  }

  const loadDepartments = async () => {
    try {
      setDepartments(await listDepartments())
    } catch (e: any) {
      showNotif("error", e.response?.data?.detail || "Failed to load departments")
    }
  }

  const loadEmployees = async () => {
    try {
      setEmployees(await listEmployees())
    } catch (e: any) {
      showNotif("error", e.response?.data?.detail || "Failed to load employees")
    }
  }

  const loadAttempts = async () => {
    try {
      const [a, b] = await Promise.all([getLoginAttempts("all"), getBlockedUsers()])
      setAttempts(a || [])
      setBlocked(b || [])
    } catch (e: any) {
      showNotif("error", e.response?.data?.detail || "Failed to load login attempts")
    }
  }

  useEffect(() => {
    loadDepartments()
    loadEmployees()
    loadAttempts()
  }, [])

  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!deptName.trim()) return
    try {
      await createDepartment({ department_name: deptName.trim() })
      showNotif("success", "Department created")
      setDeptName("")
      loadDepartments()
    } catch (err: any) {
      showNotif("error", err.response?.data?.detail || "Failed to create department")
    }
  }

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createEmployee({
        email: empForm.email,
        password: empForm.password,
        first_name: empForm.first_name || undefined,
        last_name: empForm.last_name || undefined,
        contact_number: empForm.contact_number || undefined,
        address: empForm.address || undefined,
        department_id: empForm.department_id ? Number(empForm.department_id) : undefined,
        reset_method: "key",
        reset_key: empForm.reset_key || "TempKey-1234",
      })
      showNotif("success", "Employee created")
      setEmpForm({
        email: "",
        password: "",
        first_name: "",
        last_name: "",
        contact_number: "",
        address: "",
        department_id: "",
        reset_key: "TempKey-1234",
      })
      loadEmployees()
    } catch (err: any) {
      const detail = err.response?.data?.detail
      showNotif("error", typeof detail === "string" ? detail : "Failed to create employee")
    }
  }

  const handleDeleteEmployee = async (id: number) => {
    if (!confirm("Delete this employee?")) return
    try {
      await deleteEmployee(id)
      showNotif("success", "Employee deleted")
      loadEmployees()
    } catch (err: any) {
      showNotif("error", err.response?.data?.detail || "Failed to delete employee")
    }
  }

  const handleResetFailed = async (email: string) => {
    setBusy(`reset:${email}`)
    try {
      await resetFailedAttempts(email)
      showNotif("success", `Failed attempts reset for ${email}`)
      loadAttempts()
    } catch (err: any) {
      showNotif("error", err.response?.data?.detail || "Failed to reset")
    } finally {
      setBusy(null)
    }
  }

  const handleUnblock = async (id: number, email: string) => {
    setBusy(`unblock:${id}`)
    try {
      await unblockUser(id)
      showNotif("success", `${email} unblocked`)
      loadAttempts()
    } catch (err: any) {
      showNotif("error", err.response?.data?.detail || "Failed to unblock")
    } finally {
      setBusy(null)
    }
  }

  const handleImpersonate = async (employee: Employee) => {
    if (!employee.user) {
      showNotif("error", "Employee has no linked user")
      return
    }
    setBusy(`imp:${employee.employee_id}`)
    try {
      const data = await impersonateEmployee(employee.employee_id)
      startImpersonation({
        access_token: data.access_token,
        role: data.role,
        user_id: data.user_id,
        email: data.email,
      })
      showNotif("success", `Logged in as ${data.email}`)
      setTimeout(() => navigate("/employee"), 600)
    } catch (err: any) {
      showNotif("error", err.response?.data?.detail || "Failed to login as employee")
    } finally {
      setBusy(null)
    }
  }

  const handleLogout = () => {
    clearSession()
    navigate("/")
  }

  const blockedEmails = useMemo(() => new Set(blocked.map((b) => b.email)), [blocked])

  const filteredAttempts = useMemo(() => {
    const q = search.trim().toLowerCase()
    let rows = attempts
    if (q) rows = rows.filter((r) => r.email.toLowerCase().includes(q))
    if (attemptTab === "success") rows = rows.filter((r) => r.success > 0)
    if (attemptTab === "failed") rows = rows.filter((r) => r.failed > 0)
    return rows
  }, [attempts, search, attemptTab])

  const filteredBlocked = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return blocked
    return blocked.filter((b) => b.email.toLowerCase().includes(q))
  }, [blocked, search])

  const filteredEmployees = useMemo(() => {
    const q = empSearch.trim().toLowerCase()
    if (!q) return employees
    return employees.filter((e) => {
      const name = `${e.first_name || ""} ${e.last_name || ""}`.toLowerCase()
      return (
        e.user?.email?.toLowerCase().includes(q) ||
        name.includes(q) ||
        (e.department?.department_name || "").toLowerCase().includes(q)
      )
    })
  }, [employees, empSearch])

  const successCount = attempts.reduce((acc, r) => acc + (r.success > 0 ? 1 : 0), 0)
  const failedCount = attempts.reduce((acc, r) => acc + (r.failed > 0 ? 1 : 0), 0)

  const attemptsHeaders = (() => {
    if (attemptTab === "success") return ["Email", "Successful", "Status", "Actions"]
    if (attemptTab === "failed") return ["Email", "Failed", "Status", "Actions"]
    return ["Email", "Successful", "Failed", "Status", "Actions"]
  })()

  const emptyAttemptsMsg = (() => {
    if (attemptTab === "success") return "No successful logins recorded yet."
    if (attemptTab === "failed") return "No failed login attempts recorded."
    return "No login activity matches your filter."
  })()

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800 dark:bg-slate-950 dark:text-slate-100 transition-colors">
      <aside className="w-72 bg-white border-r border-slate-200 dark:bg-slate-900 dark:border-slate-800 flex flex-col transition-colors">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-linear-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-xl font-bold text-white shadow-lg">
            {initial}
          </div>
          <div className="min-w-0">
            <p className="font-semibold truncate">{adminEmail}</p>
            <p className="text-xs text-indigo-600 dark:text-indigo-300 flex items-center gap-1">
              <FiShield className="shrink-0" /> Administrator
            </p>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1.5">
          <SidebarBtn icon={<FiHome />} label="Overview" active={panel === "overview"} onClick={() => setPanel("overview")} />
          <SidebarBtn icon={<FiBriefcase />} label="Departments" active={panel === "departments"} onClick={() => setPanel("departments")} badge={departments.length} />
          <SidebarBtn icon={<FiUsers />} label="Employees" active={panel === "employees"} onClick={() => setPanel("employees")} badge={employees.length} />
          <SidebarBtn icon={<FiActivity />} label="Login Attempts" active={panel === "attempts"} onClick={() => setPanel("attempts")} badge={blocked.length || undefined} badgeTone="rose" />
        </nav>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-2.5 m-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-rose-600 dark:text-rose-400 transition border border-transparent hover:border-rose-300 dark:hover:border-rose-500/30"
        >
          <FiLogOut /> Sign out
        </button>
      </aside>

      <main className="flex-1 p-8 overflow-y-auto">
        <header className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Manage organization data, monitor login activity and assist users.
            </p>
          </div>
          <ThemeToggle showLabel />
        </header>

        {panel === "overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Departments" value={departments.length} icon={<FiBriefcase />} tone="blue" />
              <StatCard label="Employees" value={employees.length} icon={<FiUsers />} tone="indigo" />
              <StatCard label="Active Logins" value={successCount} icon={<FiCheckCircle />} tone="emerald" />
              <StatCard label="Blocked Users" value={blocked.length} icon={<FiLock />} tone="rose" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card title="Recent Employees" icon={<FiUsers />}>
                <ul className="divide-y divide-slate-200 dark:divide-slate-800">
                  {employees.slice(0, 5).map((e) => (
                    <li key={e.employee_id} className="py-2.5 flex items-center justify-between">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{e.user?.email}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          {[e.first_name, e.last_name].filter(Boolean).join(" ") || "—"} · {e.department?.department_name || "Unassigned"}
                        </p>
                      </div>
                    </li>
                  ))}
                  {employees.length === 0 && <li className="py-3 text-sm text-slate-500 dark:text-slate-400">No employees yet.</li>}
                </ul>
              </Card>

              <Card title="Currently Blocked" icon={<FiLock />}>
                <ul className="divide-y divide-slate-200 dark:divide-slate-800">
                  {blocked.map((b) => (
                    <li key={b.id} className="py-2.5 flex items-center justify-between">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{b.email}</p>
                        <p className="text-xs text-amber-600 dark:text-amber-400">until {new Date(b.blocked_until).toLocaleString()}</p>
                      </div>
                      <button
                        onClick={() => handleUnblock(b.id, b.email)}
                        disabled={busy === `unblock:${b.id}`}
                        className="text-xs px-3 py-1.5 rounded-md bg-rose-100 text-rose-700 hover:bg-rose-200 border border-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:hover:bg-rose-500/20 dark:border-rose-500/30 transition disabled:opacity-50"
                      >
                        Unblock
                      </button>
                    </li>
                  ))}
                  {blocked.length === 0 && <li className="py-3 text-sm text-slate-500 dark:text-slate-400">No blocked accounts.</li>}
                </ul>
              </Card>
            </div>
          </div>
        )}

        {panel === "departments" && (
          <div className="space-y-6">
            <Card title="Create Department" icon={<FiPlus />}>
              <form onSubmit={handleCreateDepartment} className="flex gap-3">
                <input
                  className="flex-1 px-3 py-2.5 rounded-lg bg-white text-slate-800 border border-slate-300 placeholder-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 outline-none transition dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700 dark:placeholder-slate-500"
                  placeholder="e.g. Engineering"
                  value={deptName}
                  onChange={(e) => setDeptName(e.target.value)}
                  required
                />
                <button className="px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition shadow-lg shadow-indigo-900/20">
                  Create
                </button>
              </form>
            </Card>

            <Card title="All Departments" icon={<FiBriefcase />}>
              <Table headers={["ID", "Name", "Employees"]}>
                {departments.map((d) => {
                  const count = employees.filter((e) => e.department_id === d.department_id).length
                  return (
                    <tr key={d.department_id} className="border-t border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition">
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{d.department_id}</td>
                      <td className="px-4 py-3 font-medium">{d.department_name}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-700 border border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-300 dark:border-indigo-500/30 text-xs">{count}</span>
                      </td>
                    </tr>
                  )
                })}
                {departments.length === 0 && (
                  <tr><td colSpan={3} className="px-4 py-6 text-center text-slate-500 dark:text-slate-400">No departments yet.</td></tr>
                )}
              </Table>
            </Card>
          </div>
        )}

        {panel === "employees" && (
          <div className="space-y-6">
            <Card title="Create Employee" icon={<FiPlus />}>
              <form onSubmit={handleCreateEmployee} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input label="Email" type="email" value={empForm.email} onChange={(v) => setEmpForm({ ...empForm, email: v })} required />
                <Input label="Password" type="password" value={empForm.password} onChange={(v) => setEmpForm({ ...empForm, password: v })} required />
                <Input label="First name" value={empForm.first_name} onChange={(v) => setEmpForm({ ...empForm, first_name: v })} />
                <Input label="Last name" value={empForm.last_name} onChange={(v) => setEmpForm({ ...empForm, last_name: v })} />
                <Input label="Contact number" value={empForm.contact_number} onChange={(v) => setEmpForm({ ...empForm, contact_number: v })} />
                <Input label="Address" value={empForm.address} onChange={(v) => setEmpForm({ ...empForm, address: v })} />
                <div>
                  <label className="text-sm text-slate-600 dark:text-slate-300">Department</label>
                  <select
                    className="w-full mt-1 px-3 py-2.5 rounded-lg bg-white text-slate-800 border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 outline-none transition dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700"
                    value={empForm.department_id}
                    onChange={(e) => setEmpForm({ ...empForm, department_id: e.target.value })}
                  >
                    <option value="">— Unassigned —</option>
                    {departments.map((d) => (
                      <option key={d.department_id} value={d.department_id}>{d.department_name}</option>
                    ))}
                  </select>
                </div>
                <Input label="Reset key" value={empForm.reset_key} onChange={(v) => setEmpForm({ ...empForm, reset_key: v })} />
                <div className="md:col-span-2 flex items-center justify-between">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Min 8 chars · upper, lower, number, and a special character.
                  </p>
                  <button className="px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition shadow-lg shadow-indigo-900/20">
                    Create Employee
                  </button>
                </div>
              </form>
            </Card>

            <Card title="All Employees" icon={<FiUsers />} action={
              <SearchInput value={empSearch} onChange={setEmpSearch} placeholder="Search by name, email, department" />
            }>
              <Table headers={["#", "Email", "Name", "Department", "Contact", "Actions"]}>
                {filteredEmployees.map((e) => (
                  <tr key={e.employee_id} className="border-t border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition">
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{e.employee_id}</td>
                    <td className="px-4 py-3 font-medium">{e.user?.email}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {[e.first_name, e.last_name].filter(Boolean).join(" ") || "—"}
                    </td>
                    <td className="px-4 py-3">
                      {e.department?.department_name ? (
                        <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-700 border border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-300 dark:border-indigo-500/30 text-xs">
                          {e.department.department_name}
                        </span>
                      ) : <span className="text-slate-400 dark:text-slate-500">—</span>}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{e.contact_number || "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleImpersonate(e)}
                          disabled={busy === `imp:${e.employee_id}` || e.user?.role === "admin"}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:hover:bg-emerald-500/20 dark:border-emerald-500/30 text-xs transition disabled:opacity-50"
                          title="Login as this user"
                        >
                          <FiLogIn /> Login as
                        </button>
                        <button
                          onClick={() => handleDeleteEmployee(e.employee_id)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-rose-100 text-rose-700 hover:bg-rose-200 border border-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:hover:bg-rose-500/20 dark:border-rose-500/30 text-xs transition"
                        >
                          <FiTrash2 /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredEmployees.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-500 dark:text-slate-400">No employees match your search.</td></tr>
                )}
              </Table>
            </Card>
          </div>
        )}

        {panel === "attempts" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard label="Users with Successful Logins" value={successCount} icon={<FiCheckCircle />} tone="emerald" />
              <StatCard label="Users with Failed Attempts" value={failedCount} icon={<FiXCircle />} tone="amber" />
              <StatCard label="Currently Blocked" value={blocked.length} icon={<FiLock />} tone="rose" />
            </div>

            <Card
              title="Login Attempts"
              icon={<FiActivity />}
              action={<SearchInput value={search} onChange={setSearch} placeholder="Search by email" />}
            >
              <div className="flex flex-wrap gap-2 mb-4">
                <Tab label="All" active={attemptTab === "all"} onClick={() => setAttemptTab("all")} count={attempts.length} />
                <Tab label="Success" active={attemptTab === "success"} onClick={() => setAttemptTab("success")} count={successCount} tone="emerald" />
                <Tab label="Failed" active={attemptTab === "failed"} onClick={() => setAttemptTab("failed")} count={failedCount} tone="amber" />
                <Tab label="Blocked" active={attemptTab === "blocked"} onClick={() => setAttemptTab("blocked")} count={blocked.length} tone="rose" />
              </div>

              {attemptTab === "blocked" ? (
                <Table headers={["#", "Email", "Blocked Until", "Action"]}>
                  {filteredBlocked.map((u) => (
                    <tr key={u.id} className="border-t border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition">
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{u.id}</td>
                      <td className="px-4 py-3 font-medium">{u.email}</td>
                      <td className="px-4 py-3 text-amber-600 dark:text-amber-300">{new Date(u.blocked_until).toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleUnblock(u.id, u.email)}
                          disabled={busy === `unblock:${u.id}`}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:hover:bg-emerald-500/20 dark:border-emerald-500/30 text-xs transition disabled:opacity-50"
                        >
                          <FiUnlock /> Unblock
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredBlocked.length === 0 && (
                    <tr><td colSpan={4} className="px-4 py-6 text-center text-slate-500 dark:text-slate-400">No blocked accounts.</td></tr>
                  )}
                </Table>
              ) : (
                <Table headers={attemptsHeaders}>
                  {filteredAttempts.map((a) => {
                    const isBlocked = blockedEmails.has(a.email)
                    return (
                      <tr key={a.email} className="border-t border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition">
                        <td className="px-4 py-3 font-medium">{a.email}</td>
                        {(attemptTab === "all" || attemptTab === "success") && (
                          <td className="px-4 py-3 text-emerald-600 dark:text-emerald-300">{a.success}</td>
                        )}
                        {(attemptTab === "all" || attemptTab === "failed") && (
                          <td className="px-4 py-3 text-amber-600 dark:text-amber-300">{a.failed}</td>
                        )}
                        <td className="px-4 py-3">
                          {isBlocked ? (
                            <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-700 border border-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/30 text-xs">Blocked</span>
                          ) : a.failed > 0 ? (
                            <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/30 text-xs">Has failures</span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30 text-xs">OK</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            {a.failed > 0 && (
                              <button
                                onClick={() => handleResetFailed(a.email)}
                                disabled={busy === `reset:${a.email}`}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-indigo-100 text-indigo-700 hover:bg-indigo-200 border border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-300 dark:hover:bg-indigo-500/20 dark:border-indigo-500/30 text-xs transition disabled:opacity-50"
                              >
                                <FiRefreshCw /> Reset failures
                              </button>
                            )}
                            {isBlocked && (
                              <button
                                onClick={() => {
                                  const b = blocked.find((x) => x.email === a.email)
                                  if (b) handleUnblock(b.id, b.email)
                                }}
                                disabled={busy?.startsWith("unblock:")}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:hover:bg-emerald-500/20 dark:border-emerald-500/30 text-xs transition disabled:opacity-50"
                              >
                                <FiUnlock /> Unblock
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                  {filteredAttempts.length === 0 && (
                    <tr><td colSpan={attemptsHeaders.length} className="px-4 py-6 text-center text-slate-500 dark:text-slate-400">{emptyAttemptsMsg}</td></tr>
                  )}
                </Table>
              )}
            </Card>
          </div>
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

function SidebarBtn({
  icon,
  label,
  active,
  onClick,
  badge,
  badgeTone = "indigo",
}: {
  icon: ReactNode
  label: string
  active: boolean
  onClick: () => void
  badge?: number
  badgeTone?: "indigo" | "rose"
}) {
  const toneClass =
    badgeTone === "rose"
      ? "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/30"
      : "bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-500/15 dark:text-indigo-300 dark:border-indigo-500/30"
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center w-full gap-3 px-3 py-2.5 rounded-lg text-sm transition ${
        active
          ? "bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-600/20 dark:text-white dark:border-indigo-500/40"
          : "text-slate-700 hover:bg-slate-100 border border-transparent dark:text-slate-300 dark:hover:bg-slate-800"
      }`}
    >
      <span className="text-base">{icon}</span>
      <span className="flex-1 text-left">{label}</span>
      {badge !== undefined && (
        <span className={`text-xs px-1.5 py-0.5 rounded-md border ${toneClass}`}>{badge}</span>
      )}
    </button>
  )
}

function Card({
  title,
  icon,
  action,
  children,
}: {
  title: string
  icon?: ReactNode
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800 rounded-2xl p-6 shadow-sm dark:shadow-xl dark:shadow-black/20 transition-colors">
      <header className="flex items-center justify-between mb-4 gap-4 flex-wrap">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          {icon && <span className="text-indigo-600 dark:text-indigo-400">{icon}</span>}
          {title}
        </h2>
        {action}
      </header>
      {children}
    </section>
  )
}

function Table({ headers, children }: { headers: string[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto -mx-2">
      <table className="w-full text-left text-sm">
        <thead className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
          <tr>
            {headers.map((h) => (
              <th key={h} className="px-4 py-2 font-medium">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  )
}

function Tab({
  label,
  active,
  onClick,
  count,
  tone = "indigo",
}: {
  label: string
  active: boolean
  onClick: () => void
  count: number
  tone?: "indigo" | "emerald" | "amber" | "rose"
}) {
  const toneActive: Record<string, string> = {
    indigo: "bg-indigo-100 text-indigo-700 border-indigo-300 dark:bg-indigo-500/20 dark:text-indigo-200 dark:border-indigo-500/40",
    emerald: "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-200 dark:border-emerald-500/40",
    amber: "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-500/20 dark:text-amber-200 dark:border-amber-500/40",
    rose: "bg-rose-100 text-rose-700 border-rose-300 dark:bg-rose-500/20 dark:text-rose-200 dark:border-rose-500/40",
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm transition ${
        active
          ? toneActive[tone]
          : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
      }`}
    >
      {label}
      <span className="text-xs px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 dark:bg-black/30 dark:text-slate-200">{count}</span>
    </button>
  )
}

function SearchInput({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <div className="relative">
      <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pl-9 pr-3 py-2 rounded-lg bg-white text-slate-800 border border-slate-300 placeholder-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 outline-none text-sm w-64 transition dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700 dark:placeholder-slate-500"
      />
    </div>
  )
}

function StatCard({
  label,
  value,
  icon,
  tone = "indigo",
}: {
  label: string
  value: number
  icon: ReactNode
  tone?: "indigo" | "blue" | "emerald" | "amber" | "rose"
}) {
  const tones: Record<string, string> = {
    indigo: "from-indigo-100 to-white text-indigo-700 border-indigo-200 dark:from-indigo-500/20 dark:to-indigo-500/5 dark:text-indigo-300 dark:border-indigo-500/30",
    blue: "from-blue-100 to-white text-blue-700 border-blue-200 dark:from-blue-500/20 dark:to-blue-500/5 dark:text-blue-300 dark:border-blue-500/30",
    emerald: "from-emerald-100 to-white text-emerald-700 border-emerald-200 dark:from-emerald-500/20 dark:to-emerald-500/5 dark:text-emerald-300 dark:border-emerald-500/30",
    amber: "from-amber-100 to-white text-amber-700 border-amber-200 dark:from-amber-500/20 dark:to-amber-500/5 dark:text-amber-300 dark:border-amber-500/30",
    rose: "from-rose-100 to-white text-rose-700 border-rose-200 dark:from-rose-500/20 dark:to-rose-500/5 dark:text-rose-300 dark:border-rose-500/30",
  }
  return (
    <div className={`relative overflow-hidden rounded-2xl border p-5 bg-linear-to-br bg-white dark:bg-slate-900 transition-colors ${tones[tone]}`}>
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</p>
        <span className="text-xl">{icon}</span>
      </div>
      <p className="text-3xl font-bold mt-3 text-slate-900 dark:text-white">{value}</p>
    </div>
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
        className="w-full mt-1 px-3 py-2.5 rounded-lg bg-white text-slate-800 border border-slate-300 placeholder-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 outline-none transition dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700 dark:placeholder-slate-500"
      />
    </div>
  )
}
