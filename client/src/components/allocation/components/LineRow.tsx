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
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onUpdate(line._key, { searchState: "idle" })
      }
    }
    if (line.searchState === "searching") {
      document.addEventListener("mousedown", handler)
    }
    return () => document.removeEventListener("mousedown", handler)
  }, [line.searchState, line._key, onUpdate])

  return (
    <div className="grid grid-cols-12 gap-2 items-start bg-slate-950/50 p-2.5 rounded-lg border border-slate-800/50 group">
      {/* Row index */}
      <div className="col-span-1 flex items-center justify-center pt-2">
        <span className="text-xs text-slate-500 font-mono w-5 text-center select-none">
          {index + 1}
        </span>
      </div>

      {/* Item Code — inline search */}
      <div className="col-span-4 relative" ref={dropdownRef}>
        <div className="relative">
          <Search
            size={12}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none"
          />
          {searching && (
            <Loader2
              size={12}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-blue-400 animate-spin"
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
            className="w-full bg-slate-950 border border-slate-800 rounded-md pl-7 pr-6 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Search dropdown */}
        {line.searchState === "searching" && (
          <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl overflow-hidden">
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
                  className="w-full text-left px-3 py-2 hover:bg-slate-800 transition-colors"
                >
                  <div className="text-xs font-mono font-bold text-blue-400">
                    {item.itemCode}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">
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
          className="w-full bg-slate-900/30 border border-slate-800/40 rounded-md px-2.5 py-1.5 text-xs text-slate-500 placeholder-slate-700 cursor-not-allowed focus:outline-none"
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
          className="w-full bg-slate-950 border border-slate-800 rounded-md px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 appearance-none"
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
          onChange={(e) =>
            onUpdate(line._key, { b3Quantity: e.target.value })
          }
          className="w-full bg-slate-950 border border-slate-800 rounded-md px-2 py-1.5 text-xs text-slate-200 font-mono text-right focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* Target Date + Remove */}
      <div className="col-span-1 flex items-center gap-1">
        <input
          type="date"
          value={line.targetDate}
          onChange={(e) =>
            onUpdate(line._key, { targetDate: e.target.value })
          }
          className="w-full bg-slate-950 border border-slate-800 rounded-md px-1.5 py-1.5 text-[11px] text-slate-200 focus:outline-none focus:border-blue-500"
        />
        <button
          type="button"
          onClick={() => onRemove(line._key)}
          disabled={!canRemove}
          aria-label="Remove line"
          className="p-1.5 text-slate-700 hover:text-red-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex-shrink-0"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  )
}
