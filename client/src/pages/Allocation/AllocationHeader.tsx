import { AlertTriangle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface AllocationHeaderProps {
  canSubmit: boolean
  loading: boolean
  error: Error | null
  submitForApproval: () => Promise<void>
}

export function AllocationHeader({
  canSubmit,
  loading,
  error,
  submitForApproval,
}: AllocationHeaderProps) {
  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex items-center justify-between rounded-xl border border-border bg-card px-6 py-2 shadow-sm">
        <div>
          <h2 className="text-md font-bold text-foreground">New BIN Allocation</h2>
          <p className="text-xs text-muted-foreground">
            Customer header details and item lines — only B3 header/line fields are saved on submit.
          </p>
        </div>
        <Button
          onClick={submitForApproval}
          disabled={!canSubmit}
          size="sm"
          className="text-xs font-semibold disabled:opacity-40"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 size-3.5 animate-spin" />
              Submitting...
            </>
          ) : (
            "Submit for Approval"
          )}
        </Button>
      </div>

      {/* Submit Error */}
      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-xs text-destructive">
          <div className="flex items-center gap-2">
            <AlertTriangle size={14} />
            <span className="font-medium">Submit failed:</span>
            {error.message}
          </div>
        </div>
      )}
    </div>
  )
}
