import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

export type RequestStatus =
  | "Submitted"
  | "PendingWithHod"
  | "PendingWithIt"
  | "HodApproved"
  | "ItApproved"
  | "HodRejected"
  | "ItRejected"
  | "Revoked"
  | "Expired"

interface BpfProgressProps {
  status: RequestStatus
}

const steps = [
  { key: "Submitted", label: "Submitted" },
  { key: "HOD", label: "HOD Review" },
  { key: "IT", label: "IT Review" },
  { key: "Granted", label: "Access Granted" },
]

export function AccessRequestBpf({ status }: BpfProgressProps) {
  const currentStep = (() => {
    switch (status) {
      case "Submitted":
      case "PendingWithHod":
        return 1

      case "HodApproved":
      case "PendingWithIt":
        return 2

      case "ItApproved":
        return 3

      default:
        return 1
    }
  })()

  const isRejected = status === "HodRejected" || status === "ItRejected"

  const progress = currentStep === 1 ? 33 : currentStep === 2 ? 66 : 100

  return (
    <div className="shrink-0 rounded-2xl">
      <div className="mb-2 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs tracking-[0.25em] text-muted-foreground uppercase">
            Current Status
          </p>
        </div>

        <span
          className={cn(
            "rounded-full px-3 py-1 text-xs font-semibold",
            isRejected
              ? "bg-red-100 text-red-700"
              : "bg-amber-100 text-amber-700"
          )}
        >
          {status}
        </span>
      </div>

      <div className="relative">
        {/* Background Line */}
        <div className="absolute top-4 left-0 h-1 w-full rounded-full bg-slate-200" />

        {/* Progress Line */}
        <div
          className={cn(
            "absolute top-4 left-0 h-1 rounded-full transition-all",
            isRejected ? "bg-red-500" : "bg-emerald-500"
          )}
          style={{ width: `${progress}%` }}
        />

        <div className="relative flex justify-between">
          {steps.map((step, index) => {
            const stepNo = index + 1

            const completed = stepNo < currentStep
            const current = stepNo === currentStep

            return (
              <div key={step.key} className="flex flex-col items-center">
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full border-2 bg-white text-sm",
                    completed && "border-emerald-500 bg-emerald-500 text-white",
                    current && "border-primary text-primary",
                    !completed && !current && "border-slate-300 text-slate-400"
                  )}
                >
                  {completed ? (
                    <Check size={18} />
                  ) : current ? (
                    <div className="h-3 w-3 rounded-full bg-primary" />
                  ) : (
                    stepNo
                  )}
                </div>

                <p className="mt-2 text-xs font-semibold">{step.label}</p>

                <p className="mt-0.5 text-xs text-muted-foreground">
                  {completed
                    ? "Completed"
                    : current
                      ? "In Progress"
                      : "Pending"}
                </p>
              </div>
            )
          })}
        </div>
      </div>

      {(status === "HodRejected" || status === "ItRejected") && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-2 text-xs text-red-700">
          Request has been rejected.
        </div>
      )}

      {status === "Revoked" && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs">
          Access has been revoked.
        </div>
      )}

      {status === "Expired" && (
        <div className="rounded-xl border border-orange-200 bg-orange-50 p-2 text-xs text-orange-700">
          Access has expired.
        </div>
      )}
    </div>
  )
}
