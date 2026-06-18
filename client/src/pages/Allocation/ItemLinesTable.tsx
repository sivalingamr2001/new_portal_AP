import { AlertTriangle, Loader2, Plus, Trash2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"
import type { Organization } from "@/api/allocationApi"
import type { LineItem } from "@/pages/Allocation"

interface ItemLinesTableProps {
  lines: LineItem[]
  addLine: () => void
  removeLine: (lineId: string) => void
  setLineOrganization: (lineId: string, orgCode: string) => void
  setLineItemCode: (lineId: string, code: string) => void
  resolveItemForLine: (lineId: string, orgId: number, itemCode: string) => Promise<void>
  blurLineItemCode: (lineId: string) => void
  updateLine: (lineId: string, updates: Partial<LineItem>) => void

  organizations: Organization[]
  orgSearchByLine: Record<string, string>
  setOrgSearchByLine: React.Dispatch<React.SetStateAction<Record<string, string>>>
  itemSearchByLine: Record<string, string>
  setItemSearchByLine: React.Dispatch<React.SetStateAction<Record<string, string>>>
  weekSearch: string
  setWeekSearch: (search: string) => void

  itemsHookLoading: boolean
  itemsHookData: { data: Array<{ inventoryItemId: number; itemCode: string; description: string }> } | undefined
  itemsHookExecute: (page: number, size: number, search: string) => Promise<any>

  filteredWeeks: string[]
  headerComplete: boolean
  allocationBasis: "customer" | "open"
  validLinesLength: number
}

function MetricsCell({ value }: { value: number | undefined }) {
  return (
    <span className="font-mono text-[11px] text-muted-foreground font-medium">
      {value?.toLocaleString() ?? "—"}
    </span>
  )
}

export function ItemLinesTable({
  lines,
  addLine,
  removeLine,
  setLineOrganization,
  setLineItemCode,
  resolveItemForLine,
  blurLineItemCode,
  updateLine,

  organizations,
  orgSearchByLine,
  setOrgSearchByLine,
  itemSearchByLine,
  setItemSearchByLine,
  weekSearch,
  setWeekSearch,

  itemsHookLoading,
  itemsHookData,
  itemsHookExecute,

  filteredWeeks,
  headerComplete,
  allocationBasis,
  validLinesLength,
}: ItemLinesTableProps) {
  return (
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
          onClick={addLine}
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
              <th className="p-2 w-28">ORG *</th>
              <th className="p-2">Item Code *</th>
              <th className="p-2 min-w-36">Description</th>
              <th className="p-2 w-32">Week *</th>
              <th className="p-2">OA Pend</th>
              <th className="p-2">OA Rsv</th>
              <th className="p-2">OA Picked</th>
              <th className="p-2">BIN Qty</th>
              <th className="p-2">BIN Rsv</th>
              <th className="p-2 w-20">Qty *</th>
              <th className="p-2">Target Date *</th>
              <th className="p-2 w-10"></th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line, idx) => (
              <tr
                key={line.id}
                className={`border-b border-border/60 ${line.isRunnerItem ? "bg-destructive/10" : ""}`}
              >
                <td className="p-2 text-center font-mono text-muted-foreground">{idx + 1}</td>

                {/* Org */}
                <td className="p-2">
                  <Combobox
                    value={line.organizationCode}
                    onValueChange={(value) => {
                      if (value === null) return
                      setLineOrganization(line.id, value)
                    }}
                  >
                    <ComboboxInput
                      className="h-8 bg-background border-border text-xs w-full"
                      placeholder="Org..."
                      value={orgSearchByLine[line.id] ?? ""}
                      onChange={(e) =>
                        setOrgSearchByLine((prev) => ({ ...prev, [line.id]: e.currentTarget.value }))
                      }
                    />
                    <ComboboxContent>
                      <ComboboxList>
                        {organizations
                          .filter((org) =>
                            org.organizationCode
                              .toLowerCase()
                              .includes((orgSearchByLine[line.id] ?? "").trim().toLowerCase())
                          )
                          .map((org) => (
                            <ComboboxItem key={org.organizationId} value={org.organizationCode}>
                              {org.organizationCode}
                            </ComboboxItem>
                          ))}
                        {organizations.filter((org) =>
                          org.organizationCode
                            .toLowerCase()
                            .includes((orgSearchByLine[line.id] ?? "").trim().toLowerCase())
                        ).length === 0 && (
                            <ComboboxItem value="" disabled>
                              No organizations found
                            </ComboboxItem>
                          )}
                      </ComboboxList>
                    </ComboboxContent>
                  </Combobox>
                </td>

                {/* Item Code */}
                <td className="p-2">
                  <Combobox
                    value={line.itemCode}
                    onValueChange={(value) => {
                      if (!value) {
                        setLineItemCode(line.id, "")
                        return
                      }
                      setLineItemCode(line.id, value)
                      if (line.organizationId) {
                        void resolveItemForLine(line.id, line.organizationId, value)
                      }
                    }}
                  >
                    <ComboboxInput
                      className="h-8 bg-background border-border font-mono text-xs uppercase w-40"
                      placeholder="Item code"
                      value={line.itemCode}
                      onChange={(e) => {
                        const value = e.currentTarget.value.toUpperCase()
                        setLineItemCode(line.id, value)
                        setItemSearchByLine((prev) => ({ ...prev, [line.id]: value }))
                        if (value.trim()) {
                          void itemsHookExecute(1, 10, value)
                        }
                      }}
                      onBlur={() => blurLineItemCode(line.id)}
                      disabled={!line.organizationId || line.loadingItem}
                    />
                    <ComboboxContent>
                      <ComboboxList>
                        {itemsHookLoading ? (
                          <ComboboxItem value="" disabled>
                            Loading...
                          </ComboboxItem>
                        ) : (itemsHookData?.data ?? []).filter((item) =>
                          item.itemCode
                            .toLowerCase()
                            .includes((itemSearchByLine[line.id] ?? "").trim().toLowerCase())
                        ).length === 0 ? (
                          <ComboboxEmpty>No items found</ComboboxEmpty>
                        ) : (
                          (itemsHookData?.data ?? [])
                            .filter((item) =>
                              item.itemCode
                                .toLowerCase()
                                .includes((itemSearchByLine[line.id] ?? "").trim().toLowerCase())
                            )
                            .map((item) => (
                              <ComboboxItem key={item.inventoryItemId} value={item.itemCode}>
                                <div className="flex flex-col text-left">
                                  <span className="font-medium">{item.itemCode}</span>
                                  <span className="text-[11px] text-muted-foreground">{item.description}</span>
                                </div>
                              </ComboboxItem>
                            ))
                        )}
                      </ComboboxList>
                    </ComboboxContent>
                  </Combobox>
                  {line.loadingItem && <Loader2 className="mt-1 size-3 animate-spin text-primary" />}
                </td>

                {/* Description */}
                <td className="p-2 text-muted-foreground max-w-[16rem] break-words whitespace-normal font-medium">
                  {line.description || "—"}
                </td>

                {/* Week */}
                <td className="p-2">
                  <Combobox
                    value={line.week}
                    onValueChange={(value) => {
                      if (value === null) return
                      updateLine(line.id, { week: value })
                    }}
                  >
                    <ComboboxInput
                      className="h-8 bg-background border-border text-xs w-full"
                      placeholder="Week"
                      value={weekSearch}
                      onChange={(e) => setWeekSearch(e.currentTarget.value)}
                    />
                    <ComboboxContent>
                      <ComboboxList>
                        {filteredWeeks.length === 0 ? (
                          <ComboboxItem value="" disabled>
                            No weeks found
                          </ComboboxItem>
                        ) : (
                          filteredWeeks.map((week) => (
                            <ComboboxItem key={week} value={week}>
                              {week}
                            </ComboboxItem>
                          ))
                        )}
                      </ComboboxList>
                    </ComboboxContent>
                  </Combobox>
                </td>

                {/* Metrics */}
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

                {/* Qty */}
                <td className="p-2">
                  <Input
                    type="number"
                    min={1}
                    value={line.quantity}
                    onChange={(e) =>
                      updateLine(line.id, {
                        quantity: e.target.value === "" ? "" : Number(e.target.value),
                      })
                    }
                    disabled={line.isRunnerItem}
                    className="h-8 bg-background border-border font-mono text-xs"
                    placeholder="Qty"
                  />
                </td>

                {/* Target Date */}
                <td className="p-2">
                  <Input
                    type="date"
                    value={line.targetDate}
                    onChange={(e) => updateLine(line.id, { targetDate: e.target.value })}
                    disabled={line.isRunnerItem}
                    className="h-8 bg-background border-border text-xs"
                  />
                </td>

                {/* Delete */}
                <td className="p-2">
                  <button
                    type="button"
                    onClick={() => removeLine(line.id)}
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

      {/* Line Errors */}
      {lines.some((l) => l.itemError) && (
        <div className="mt-3 space-y-1">
          {lines
            .filter((l) => l.itemError)
            .map((l) => (
              <p key={l.id} className="flex items-center gap-1.5 text-[11px] text-destructive">
                <AlertTriangle size={12} />
                Row {lines.indexOf(l) + 1}: {l.itemError}
              </p>
            ))}
        </div>
      )}

      {/* Validation Messages */}
      {!headerComplete && allocationBasis === "customer" && (
        <p className="mt-3 text-[11px] text-amber-600 dark:text-amber-400 font-medium animate-in fade-in">
          Complete all required customer header fields before submitting.
        </p>
      )}
      {headerComplete && validLinesLength === 0 && (
        <p className="mt-3 text-[11px] text-amber-600 dark:text-amber-400 font-medium animate-in fade-in">
          Add at least one valid item line (non-runner, with org, item, week, qty, and target date).
        </p>
      )}
    </div>
  )
}
