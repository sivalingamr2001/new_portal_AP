import { HelpCircle } from 'lucide-react'

export function AmendmentSidebar() {
  return (
    <div className="space-y-4">
      <div className="bg-card border border-border rounded-xl p-4 shadow-sm text-xs space-y-3">
        <h3 className="font-bold text-foreground uppercase tracking-wider text-[11px] flex items-center gap-1">
          <HelpCircle size={13} className="text-primary" /> Amendment Process
        </h3>
        <ol className="space-y-2 list-decimal list-inside text-muted-foreground">
          <li>Select approved item lines from the table matrix viewports.</li>
          <li>Choose <span className="text-foreground font-semibold">"Amend Qty"</span> or <span className="text-foreground font-semibold">"Cancel"</span> contextually.</li>
          <li>Enter your updated structural quantities alongside targeted operational rationale fields.</li>
          <li>Submit details — system routing triggers auto-re-evaluation pipelines instantly.</li>
        </ol>
      </div>
    </div>
  )
}
