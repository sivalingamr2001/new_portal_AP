import type { InventoryItem, OperatingUnit } from "@/api/allocationApi"
import { Loader2, Search, Trash2 } from "lucide-react"
import { useEffect, useRef } from "react"
import type { FormLineItem } from "../types"

interface Props {
  index: number
  line: FormLineItem
  organizations: OperatingUnit[]
  /** Live search results for this row's current query */
  searchResults: InventoryItem[]
  searching: boolean
  canRemove: boolean
  onUpdate: (key: string, patch: Partial<FormLineItem>) => void
  onSelect: (key: string, item: InventoryItem) => void
  onRemove: (key: string) => void
  onSearchQueryChange: (key: string, query: string) => void
}

export function LineRow({
  index,
  line,
  organizations,
  searchResults,
  searching,
  canRemove,
  onUpdate,
  onSelect,
  onRemove,
  onSearchQueryChange,
}: Props) {
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        onUpdate(line._key, { searchState: "idle" })
      }
    }
    if (line.searchState === "searching") {
      document.addEventListener("mousedown", handler)
    }
    return () => document.removeEventListener("mousedown", handler)
  }, [line.searchState, line._key, onUpdate])

  return (
    <div className="group grid grid-cols-12 items-start gap-2 rounded-lg border border-slate-800/50 bg-slate-950/50 p-2.5">
      {/* Row index */}
      <div className="col-span-1 flex items-center justify-center pt-2">
        <span className="w-5 text-center font-mono text-xs text-slate-500 select-none">
          {index + 1}
        </span>
      </div>

      {/* Item Code — inline search */}
      <div className="relative col-span-4" ref={dropdownRef}>
        <div className="relative">
          <Search
            size={12}
            className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-slate-600"
          />
          {searching && (
            <Loader2
              size={12}
              className="absolute top-1/2 right-2.5 -translate-y-1/2 animate-spin text-blue-400"
            />
          )}
          <input
            type="text"
            placeholder="Search item code…"
            value={
              line.searchState === "searching"
                ? line.searchQuery
                : line.itemCode || ""
            }
            onFocus={() =>
              onUpdate(line._key, {
                searchState: "searching",
                searchQuery: line.itemCode || "",
              })
            }
            onChange={(e) => {
              onSearchQueryChange(line._key, e.target.value)
            }}
            className="w-full rounded-md border border-slate-800 bg-slate-950 py-1.5 pr-6 pl-7 text-xs text-slate-200 placeholder-slate-600 focus:border-blue-500 focus:outline-none"
          />
        </div>

        {/* Search dropdown */}
        {line.searchState === "searching" && (
          <div className="absolute top-full right-0 left-0 z-50 mt-1 overflow-hidden rounded-lg border border-slate-700 bg-slate-900 shadow-2xl">
            {searching && (
              <div className="p-2 text-center text-xs text-slate-500">
                Searching…
              </div>
            )}
            {!searching && searchResults.length === 0 && (
              <div className="p-2 text-center text-xs text-slate-500">
                No items found
              </div>
            )}
            {!searching &&
              searchResults.map((item) => (
                <button
                  key={item.inventoryItemId}
                  type="button"
                  onClick={() => onSelect(line._key, item)}
                  className="w-full px-3 py-2 text-left transition-colors hover:bg-slate-800"
                >
                  <div className="font-mono text-xs font-bold text-blue-400">
                    {item.itemCode}
                  </div>
                  <div className="truncate text-[11px] text-slate-400">
                    {item.description}
                  </div>
                </button>
              ))}
          </div>
        )}
      </div>

      {/* Description — read-only */}
      <div className="col-span-3">
        <input
          type="text"
          value={line.description}
          readOnly
          tabIndex={-1}
          placeholder="— select item first"
          className="w-full cursor-not-allowed rounded-md border border-slate-800/40 bg-slate-900/30 px-2.5 py-1.5 text-xs text-slate-500 placeholder-slate-700 focus:outline-none"
        />
      </div>

      {/* Organization */}
      <div className="col-span-2">
        <select
          value={line.organizationId?.toString() ?? ""}
          onChange={(e) =>
            onUpdate(line._key, {
              organizationId: e.target.value ? Number(e.target.value) : null,
            })
          }
          className="w-full appearance-none rounded-md border border-slate-800 bg-slate-950 px-2 py-1.5 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
        >
          <option value="">Org…</option>
          {organizations.map((o) => (
            <option key={o.organizationId} value={o.organizationId}>
              {o.name}
            </option>
          ))}
        </select>
      </div>

      {/* Quantity */}
      <div className="col-span-1">
        <input
          type="number"
          min={1}
          placeholder="Qty"
          value={line.b3Quantity}
          onChange={(e) => onUpdate(line._key, { b3Quantity: e.target.value })}
          className="w-full rounded-md border border-slate-800 bg-slate-950 px-2 py-1.5 text-right font-mono text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
        />
      </div>

      {/* Target Date + Remove */}
      <div className="col-span-1 flex items-center gap-1">
        <input
          type="date"
          value={line.targetDate}
          onChange={(e) => onUpdate(line._key, { targetDate: e.target.value })}
          className="w-full rounded-md border border-slate-800 bg-slate-950 px-1.5 py-1.5 text-[11px] text-slate-200 focus:border-blue-500 focus:outline-none"
        />
        <button
          type="button"
          onClick={() => onRemove(line._key)}
          disabled={!canRemove}
          aria-label="Remove line"
          className="flex-shrink-0 p-1.5 text-slate-700 transition-colors hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-30"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  )
}
