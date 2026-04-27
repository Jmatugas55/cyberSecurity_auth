import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { FiShield, FiLogOut, FiLock } from "react-icons/fi";
import LoginAttempts from "../components/LoginAttempts";
import ResetPasswordPanel from "../components/ResetPasswordPanel";
import Notification from "../components/Modal";
import { ThemeToggle } from "../theme";

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activePanel, setActivePanel] = useState<"attempts" | "reset">("attempts")
  const [notificationOpen, setNotificationOpen] = useState(false)
  const [notificationType, setNotificationType] = useState<"success" | "error">("success")
  const [notificationMessage, setNotificationMessage] = useState("")

  const userEmail = useMemo(() => {
    return localStorage.getItem("userEmail") || "guest@example.com"
  }, [])

  const userPassword = useMemo(() => {
    return localStorage.getItem("userPassword") || ""
  }, [])

  const userInitial = userEmail ? userEmail.charAt(0).toUpperCase() : "U"

  const handleSavePassword = (newPassword: string) => {
    try {
      if (!newPassword || newPassword.length < 6) {
        throw new Error("Password must be at least 6 characters long.");
      }
      localStorage.setItem("userPassword", newPassword);

      setNotificationType("success");
      setNotificationMessage("Password updated successfully!");
      setNotificationOpen(true);

    } catch (error: any) {
      setNotificationType("error");
      setNotificationMessage(error.message || "Failed to update password.");
      setNotificationOpen(true);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800 dark:bg-slate-950 dark:text-white transition-colors">
      <aside
        className={`${sidebarOpen ? "w-64" : "w-20"} bg-white border-r border-slate-200 dark:bg-slate-900 dark:border-slate-800 transition-all duration-300 flex flex-col`}
      >
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-blue-600 flex items-center justify-center text-xl font-bold text-white">
            {userInitial}
          </div>
          {sidebarOpen && (
            <div className="min-w-0">
              <p className="font-semibold truncate">{userEmail}</p>
              <p className="text-xs text-slate-500 dark:text-gray-300">Logged in</p>
            </div>
          )}
        </div>

        <nav className="flex-1 p-3 space-y-2">
          <button
            type="button"
            className={`flex items-center w-full gap-2 px-3 py-2 rounded-lg text-sm transition ${
              activePanel === "attempts"
                ? "bg-blue-600 text-white"
                : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            }`}
            onClick={() => setActivePanel("attempts")}
          >
            <FiShield />
            {sidebarOpen && "Login Attempts"}
          </button>

          <button
            type="button"
            className={`flex items-center w-full gap-2 px-3 py-2 rounded-lg text-sm transition ${
              activePanel === "reset"
                ? "bg-blue-600 text-white"
                : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            }`}
            onClick={() => setActivePanel("reset")}
          >
            <FiLock />
            {sidebarOpen && "Reset Password"}
          </button>
        </nav>

        <Link
          to="/"
          className="flex items-center gap-2 px-3 py-2 m-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-rose-600 dark:text-red-400 transition"
        >
          <FiLogOut />
          {sidebarOpen && "Logout"}
        </Link>

        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="m-3 p-2 bg-blue-600 rounded-full text-white self-center hover:bg-blue-700 transition"
          aria-label="Toggle sidebar"
        >
          {sidebarOpen ? "<" : ">"}
        </button>
      </aside>

      <main className="flex-1 p-8 overflow-y-auto">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-blue-600 dark:text-blue-400">Dashboard</h1>
            <p className="text-slate-500 dark:text-gray-300">Manage your account and review login attempts.</p>
          </div>
          <ThemeToggle showLabel />
        </div>

        {activePanel === "attempts" ? (
          <LoginAttempts />
        ) : (
          <ResetPasswordPanel currentPassword={userPassword} onSavePassword={handleSavePassword} />
        )}
      </main>
      <Notification
        open={notificationOpen}
        type={notificationType}
        message={notificationMessage}
        onClose={() => setNotificationOpen(false)}
        duration={2000}
      />
    </div>
  );
}
