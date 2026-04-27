import { useEffect } from "react"
import { CheckCircle, XCircle } from "lucide-react"

interface Props {
  open: boolean
  type: "success" | "error"
  message: string
  onClose: () => void
  duration?: number
}

export default function Notification({ open, type, message, onClose, duration = 1000 }: Props) {
  useEffect(() => {
    if (!open) return
    const timer = setTimeout(() => {
      onClose()
    }, duration)
    return () => clearTimeout(timer)
  }, [open, duration, onClose])

  if (!open) return null

  return (
   <div
      className={`fixed top-20 right-4 z-50 flex items-center p-4 rounded-2xl shadow-xl border min-w-[320px] max-w-sm transition-all duration-300
      ${
        type === "success"
          ? "bg-gradient-to-r from-green-500 to-emerald-600 border-green-600"
          : "bg-gradient-to-r from-red-500 to-rose-600 border-red-600"
      }`}
    >
      <div className="mr-3">
        {type === "success" ? (
          <CheckCircle className="text-white w-6 h-6" />
        ) : (
          <XCircle className="text-white w-6 h-6" />
        )}
      </div>

      <div>
        <p className="text-lg font-semibold text-white">
          {type === "success" ? "Success" : "Error"}
        </p>
        <p className="text-md text-white/90 mt-1">{message}</p>
      </div>
    </div>
  )
}