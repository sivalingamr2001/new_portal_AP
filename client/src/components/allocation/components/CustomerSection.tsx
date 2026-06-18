import type { ReactNode } from "react"
import type { AllocationFormState } from "../types"
import type { Region, Customer, Employee } from "@/api/allocationApi"

interface Props {
  form: AllocationFormState
  regionOptions: Region[]
  subRegionOptions: Region[]
  billToCustomers: Customer[]
  shipToCustomers: Customer[]
  employees: Employee[]
  loading: {
    regions: boolean
    billTo: boolean
    shipTo: boolean
    employees: boolean
  }
  onRegionChange: (r: string) => void
  onSubRegionChange: (sr: string) => void
  onField: <K extends keyof AllocationFormState>(key: K, val: AllocationFormState[K]) => void
}

function SelectField({
  label,
  required,
  value,
  onChange,
  placeholder,
  disabled,
  loading: isLoading,
  children,
}: {
  label: string
  required?: boolean
  value: string
  onChange: (v: string) => void
  placeholder: string
  disabled?: boolean
  loading?: boolean
  children: ReactNode
}) {
  return (
    <div>
      <label className="text-xs font-medium text-slate-400 block mb-1.5">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled || isLoading}
          className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed appearance-none pr-8"
        >
          <option value="">{isLoading ? "Loading…" : placeholder}</option>
          {children}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center">
          <svg className="w-3.5 h-3.5 text-slate-500" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
            />
          </svg>
        </div>
      </div>
    </div>
  )
}

export function CustomerSection({
  form,
  regionOptions,
  subRegionOptions,
  billToCustomers,
  shipToCustomers,
  employees,
  loading,
  onRegionChange,
  onSubRegionChange,
  onField,
}: Props) {
  return (
    <div className="space-y-4 rounded-2xl border border-border bg-card p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SelectField
          label="Region"
          required
          value={form.region}
          onChange={onRegionChange}
          placeholder="Select region…"
          loading={loading.regions}
        >
          {regionOptions.map((region) => (
            <option key={region.region} value={region.region}>
              {region.region}
            </option>
          ))}
        </SelectField>

        <SelectField
          label="Sub-Region"
          required
          value={form.subRegion}
          onChange={onSubRegionChange}
          placeholder="Select sub-region…"
          disabled={!form.region}
        >
          {subRegionOptions.map((region) => (
            <option key={region.subRegion} value={region.subRegion}>
              {region.subRegion}
            </option>
          ))}
        </SelectField>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SelectField
          label="Bill-To Customer"
          required
          value={form.billToCustomerId?.toString() ?? ""}
          onChange={(value) => onField("billToCustomerId", value ? Number(value) : null)}
          placeholder="Select bill-to customer…"
          disabled={!form.subRegion}
          loading={loading.billTo}
        >
          {billToCustomers.map((customer) => (
            <option key={customer.customerId} value={customer.customerId}>
              {customer.customerName}
            </option>
          ))}
        </SelectField>

        <SelectField
          label="Ship-To Customer"
          value={form.shipToCustomerId?.toString() ?? ""}
          onChange={(value) => onField("shipToCustomerId", value ? Number(value) : null)}
          placeholder="Same as bill-to (optional)"
          disabled={!form.subRegion}
          loading={loading.shipTo}
        >
          <option value="">No selection</option>
          {shipToCustomers.map((customer) => (
            <option key={customer.customerId} value={customer.customerId}>
              {customer.customerName}
            </option>
          ))}
        </SelectField>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SelectField
          label="Prepared By"
          required
          value={form.preparedBy}
          onChange={(value) => onField("preparedBy", value)}
          placeholder="Select employee…"
          disabled={!form.region}
          loading={loading.employees}
        >
          {employees.map((employee) => (
            <option key={employee.employeeNumber} value={employee.employeeNumber}>
              {employee.lastName} ({employee.employeeNumber})
            </option>
          ))}
        </SelectField>
      </div>
    </div>
  )
}
