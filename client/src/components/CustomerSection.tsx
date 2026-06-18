import React from "react"
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
  children: React.ReactNode
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
          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed appearance-none pr-8"
        >
          <option value="">{isLoading ? "Loading…" : placeholder}</option>
          {children}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center">
          <svg className="w-3.5 h-3.5 text-slate-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" />
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
    <div className="space-y-4">
      {/* Row 1: Region + Sub-Region */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SelectField
          label="Region"
          required
          value={form.region}
          onChange={onRegionChange}
          placeholder="Select region…"
          loading={loading.regions}
        >
          {regionOptions.map((r) => (
            <option key={r.region} value={r.region}>
              {r.region}
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
          {subRegionOptions.map((r) => (
            <option key={r.subRegion} value={r.subRegion}>
              {r.subRegion}
            </option>
          ))}
        </SelectField>
      </div>

      {/* Row 2: Bill-To + Ship-To */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SelectField
          label="Bill-To Customer"
          required
          value={form.billToCustomerId?.toString() ?? ""}
          onChange={(v) => onField("billToCustomerId", v ? Number(v) : null)}
          placeholder="Select bill-to customer…"
          disabled={!form.subRegion}
          loading={loading.billTo}
        >
          {billToCustomers.map((c) => (
            <option key={c.customerId} value={c.customerId}>
              {c.customerName}
            </option>
          ))}
        </SelectField>

        <SelectField
          label="Ship-To Customer"
          value={form.shipToCustomerId?.toString() ?? ""}
          onChange={(v) => onField("shipToCustomerId", v ? Number(v) : null)}
          placeholder="Same as bill-to (optional)"
          disabled={!form.subRegion}
          loading={loading.shipTo}
        >
          {shipToCustomers.map((c) => (
            <option key={c.customerId} value={c.customerId}>
              {c.customerName}
            </option>
          ))}
        </SelectField>
      </div>

      {/* Row 3: Prepared-By */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SelectField
          label="Prepared By"
          required
          value={form.preparedBy}
          onChange={(v) => onField("preparedBy", v)}
          placeholder="Select employee…"
          disabled={!form.region}
          loading={loading.employees}
        >
          {employees.map((e) => (
            <option key={e.employeeNumber} value={e.employeeNumber}>
              {e.lastName} ({e.employeeNumber})
            </option>
          ))}
        </SelectField>
      </div>
    </div>
  )
}
