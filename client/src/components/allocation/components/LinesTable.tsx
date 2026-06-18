import type { InventoryItem, Organization } from "@/api/allocationApi"
import { useItems } from "@/hooks/useAllocationApi"
import { Plus } from "lucide-react"
import { useCallback, useState } from "react"
import type { FormLineItem } from "../types"
import { LineRow } from "./LineRow"

interface Props {
  lines: FormLineItem[]
  organizations: Organization[]
  onAdd: () => void
  onRemove: (key: string) => void
  onUpdate: (key: string, patch: Partial<FormLineItem>) => void
  onSelect: (key: string, item: InventoryItem) => void
}

/** Per-row search state: query → results */
function useRowSearch() {
  const [queries, setQueries] = useState<Record<string, string>>({})
  const [results, setResults] = useState<Record<string, InventoryItem[]>>({})
  const [pending, setPending] = useState<Record<string, boolean>>({})

  const { execute: fetchItems } = useItems()

  const handleQueryChange = useCallback(
    (key: string, query: string) => {
      setQueries((prev) => ({ ...prev, [key]: query }))
      if (!query || query.length < 2) {
        setResults((prev) => ({ ...prev, [key]: [] }))
        return
      }
      setPending((prev) => ({ ...prev, [key]: true }))
      fetchItems(1, 8, query)
        .then((res) => setResults((prev) => ({ ...prev, [key]: res.data })))
        .catch(() => setResults((prev) => ({ ...prev, [key]: [] })))
        .finally(() => setPending((prev) => ({ ...prev, [key]: false })))
    },
    [fetchItems]
  )

  return { queries, results, pending, handleQueryChange }
}

export function LinesTable({ lines, organizations, onAdd, onRemove, onUpdate, onSelect }: Props) {
  const { results, pending, handleQueryChange } = useRowSearch()

  return (
    <div>
      {/* Column headers */}
      <div className="grid grid-cols-12 gap-2 px-2.5 mb-1.5">
        <div className="col-span-1" />
        <div className="col-span-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
          Org
        </div>
        <div className="col-span-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
          Item Code
        </div>
        <div className="col-span-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
          Description
        </div>
        <div className="col-span-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">
          Week
        </div>
        <div className="col-span-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">
          OA PEND
        </div>
        <div className="col-span-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">
          OA RSV
        </div>
        <div className="col-span-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">
          OA Picked
        </div>
        <div className="col-span-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">
          BIN Qty
        </div>
        <div className="col-span-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">
          BIN Rsv
        </div>
        <div className="col-span-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">
          Qty
        </div>
        <div className="col-span-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
          Target Date
        </div>
      </div>

      {/* Lines */}
      <div className="space-y-1.5">
        {lines.map((line, idx) => (
          <LineRow
            key={line._key}
            index={idx}
            line={line}
            organizations={organizations}
            searchResults={results[line._key] ?? []}
            searching={pending[line._key] ?? false}
            canRemove={lines.length > 1}
            onUpdate={onUpdate}
            onSelect={onSelect}
            onRemove={onRemove}
            onSearchQueryChange={handleQueryChange}
          />
        ))}
      </div>

      {/* Add row */}
      <button
        type="button"
        onClick={onAdd}
        className="mt-3 flex items-center gap-1.5 text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors px-1"
      >
        <Plus size={13} />
        Add Item Line
      </button>
    </div>
  )
}
