import type { AllocationType } from "../types"

interface Props {
  value: AllocationType
  onChange: (type: AllocationType) => void
}

export function AllocationTypeToggle({ value, onChange }: Props) {
  return (
    <div>
      <label className="text-xs font-medium text-slate-400 block mb-2 uppercase tracking-wider">
        Allocation Type
      </label>
      <div className="flex gap-0 bg-slate-950 border border-slate-800 rounded-lg overflow-hidden w-fit">
        <button
          type="button"
          onClick={() => onChange("customer")}
          className={`text-xs font-semibold px-5 py-2 transition-all ${
            value === "customer"
              ? "bg-blue-600 text-white shadow-inner"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
          }`}
        >
          Customer Specific
        </button>
        <button
          type="button"
          onClick={() => onChange("open")}
          className={`text-xs font-semibold px-5 py-2 transition-all ${
            value === "open"
              ? "bg-blue-600 text-white shadow-inner"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
          }`}
        >
          Open Pool
        </button>
      </div>
    </div>
  )
}
