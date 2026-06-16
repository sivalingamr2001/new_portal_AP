import { AlertTriangle, ChevronRight, Loader2, Plus, Trash2 } from "lucide-react"

import { useState } from "react"

import { Loader } from "@/components/Loader"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useAllocationForm } from "@/hooks/useAllocationForm"

const fieldClass =
  "w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"

const labelClass = "text-xs font-medium text-muted-foreground block mb-1.5"

function MetricsCell({ value }: { value: number | undefined }) {
  return (
    <span className="font-mono text-[11px] text-muted-foreground font-medium">
      {value?.toLocaleString() ?? "—"}
    </span>
  )
}

export function AllocationScreen() {
  const form = useAllocationForm()
  const [customerDetailsOpen, setCustomerDetailsOpen] = useState(true)

  if (form.loadingInitial) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader />
      </div>
    )
  }

  return (
    <div className="space-y-6">
        <div className="flex items-center justify-between rounded-xl border border-border bg-card p-6 shadow-sm">
          <div>
            <h2 className="text-md font-bold text-foreground">New BIN Allocation</h2>
            <p className="text-xs text-muted-foreground">
              Customer header details and item lines — only B3 header/line fields are saved on submit.
            </p>
          </div>
          <Button
            onClick={form.submitForApproval}
            disabled={!form.canSubmit}
            className="text-xs font-semibold disabled:opacity-40"
          >
            {form.submitting ? (
              <>
                <Loader2 className="mr-2 size-3.5 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit for Approval"
            )}
          </Button>
        </div>

        {/* Header — customer details */}
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <div
            onClick={() => setCustomerDetailsOpen((prev) => !prev)}
            className="flex cursor-pointer items-center justify-between border-b border-border px-6 py-4 transition-colors hover:bg-muted/40"
          >
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Customer Details
              </h3>

              {!customerDetailsOpen && (
                <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
                  {form.selectedRegion && (
                    <span className="rounded-md bg-muted px-2 py-1 text-muted-foreground border border-border">
                      Region: {form.selectedRegion}
                    </span>
                  )}

                  {form.operatingUnit && (
                    <span className="rounded-md bg-muted px-2 py-1 text-muted-foreground border border-border">
                      OU: {form.operatingUnit.name}
                    </span>
                  )}

                  {form.billToCustomer && (
                    <span className="rounded-md bg-muted px-2 py-1 text-muted-foreground border border-border">
                      Bill To: {form.billToCustomer.customerName}
                    </span>
                  )}

                  {form.shipToCustomer && (
                    <span className="rounded-md bg-muted px-2 py-1 text-muted-foreground border border-border">
                      Ship To: {form.shipToCustomer.customerName}
                    </span>
                  )}

                  <span className="rounded-md bg-blue-500/10 px-2 py-1 text-blue-600 dark:text-blue-400 border border-blue-500/20 font-medium">
                    {form.allocationBasis === "customer"
                      ? "Customer Specific"
                      : "Open Pool"}
                  </span>
                </div>
              )}
            </div>

            <ChevronRight
              className={`h-5 w-5 text-muted-foreground transition-transform duration-200 ${
                customerDetailsOpen ? "rotate-90" : ""
              }`}
            />
          </div>

          {customerDetailsOpen && (
            <div className="p-6">
              <div className="mb-4">
                <Label className={labelClass}>Allocation Type</Label>
                <div className="flex w-fit gap-2 rounded-lg border border-border bg-muted p-1">
                  <button
                    type="button"
                    onClick={() => form.setAllocationBasis("customer")}
                    className={`rounded-md px-4 py-1.5 text-xs font-medium transition-all cursor-pointer ${
                      form.allocationBasis === "customer"
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Customer Specific
                  </button>
                  <button
                    type="button"
                    onClick={() => form.setAllocationBasis("open")}
                    className={`rounded-md px-4 py-1.5 text-xs font-medium transition-all cursor-pointer ${
                      form.allocationBasis === "open"
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Open Pool
                  </button>
                </div>
              </div>
              {form.allocationBasis === "customer" && (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
                  <div className="md:col-span-2">
                    <Label className={labelClass}>Region *</Label>
                    <Select
                      value={form.selectedRegion}
                      onValueChange={form.setSelectedRegion}
                    >
                      <SelectTrigger className={fieldClass}>
                        <SelectValue placeholder="Select region..." />
                      </SelectTrigger>
                      <SelectContent>
                        {form.regionNames.map((region) => (
                          <SelectItem key={region} value={region}>
                            {region}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="md:col-span-2">
                    <Label className={labelClass}>Sub Region *</Label>
                    {form.subRegionsForSelected.length > 1 ? (
                      <div className={`${fieldClass} min-h-9 text-slate-300`}>
                        {form.subRegionDisplay}
                      </div>
                    ) : (
                      <Input
                        readOnly
                        value={form.subRegionDisplay}
                        className={`${fieldClass} cursor-default`}
                        placeholder="Select region first..."
                      />
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <Label className={labelClass}>Operating Unit *</Label>
                    <Select
                      value={form.operatingUnit ? String(form.operatingUnit.organizationId) : ""}
                      onValueChange={(value) => {
                        const unit = form.operatingUnits.find(
                          (u) => String(u.organizationId) === value
                        )
                        form.setOperatingUnit(unit ?? null)
                      }}
                      disabled={!form.selectedRegion}
                    >
                      <SelectTrigger className={fieldClass}>
                        <SelectValue placeholder="Select operating unit..." />
                      </SelectTrigger>
                      <SelectContent>
                        {form.operatingUnits.map((unit) => (
                          <SelectItem
                            key={unit.organizationId}
                            value={String(unit.organizationId)}
                          >
                            {unit.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="md:col-span-3">
                    <Label className={labelClass}>Bill To Customer *</Label>
                    <Select
                      value={form.billToCustomer ? String(form.billToCustomer.customerId) : ""}
                      onValueChange={(value) => {
                        const customer = form.billToCustomers.find(
                          (c) => String(c.customerId) === value
                        )
                        form.setBillToCustomer(customer ?? null)
                      }}
                      disabled={!form.operatingUnit}
                    >
                      <SelectTrigger className={fieldClass}>
                        <SelectValue placeholder="Select bill-to customer..." />
                      </SelectTrigger>
                      <SelectContent>
                        {form.billToCustomers.map((customer) => (
                          <SelectItem
                            key={customer.customerId}
                            value={String(customer.customerId)}
                          >
                            {customer.customerName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="md:col-span-3">
                    <Label className={labelClass}>Ship To Customer *</Label>
                    <Select
                      value={form.shipToCustomer ? String(form.shipToCustomer.customerId) : ""}
                      onValueChange={(value) => {
                        const customer = form.shipToCustomers.find(
                          (c) => String(c.customerId) === value
                        )
                        form.setShipToCustomer(customer ?? null)
                      }}
                      disabled={!form.operatingUnit}
                    >
                      <SelectTrigger className={fieldClass}>
                        <SelectValue placeholder="Select ship-to customer..." />
                      </SelectTrigger>
                      <SelectContent>
                        {form.shipToCustomers.map((customer) => (
                          <SelectItem
                            key={customer.customerId}
                            value={String(customer.customerId)}
                          >
                            {customer.customerName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="md:col-span-3">
                    <Label className={labelClass}>Bill To Location *</Label>
                    <Select
                      value={
                        form.billToLocation
                          ? `${form.billToLocation.location}-${form.billToLocation.address1}`
                          : ""
                      }
                      onValueChange={(value) => {
                        const address = form.billToAddresses.find(
                          (a) => `${a.location}-${a.address1}` === value
                        )
                        form.setBillToLocation(address ?? null)
                      }}
                      disabled={!form.billToCustomer || form.billToAddresses.length === 0}
                    >
                      <SelectTrigger className={fieldClass}>
                        <SelectValue placeholder="Select location..." />
                      </SelectTrigger>
                      <SelectContent>
                        {form.billToAddresses.map((address) => (
                          <SelectItem
                            key={`${address.location}-${address.address1}`}
                            value={`${address.location}-${address.address1}`}
                          >
                            {address.location}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="md:col-span-3">
                    <Label className={labelClass}>Ship To Location *</Label>
                    <Select
                      value={
                        form.shipToLocation
                          ? `${form.shipToLocation.location}-${form.shipToLocation.address1}`
                          : ""
                      }
                      onValueChange={(value) => {
                        const address = form.shipToAddresses.find(
                          (a) => `${a.location}-${a.address1}` === value
                        )
                        form.setShipToLocation(address ?? null)
                      }}
                      disabled={!form.shipToCustomer || form.shipToAddresses.length === 0}
                    >
                      <SelectTrigger className={fieldClass}>
                        <SelectValue placeholder="Select location..." />
                      </SelectTrigger>
                      <SelectContent>
                        {form.shipToAddresses.map((address) => (
                          <SelectItem
                            key={`${address.location}-${address.address1}`}
                            value={`${address.location}-${address.address1}`}
                          >
                            {address.location}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="md:col-span-3">
                    <Label className={labelClass}>Bill To Address</Label>
                    <div className="min-h-[72px] rounded-lg border border-border bg-background px-3 py-2 text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap break-words">
                      {form.billToLocation
                        ? form.formatAddress(form.billToLocation)
                        : "Select a Bill To location"}
                    </div>
                  </div>

                  <div className="md:col-span-3">
                    <Label className={labelClass}>Ship To Address</Label>
                    <div className="min-h-[72px] rounded-lg border border-border bg-background px-3 py-2 text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap break-words">
                      {form.shipToLocation
                        ? form.formatAddress(form.shipToLocation)
                        : "Select a Ship To location"}
                    </div>
                  </div>

                  <div className="md:col-span-6">
                    <Label className={labelClass}>Remarks</Label>
                    <Textarea
                      value={form.remarks}
                      onChange={(e) => form.setRemarks(e.target.value)}
                      placeholder="Optional header remarks (saved to JAN_B3_HEADER.REMARKS)"
                      className={`${fieldClass} min-h-20 resize-none`}
                      maxLength={250}
                    />
                  </div>
                </div>
              )}
              {form.allocationBasis === "open" && (
                <div>
                  <Label className={labelClass}>Remarks</Label>
                  <Textarea
                    value={form.remarks}
                    onChange={(e) => form.setRemarks(e.target.value)}
                    placeholder="Enter remarks for Open Pool allocation"
                    className={`${fieldClass} min-h-24 resize-none`}
                    maxLength={250}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Item lines */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Item Lines
              </h3>
              <p className="mt-1 text-[11px] text-muted-foreground/80">
                Metrics and week are UI-only. Saved: organization, item, quantity, target date.
              </p>
            </div>
            <button
              type="button"
              onClick={form.addLine}
              className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 cursor-pointer"
            >
              <Plus size={14} /> Add Row
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-left text-xs">
              <thead>
                <tr className="border-b border-border text-[10px] uppercase tracking-wider text-muted-foreground">
                  <th className="p-2 w-8">#</th>
                  <th className="p-2 min-w-32">Organization *</th>
                  <th className="p-2 min-w-28">Item Code *</th>
                  <th className="p-2 min-w-36">Description</th>
                  <th className="p-2">OA Pend</th>
                  <th className="p-2">OA Rsv</th>
                  <th className="p-2">OA Picked</th>
                  <th className="p-2">BIN Qty</th>
                  <th className="p-2">BIN Rsv</th>
                  <th className="p-2 min-w-24">Week *</th>
                  <th className="p-2 min-w-20">Qty *</th>
                  <th className="p-2 min-w-28">Target Date *</th>
                  <th className="p-2 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {form.lines.map((line, idx) => (
                  <tr
                    key={line.id}
                    className={`border-b border-border/60 ${line.isRunnerItem ? "bg-destructive/10" : ""}`}
                  >
                    <td className="p-2 text-center font-mono text-muted-foreground">{idx + 1}</td>
                    <td className="p-2">
                      <Select
                        value={line.organizationId ? String(line.organizationId) : ""}
                        onValueChange={(value) => form.setLineOrganization(line.id, value)}
                      >
                        <SelectTrigger className="h-8 bg-background border-border text-xs">
                          <SelectValue placeholder="Org..." />
                        </SelectTrigger>
                        <SelectContent>
                          {form.organizations.map((org) => (
                            <SelectItem
                              key={org.organizationId}
                              value={String(org.organizationId)}
                            >
                              {org.organizationCode}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="p-2">
                      <Input
                        value={line.itemCode}
                        onChange={(e) => form.setLineItemCode(line.id, e.target.value)}
                        onBlur={() => form.blurLineItemCode(line.id)}
                        disabled={!line.organizationId || line.loadingItem}
                        placeholder="Item code"
                        className="h-8 bg-background border-border font-mono text-xs uppercase"
                      />
                      {line.loadingItem && (
                        <Loader2 className="mt-1 size-3 animate-spin text-primary" />
                      )}
                    </td>
                    <td className="p-2 text-muted-foreground">{line.description || "—"}</td>
                    <td className="p-2">
                      <MetricsCell value={line.metrics?.oaPendingQuantity} />
                    </td>
                    <td className="p-2">
                      <MetricsCell value={line.metrics?.oaRsvQty} />
                    </td>
                    <td className="p-2">
                      <MetricsCell value={line.metrics?.oaPickedQty} />
                    </td>
                    <td className="p-2">
                      <MetricsCell value={line.metrics?.binQty} />
                    </td>
                    <td className="p-2">
                      <MetricsCell value={line.metrics?.binRsvQty} />
                    </td>
                    <td className="p-2">
                      <Select
                        value={line.week}
                        onValueChange={(value) => form.updateLine(line.id, { week: value })}
                      >
                        <SelectTrigger className="h-8 bg-background border-border text-xs">
                          <SelectValue placeholder="Week" />
                        </SelectTrigger>
                        <SelectContent>
                          {form.weekOptions.map((week) => (
                            <SelectItem key={week} value={week}>
                              {week}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="p-2">
                      <Input
                        type="number"
                        min={1}
                        value={line.quantity}
                        onChange={(e) =>
                          form.updateLine(line.id, {
                            quantity: e.target.value === "" ? "" : Number(e.target.value),
                          })
                        }
                        disabled={line.isRunnerItem}
                        className="h-8 bg-background border-border font-mono text-xs"
                        placeholder="Qty"
                      />
                    </td>
                    <td className="p-2">
                      <Input
                        type="date"
                        value={line.targetDate}
                        onChange={(e) =>
                          form.updateLine(line.id, { targetDate: e.target.value })
                        }
                        disabled={line.isRunnerItem}
                        className="h-8 bg-background border-border text-xs"
                      />
                    </td>
                    <td className="p-2">
                      <button
                        type="button"
                        onClick={() => form.removeLine(line.id)}
                        className="p-1.5 text-muted-foreground/60 transition-colors hover:text-destructive cursor-pointer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {form.lines.some((l) => l.itemError) && (
            <div className="mt-3 space-y-1">
              {form.lines
                .filter((l) => l.itemError)
                .map((l) => (
                  <p key={l.id} className="flex items-center gap-1.5 text-[11px] text-destructive">
                    <AlertTriangle size={12} />
                    Row {form.lines.indexOf(l) + 1}: {l.itemError}
                  </p>
                ))}
            </div>
          )}

          {!form.headerComplete && form.allocationBasis === "customer" && (
            <p className="mt-3 text-[11px] text-amber-600 dark:text-amber-400 font-medium">
              Complete all required customer header fields before submitting.
            </p>
          )}
          {form.headerComplete && form.validLines.length === 0 && (
            <p className="mt-3 text-[11px] text-amber-600 dark:text-amber-400 font-medium">
              Add at least one valid item line (non-runner, with org, item, week, qty, and target date).
            </p>
          )}
        </div>
    </div>
  )
}
