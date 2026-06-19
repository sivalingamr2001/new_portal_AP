import { HelpCircle } from "lucide-react"

export function AmendmentSidebar() {
  return (
    <div className="space-y-4">
      <div className="space-y-3 rounded-xl border border-border bg-card p-4 text-xs shadow-sm">
        <h3 className="flex items-center gap-1 text-[11px] font-bold tracking-wider text-foreground uppercase">
          <HelpCircle size={13} className="text-primary" /> Amendment Process
        </h3>
        <ol className="list-inside list-decimal space-y-2 text-muted-foreground">
          <li>Select approved item lines from the table matrix viewports.</li>
          <li>
            Choose{" "}
            <span className="font-semibold text-foreground">"Amend Qty"</span>{" "}
            or <span className="font-semibold text-foreground">"Cancel"</span>{" "}
            contextually.
          </li>
          <li>
            Enter your updated structural quantities alongside targeted
            operational rationale fields.
          </li>
          <li>
            Submit details — system routing triggers auto-re-evaluation
            pipelines instantly.
          </li>
        </ol>
      </div>
    </div>
  )
}
