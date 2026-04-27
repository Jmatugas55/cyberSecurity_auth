import { useEffect, useMemo, useState } from "react"
import { FiActivity, FiCheckCircle, FiXCircle, FiLock, FiSearch, FiRefreshCw, FiUnlock } from "react-icons/fi"
import { getLoginAttempts, getBlockedUsers, unblockUser, resetFailedAttempts, resetSuccessAttempts } from "../api/api"
import type { LoginSummary, BlockedUser, AttemptFilter } from "../types"

export default function LoginAttempts() {
  const [attempts, setAttempts] = useState<LoginSummary[]>([])
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([])
  const [filter, setFilter] = useState<AttemptFilter>("all")
  const [search, setSearch] = useState("")

  useEffect(() => {
    loadData()
  }, [filter])

  const loadData = async () => {
    try {
      if (filter === "blocked") {
        const data = await getBlockedUsers()
        setBlockedUsers(data || [])
      } else {
        const [a, b] = await Promise.all([getLoginAttempts("all"), getBlockedUsers()])
        setAttempts(a || [])
        setBlockedUsers(b || [])
      }
    } catch {
      // ignore — UI shows empty states
    }
  }

  const handleUnblock = async (id: number) => {
    await unblockUser(id)
    await loadData()
  }

  const handleResetFailed = async (email: string) => {
    await resetFailedAttempts(email)
    await loadData()
  }

  const handleResetSuccess = async (email: string) => {
    await resetSuccessAttempts(email)
    await loadData()
  }

  const filteredAttempts = useMemo(() => {
    const q = search.trim().toLowerCase()
    let rows = attempts
    if (q) rows = rows.filter((a) => a.email.toLowerCase().includes(q))
    if (filter === "success") rows = rows.filter((a) => a.success > 0)
    if (filter === "failed") rows = rows.filter((a) => a.failed > 0)
    return rows
  }, [attempts, search, filter])

  const filteredBlocked = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return blockedUsers
    return blockedUsers.filter((b) => b.email.toLowerCase().includes(q))
  }, [blockedUsers, search])

  const headers = (() => {
    if (filter === "blocked") return ["ID", "Email", "Blocked Until", "Action"]
    if (filter === "success") return ["Email", "Successful", "Action"]
    if (filter === "failed") return ["Email", "Failed", "Action"]
    return ["Email", "Successful", "Failed", "Action"]
  })()

  const emptyMsg = (() => {
    if (filter === "blocked") return "No blocked accounts."
    if (filter === "success") return "No successful logins recorded yet."
    if (filter === "failed") return "No failed login attempts recorded."
    return "No login activity yet."
  })()

  const filterIcon = (() => {
    if (filter === "success") return <FiCheckCircle className="text-emerald-500 dark:text-emerald-400" />
    if (filter === "failed") return <FiXCircle className="text-amber-500 dark:text-amber-400" />
    if (filter === "blocked") return <FiLock className="text-rose-500 dark:text-rose-400" />
    return <FiActivity className="text-indigo-500 dark:text-indigo-400" />
  })()

  const colSpan = headers.length

  return (
    <div className="w-full mx-auto rounded-2xl p-6 transition-colors
      bg-white text-slate-800 border border-slate-200 shadow-sm
      dark:bg-slate-900 dark:text-white dark:border-slate-700 dark:shadow-2xl">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          {filterIcon}
          <h2 className="text-2xl font-bold">Login Attempts</h2>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by email"
              className="pl-9 pr-3 py-2 rounded-lg text-sm w-56 outline-none transition
                bg-white text-slate-800 border border-slate-300 placeholder-slate-400 focus:ring-2 focus:ring-blue-500
                dark:bg-slate-800 dark:text-white dark:border-slate-600 dark:placeholder-slate-500"
            />
          </div>
          <label className="text-slate-600 dark:text-gray-300 text-sm">Filter</label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as AttemptFilter)}
            className="rounded-lg px-3 py-2 text-sm outline-none transition
              bg-white text-slate-800 border border-slate-300 focus:ring-2 focus:ring-blue-500
              dark:bg-slate-800 dark:text-white dark:border-slate-600"
          >
            <option value="all">All</option>
            <option value="success">Success</option>
            <option value="failed">Failed</option>
            <option value="blocked">Blocked Users</option>
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
        <table className="w-full text-left">
          <thead className="text-xs uppercase tracking-wider
            bg-slate-100 text-slate-600
            dark:bg-slate-800 dark:text-gray-300">
            <tr>
              {headers.map((h) => (
                <th key={h} className="px-4 py-3 font-medium">{h}</th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {filter === "blocked" && (
              <>
                {filteredBlocked.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition">
                    <td className="px-4 py-3 text-slate-700 dark:text-gray-200">{u.id}</td>
                    <td className="px-4 py-3 text-slate-700 dark:text-gray-200 font-medium">{u.email}</td>
                    <td className="px-4 py-3 text-amber-600 dark:text-yellow-400">{u.blocked_until}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleUnblock(u.id)}
                        className="inline-flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 rounded-lg text-sm transition"
                      >
                        <FiUnlock /> Unblock
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredBlocked.length === 0 && (
                  <tr>
                    <td colSpan={colSpan} className="px-4 py-6 text-center text-slate-500 dark:text-slate-400">
                      {emptyMsg}
                    </td>
                  </tr>
                )}
              </>
            )}

            {filter !== "blocked" && (
              <>
                {filteredAttempts.map((a) => (
                  <tr key={a.email} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition">
                    <td className="px-4 py-3 text-slate-700 dark:text-gray-200 font-medium">{a.email}</td>
                    {(filter === "all" || filter === "success") && (
                      <td className="px-4 py-3 text-emerald-600 dark:text-green-400 font-medium">{a.success}</td>
                    )}
                    {(filter === "all" || filter === "failed") && (
                      <td className="px-4 py-3 text-amber-600 dark:text-red-400 font-medium">{a.failed}</td>
                    )}
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        {filter === "failed" && (
                          <button
                            onClick={() => handleResetFailed(a.email)}
                            className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-sm transition"
                          >
                            <FiRefreshCw /> Reset Failed
                          </button>
                        )}
                        {filter === "success" && (
                          <button
                            onClick={() => handleResetSuccess(a.email)}
                            className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-sm transition"
                          >
                            <FiRefreshCw /> Reset Success
                          </button>
                        )}
                        {filter === "all" && a.failed > 0 && (
                          <button
                            onClick={() => handleResetFailed(a.email)}
                            className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-sm transition"
                          >
                            <FiRefreshCw /> Reset Failed
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredAttempts.length === 0 && (
                  <tr>
                    <td colSpan={colSpan} className="px-4 py-6 text-center text-slate-500 dark:text-slate-400">
                      {emptyMsg}
                    </td>
                  </tr>
                )}
              </>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
