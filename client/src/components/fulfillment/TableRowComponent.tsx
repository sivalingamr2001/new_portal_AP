import React, { useState } from 'react';

interface SubRow {
  oaNumber: string;
  customer: string;
  date: string;
  qty: number;
  allocated: number;
  status: string;
}

interface RowProps {
  data: {
    itemCode: string;
    itemName: string;
    customer: string;
    region: string;
    qty: string;
    allocated: string;
    progress: number;
    days: string;
    status: string;
    isExpandable?: boolean;
    editable?: boolean;
    subRows?: SubRow[];
  };
}

export const TableRowComponent: React.FC<RowProps> = ({ data }) => {
  const [isOpen, setIsOpen] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Fulfilled': return 'bg-green-50 text-green-700 border-green-200';
      case 'Partial': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Pending': return 'bg-orange-50 text-orange-700 border-orange-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="w-full">
      {/* Top Tier Item Row */}
      <div 
        className={`grid grid-cols-12 px-4 py-2.5 items-center hover:bg-slate-50/80 transition-colors text-slate-700 ${data.isExpandable ? 'cursor-pointer' : ''}`}
        onClick={() => data.isExpandable && setIsOpen(!isOpen)}
      >
        <div className="col-span-2 font-medium text-blue-600 flex items-center gap-1">
          {data.isExpandable && (
            <span className="text-[10px] text-slate-400 transform transition-transform duration-150 inline-block">
              {isOpen ? '▼' : '▶'}
            </span>
          )}
          {data.itemCode}
        </div>
        <div className="col-span-2 truncate pr-2 font-medium">{data.itemName}</div>
        <div className="col-span-2 text-slate-500 truncate pr-2">{data.customer}</div>
        <div className="col-span-1 text-slate-500">{data.region}</div>
        <div className="col-span-1 text-right font-medium">{data.qty}</div>
        <div className="col-span-1 text-right font-medium">{data.allocated}</div>
        <div className="col-span-1 flex justify-center items-center gap-1.5">
          <span className={`px-1.5 py-0.5 rounded-full border text-[10px] font-medium ${getStatusColor(data.status)}`}>
            {data.status}
          </span>
          {data.editable && (
            <button className="text-blue-500 border border-blue-200 px-1 rounded hover:bg-blue-50 text-[10px]" onClick={(e) => e.stopPropagation()}>
              Edit
            </button>
          )}
        </div>
        
        {/* Progress bar container */}
        <div className="col-span-2 px-4 flex flex-col gap-0.5 justify-center">
          <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
            <span className={data.progress === 100 ? 'text-green-600 font-bold' : ''}>{data.progress}%</span>
            <span className="text-red-500 text-[9px]">{data.days}</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div 
              className={`h-full ${data.progress === 100 ? 'bg-green-500' : 'bg-amber-400'}`} 
              style={{ width: `${data.progress}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Expanded Child Table Content */}
      {data.isExpandable && isOpen && data.subRows && (
        <div className="bg-slate-50/50 border-y border-slate-100 pl-6 pr-4 py-2 text-[11px]">
          <div className="grid grid-cols-12 text-slate-400 font-medium pb-1 border-b border-slate-200 text-[10px] uppercase">
            <div className="col-span-2">OA Number</div>
            <div className="col-span-4">Customer</div>
            <div className="col-span-2">OA Date</div>
            <div className="col-span-1 text-right">OA Qty</div>
            <div className="col-span-1 text-right">Allocated</div>
            <div className="col-span-2 text-center">Status</div>
          </div>
          <div className="divide-y divide-slate-100">
            {data.subRows.map((sub, idx) => (
              <div key={idx} className="grid grid-cols-12 py-1.5 items-center text-slate-600">
                <div className="col-span-2 font-mono text-purple-600 font-semibold">{sub.oaNumber}</div>
                <div className="col-span-4 truncate text-slate-500">{sub.customer}</div>
                <div className="col-span-2 font-mono text-slate-400">{sub.date}</div>
                <div className="col-span-1 text-right font-medium">{sub.qty}</div>
                <div className="col-span-1 text-right font-medium text-green-600">{sub.allocated}</div>
                <div className="col-span-2 flex justify-center">
                  <span className="px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 text-[9px] font-medium flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-green-500"></span> {sub.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
          {/* Inner Totals Summary Row */}
          <div className="grid grid-cols-12 pt-2 border-t border-slate-200 font-semibold text-slate-700">
            <div className="col-span-2 text-slate-400">Totals</div>
            <div className="col-span-6"></div>
            <div className="col-span-1 text-right">450</div>
            <div className="col-span-1 text-right">450</div>
            <div className="col-span-2 text-center text-red-500 text-[10px]">30 open</div>
          </div>
        </div>
      )}
    </div>
  );
};
