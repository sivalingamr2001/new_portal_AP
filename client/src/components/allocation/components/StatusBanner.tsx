import { AlertTriangle, CheckCircle, Loader2, X } from "lucide-react"
import type { SubmitStatus } from "../types"

interface Props {
  status: SubmitStatus
  onDismiss: () => void
}

const CONFIG = {
  success: {
    bg: "bg-emerald-950 border-emerald-900/40",
    text: "text-emerald-300",
    Icon: CheckCircle,
  },
  error: {
    bg: "bg-red-950 border-red-900/40",
    text: "text-red-300",
    Icon: AlertTriangle,
  },
  loading: {
    bg: "bg-blue-950 border-blue-900/40",
    text: "text-blue-300",
    Icon: Loader2,
  },
} as const

export function StatusBanner({ status, onDismiss }: Props) {
  if (status.type === "idle") return null

  const cfg = CONFIG[status.type as keyof typeof CONFIG]
  const IconComp = cfg.Icon

  return (
    <div
      className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm ${cfg.bg} ${cfg.text}`}
      role="alert"
    >
      <IconComp
        size={15}
        className={`flex-shrink-0 ${status.type === "loading" ? "animate-spin" : ""}`}
      />
      <span className="flex-1 text-xs font-medium">
        {status.type === "loading" ? "Submitting allocation…" : status.message}
      </span>
      {status.type !== "loading" && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="opacity-60 transition-opacity hover:opacity-100"
        >
          <X size={14} />
        </button>
      )}
    </div>
  )
}
