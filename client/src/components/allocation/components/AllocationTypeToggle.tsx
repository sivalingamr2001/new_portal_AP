import type { AllocationType } from "../types"

interface Props {
  value: AllocationType
  onChange: (type: AllocationType) => void
}

export function AllocationTypeToggle({ value, onChange }: Props) {
  return (
    <div>
      <label className="mb-2 block text-xs font-medium tracking-wider text-slate-400 uppercase">
        Allocation Type
      </label>
      <div className="flex w-fit gap-0 overflow-hidden rounded-lg border border-slate-800 bg-slate-950">
        <button
          type="button"
          onClick={() => onChange("customer")}
          className={`px-5 py-2 text-xs font-semibold transition-all ${
            value === "customer"
              ? "bg-blue-600 text-white shadow-inner"
              : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
          }`}
        >
          Customer Specific
        </button>
        <button
          type="button"
          onClick={() => onChange("open")}
          className={`px-5 py-2 text-xs font-semibold transition-all ${
            value === "open"
              ? "bg-blue-600 text-white shadow-inner"
              : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
          }`}
        >
          Open Pool
        </button>
      </div>
    </div>
  )
}
