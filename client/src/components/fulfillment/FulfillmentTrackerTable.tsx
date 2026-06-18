import React, { useState } from 'react';
import type { GroupedAllocationHeader } from '@/components/fulfillment/hooks/useFullfilement';

interface TableProps {
    headers: GroupedAllocationHeader[];
    onEditClick: (headerId: number) => void;
}

export const FulfillmentTrackerTable: React.FC<TableProps> = ({ headers, onEditClick }) => {
    const [openHeaderId, setOpenHeaderId] = useState<number | null>(null);

    const toggleRow = (id: number) => {
        setOpenHeaderId(openHeaderId === id ? null : id);
    };

    // Check if any header in the dataset contains unapproved items to toggle the parent grid layout column
    const hasUnapprovedItemsInDataset = headers.some(h => 
        h.lines.some(line => line.approvalFlag === 'N')
    );

    return (
        <div className="w-full">
            {/* Header Labels Layout Panel */}
            <div className={`grid ${hasUnapprovedItemsInDataset ? 'grid-cols-13' : 'grid-cols-12'} bg-slate-50 px-4 py-2.5 border-b border-slate-200 font-bold text-slate-400 text-[10px] uppercase tracking-wider`}>
                <div className="col-span-2">Allocation Matrix ID</div>
                <div className="col-span-3">Bill-To Target Client</div>
                <div className="col-span-2">Ship-To Node Location</div>
                <div className="col-span-1 text-right">Gross Demands</div>
                <div className="col-span-1 text-right">Allocated Qty</div>
                <div className="col-span-2 text-center">Fill Rate Metric</div>
                <div className="col-span-1 text-center">Status</div>
                {hasUnapprovedItemsInDataset && <div className="col-span-1 text-center">Actions</div>}
            </div>

            {/* Structured Rows mapping data keys elements */}
            <div className="divide-y divide-slate-100">
                {headers.map((h) => {
                    const isExpanded = openHeaderId === h.headerId;
                    const fillRate = h.totalRequested > 0 ? Math.round((h.totalApproved / h.totalRequested) * 100) : 0;
                    
                    // Header contains items waiting for approval auth signatures
                    const hasUnapprovedLines = h.lines.some(line => line.approvalFlag === 'N');

                    return (
                        <div key={h.headerId} className="w-full">
                            <div
                                onClick={() => toggleRow(h.headerId)}
                                className={`grid ${hasUnapprovedItemsInDataset ? 'grid-cols-13' : 'grid-cols-12'} px-4 py-3 items-center hover:bg-slate-50/60 transition-colors cursor-pointer text-slate-700 font-medium`}
                            >
                                <div className="col-span-2 text-blue-600 font-bold flex items-center gap-2">
                                    <span>{isExpanded ? '▼' : '▶'}</span>
                                    <span>Header #{h.headerId}</span>
                                </div>
                                <div className="col-span-3 font-mono text-slate-600">Customer ID: {h.billToCustomer}</div>
                                <div className="col-span-2 font-mono text-slate-400">Node: {h.shipToCustomer}</div>
                                <div className="col-span-1 text-right font-bold">{h.totalRequested}</div>
                                <div className="col-span-1 text-right font-bold text-green-600">{h.totalApproved}</div>
                                <div className="col-span-2 px-6">
                                    <div className="flex justify-between items-center text-[9px] text-slate-400 font-mono mb-0.5">
                                        <span>{fillRate}%</span>
                                    </div>
                                    <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-500" style={{ width: `${Math.min(100, fillRate)}%` }}></div>
                                    </div>
                                </div>
                                <div className="col-span-1 text-center">
                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${h.status === 'Fulfilled' ? 'bg-green-50 border-green-200 text-green-700' :
                                        h.status === 'Partial' ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-orange-50 border-orange-200 text-orange-600'
                                        }`}>{h.status}</span>
                                </div>
                                
                                {/* Structural Alignment Spaceholder matching your Grid layout settings */}
                                {hasUnapprovedItemsInDataset && (
                                    <div className="col-span-1 text-center">
                                        {hasUnapprovedLines ? (
                                            <button
                                                type="button"
                                                onClick={(e) => { e.stopPropagation(); onEditClick(h.headerId); }}
                                                className="px-2 py-0.5 border border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded text-[10px] font-bold shadow-xs transition-colors"
                                            >
                                                Edit
                                            </button>
                                        ) : (
                                            <span className="text-[10px] text-slate-300 font-semibold italic">Approved</span>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Collapsible details layout view */}
                            {isExpanded && (
                                <div className="bg-slate-50/50 border-t border-b border-slate-200/60 px-6 py-2">
                                    <div className="grid grid-cols-12 text-[9px] font-bold uppercase text-slate-400 py-1 border-b border-slate-200">
                                        <div className="col-span-2">Line Unique Identity</div>
                                        <div className="col-span-2">Inventory Item Identifier</div>
                                        <div className="col-span-2">Plant Node ID</div>
                                        <div className="col-span-2">Target Date</div>
                                        <div className="col-span-1 text-right">Requested</div>
                                        <div className="col-span-2 text-right">Approved</div>
                                        <div className="col-span-1 text-center">Line Status</div>
                                    </div>
                                    <div className="divide-y divide-slate-100">
                                        {h.lines.map((line) => (
                                            <div key={line.lineId} className="grid grid-cols-12 py-2 items-center text-[11px] font-medium text-slate-600">
                                                <div className="col-span-2 font-mono text-purple-600 font-semibold">Line Row #{line.lineId}</div>
                                                <div className="col-span-2 font-mono text-slate-500">Item: {line.inventoryItemId}</div>
                                                <div className="col-span-2 text-slate-400 font-mono">Org Unit: {line.organizationId}</div>
                                                <div className="col-span-2 font-mono text-slate-400">{new Date(line.targetDate).toLocaleDateString()}</div>
                                                <div className="col-span-1 text-right font-bold">{line.b3Quantity}</div>
                                                <div className="col-span-2 text-right font-bold text-green-600">{line.b3ApprovedQuantity ?? '0'}</div>
                                                <div className="col-span-1 text-center">
                                                    <span className={`text-[10px] font-bold ${line.approvalFlag === 'Y' ? 'text-green-600' : 'text-amber-600'}`}>
                                                        {line.approvalFlag === 'Y' ? 'Authorized' : 'Pending'}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default FulfillmentTrackerTable;
