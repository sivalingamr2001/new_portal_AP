import React, { useState } from "react"

interface SubRow {
  oaNumber: string
  customer: string
  date: string
  qty: number
  allocated: number
  status: string
}

interface RowProps {
  data: {
    itemCode: string
    itemName: string
    customer: string
    region: string
    qty: string
    allocated: string
    progress: number
    days: string
    status: string
    isExpandable?: boolean
    editable?: boolean
    subRows?: SubRow[]
  }
}

export const TableRowComponent: React.FC<RowProps> = ({ data }) => {
  const [isOpen, setIsOpen] = useState(false)

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Fulfilled":
        return "bg-green-50 text-green-700 border-green-200"
      case "Partial":
        return "bg-amber-50 text-amber-700 border-amber-200"
      case "Pending":
        return "bg-orange-50 text-orange-700 border-orange-200"
      default:
        return "bg-slate-50 text-slate-700 border-slate-200"
    }
  }

  return (
    <div className="w-full">
      {/* Top Tier Item Row */}
      <div
        className={`grid grid-cols-12 items-center px-4 py-2.5 text-slate-700 transition-colors hover:bg-slate-50/80 ${data.isExpandable ? "cursor-pointer" : ""}`}
        onClick={() => data.isExpandable && setIsOpen(!isOpen)}
      >
        <div className="col-span-2 flex items-center gap-1 font-medium text-blue-600">
          {data.isExpandable && (
            <span className="inline-block transform text-[10px] text-slate-400 transition-transform duration-150">
              {isOpen ? "▼" : "▶"}
            </span>
          )}
          {data.itemCode}
        </div>
        <div className="col-span-2 truncate pr-2 font-medium">
          {data.itemName}
        </div>
        <div className="col-span-2 truncate pr-2 text-slate-500">
          {data.customer}
        </div>
        <div className="col-span-1 text-slate-500">{data.region}</div>
        <div className="col-span-1 text-right font-medium">{data.qty}</div>
        <div className="col-span-1 text-right font-medium">
          {data.allocated}
        </div>
        <div className="col-span-1 flex items-center justify-center gap-1.5">
          <span
            className={`rounded-full border px-1.5 py-0.5 text-[10px] font-medium ${getStatusColor(data.status)}`}
          >
            {data.status}
          </span>
          {data.editable && (
            <button
              className="rounded border border-blue-200 px-1 text-[10px] text-blue-500 hover:bg-blue-50"
              onClick={(e) => e.stopPropagation()}
            >
              Edit
            </button>
          )}
        </div>

        {/* Progress bar container */}
        <div className="col-span-2 flex flex-col justify-center gap-0.5 px-4">
          <div className="flex items-center justify-between font-mono text-[10px] text-slate-400">
            <span
              className={
                data.progress === 100 ? "font-bold text-green-600" : ""
              }
            >
              {data.progress}%
            </span>
            <span className="text-[9px] text-red-500">{data.days}</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full ${data.progress === 100 ? "bg-green-500" : "bg-amber-400"}`}
              style={{ width: `${data.progress}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Expanded Child Table Content */}
      {data.isExpandable && isOpen && data.subRows && (
        <div className="border-y border-slate-100 bg-slate-50/50 py-2 pr-4 pl-6 text-[11px]">
          <div className="grid grid-cols-12 border-b border-slate-200 pb-1 text-[10px] font-medium text-slate-400 uppercase">
            <div className="col-span-2">OA Number</div>
            <div className="col-span-4">Customer</div>
            <div className="col-span-2">OA Date</div>
            <div className="col-span-1 text-right">OA Qty</div>
            <div className="col-span-1 text-right">Allocated</div>
            <div className="col-span-2 text-center">Status</div>
          </div>
          <div className="divide-y divide-slate-100">
            {data.subRows.map((sub, idx) => (
              <div
                key={idx}
                className="grid grid-cols-12 items-center py-1.5 text-slate-600"
              >
                <div className="col-span-2 font-mono font-semibold text-purple-600">
                  {sub.oaNumber}
                </div>
                <div className="col-span-4 truncate text-slate-500">
                  {sub.customer}
                </div>
                <div className="col-span-2 font-mono text-slate-400">
                  {sub.date}
                </div>
                <div className="col-span-1 text-right font-medium">
                  {sub.qty}
                </div>
                <div className="col-span-1 text-right font-medium text-green-600">
                  {sub.allocated}
                </div>
                <div className="col-span-2 flex justify-center">
                  <span className="flex items-center gap-1 rounded-full bg-green-100 px-1.5 py-0.5 text-[9px] font-medium text-green-700">
                    <span className="h-1 w-1 rounded-full bg-green-500"></span>{" "}
                    {sub.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
          {/* Inner Totals Summary Row */}
          <div className="grid grid-cols-12 border-t border-slate-200 pt-2 font-semibold text-slate-700">
            <div className="col-span-2 text-slate-400">Totals</div>
            <div className="col-span-6"></div>
            <div className="col-span-1 text-right">450</div>
            <div className="col-span-1 text-right">450</div>
            <div className="col-span-2 text-center text-[10px] text-red-500">
              30 open
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
