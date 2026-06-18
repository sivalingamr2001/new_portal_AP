import React from "react"
import { Loader2 } from "lucide-react"
import { AllocationTypeToggle } from "./AllocationTypeToggle"
import { CustomerSection } from "./CustomerSection"
import { LinesTable } from "./LinesTable"
import { StatusBanner } from "./StatusBanner"
import type { useAllocationForm } from "../hooks/useAllocationForm"

type HookReturn = ReturnType<typeof useAllocationForm>

interface Props {
  hook: HookReturn
}

export function AllocationForm({ hook }: Props) {
  const {
    form,
    regionOptions,
    subRegionOptions,
    billToCustomers,
    shipToCustomers,
    employees,
    organizations,
    loading,
    submitStatus,
    dismissStatus,
    setAllocationType,
    setRegion,
    setSubRegion,
    setField,
    addLine,
    removeLine,
    updateLine,
    selectItem,
    handleSubmit,
    resetForm,
  } = hook

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl flex flex-col gap-6">
      {/* ── Form header ─────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-slate-100">New BIN Allocation</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Forecast stock commitment — allocate to a specific customer or open pool.
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={resetForm}
            className="text-xs text-slate-400 hover:text-slate-200 px-3 py-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 transition-all"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading.submitting}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-900 disabled:text-blue-500 text-white text-xs font-semibold px-4 py-1.5 rounded-lg shadow-lg shadow-blue-600/10 transition-all"
          >
            {loading.submitting ? (
              <Loader2 size={13} className="animate-spin" />
            ) : null}
            Submit for Approval
          </button>
        </div>
      </div>

      {/* ── Status banner ────────────────────────────────────────── */}
      <StatusBanner status={submitStatus} onDismiss={dismissStatus} />

      {/* ── Allocation type toggle ───────────────────────────────── */}
      <AllocationTypeToggle value={form.allocationType} onChange={setAllocationType} />

      {/* ── Customer fields (only for customer-specific) ─────────── */}
      {form.allocationType === "customer" && (
        <CustomerSection
          form={form}
          regionOptions={regionOptions}
          subRegionOptions={subRegionOptions}
          billToCustomers={billToCustomers}
          shipToCustomers={shipToCustomers}
          employees={employees}
          loading={{
            regions: loading.regions,
            billTo: loading.billTo,
            shipTo: loading.shipTo,
            employees: loading.employees,
          }}
          onRegionChange={setRegion}
          onSubRegionChange={setSubRegion}
          onField={setField}
        />
      )}

      {/* ── Remarks ─────────────────────────────────────────────── */}
      <div>
        <label className="text-xs font-medium text-slate-400 block mb-1.5">
          Remarks <span className="text-slate-600">(optional)</span>
        </label>
        <textarea
          rows={2}
          value={form.remarks}
          onChange={(e) => setField("remarks", e.target.value)}
          placeholder="Internal notes about this allocation…"
          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 resize-none"
        />
      </div>

      {/* ── Divider ──────────────────────────────────────────────── */}
      <div className="border-t border-slate-800/70" />

      {/* ── Item lines ───────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Item Lines
          </h3>
          <span className="text-[11px] text-slate-500">
            {form.lines.filter((l) => l.inventoryItemId).length} of {form.lines.length} filled
          </span>
        </div>
        <LinesTable
          lines={form.lines}
          organizations={organizations}
          onAdd={addLine}
          onRemove={removeLine}
          onUpdate={updateLine}
          onSelect={selectItem}
        />
      </div>
    </div>
  )
}
