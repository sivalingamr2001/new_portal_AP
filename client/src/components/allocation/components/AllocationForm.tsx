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
    <div className="flex flex-col gap-6 rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
      {/* ── Form header ─────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-slate-100">
            New BIN Allocation
          </h2>
          <p className="mt-0.5 text-xs text-slate-400">
            Forecast stock commitment — allocate to a specific customer or open
            pool.
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={resetForm}
            className="rounded-lg border border-slate-800 px-3 py-1.5 text-xs text-slate-400 transition-all hover:bg-slate-800 hover:text-slate-200"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading.submitting}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white shadow-lg shadow-blue-600/10 transition-all hover:bg-blue-500 disabled:bg-blue-900 disabled:text-blue-500"
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
      <AllocationTypeToggle
        value={form.allocationType}
        onChange={setAllocationType}
      />

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
        <label className="mb-1.5 block text-xs font-medium text-slate-400">
          Remarks <span className="text-slate-600">(optional)</span>
        </label>
        <textarea
          rows={2}
          value={form.remarks}
          onChange={(e) => setField("remarks", e.target.value)}
          placeholder="Internal notes about this allocation…"
          className="w-full resize-none rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:border-blue-500 focus:outline-none"
        />
      </div>

      {/* ── Divider ──────────────────────────────────────────────── */}
      <div className="border-t border-slate-800/70" />

      {/* ── Item lines ───────────────────────────────────────────── */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-xs font-semibold tracking-wider text-slate-300 uppercase">
            Item Lines
          </h3>
          <span className="text-[11px] text-slate-500">
            {form.lines.filter((l) => l.inventoryItemId).length} of{" "}
            {form.lines.length} filled
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
