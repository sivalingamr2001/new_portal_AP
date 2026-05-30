import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { ReactNode } from "react"

type EmployeeSectionProps = {
  userId: number
  name: string
  email?: string | null
  departmentName?: string | null
  hodName?: string | null
  onUserIdChange?: (userId: number) => void
}

export function EmployeeSection({
  userId,
  name,
  email,
  departmentName,
  hodName,
  onUserIdChange,
}: EmployeeSectionProps) {
  return (
    <section className="space-y-4 rounded-md border border-border bg-card p-4">
      <h3 className="text-sm font-semibold">Employee Information</h3>
      <div className="grid gap-4 md:grid-cols-3">
        <Field label="Employee ID">
          <Input
            value={userId || ""}
            onChange={(event) => onUserIdChange?.(Number(event.target.value))}
          />
        </Field>
        <Field label="Employee Name">
          <Input readOnly value={name} />
        </Field>
        <Field label="Email">
          <Input readOnly value={email ?? ""} />
        </Field>
        <Field label="Department">
          <Input readOnly value={departmentName ?? ""} />
        </Field>
        <Field label="Department HOD">
          <Input readOnly value={hodName ?? ""} />
        </Field>
      </div>
    </section>
  )
}

function Field({
  children,
  label,
}: {
  children: ReactNode
  label: string
}) {
  return (
    <div className="space-y-2">
      <Label className="text-xs font-semibold text-muted-foreground">{label}</Label>
      {children}
    </div>
  )
}
