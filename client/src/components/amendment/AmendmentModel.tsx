import type { ItemLine } from '@/pages/Amendment'
import { useState, useEffect } from 'react'

interface AmendmentModelProps {
    targetItem: ItemLine
    amendQty: number
    setAmendQty: (qty: number) => void
    reason: string
    setReason: (reason: string) => void
    cancelReason: string
    setCancelReason: (reason: string) => void
    processAmendment: () => Promise<void>
    processCancellation: () => Promise<void>
    setSelectedId: (id: number | null) => void
    initialView: 'amend' | 'cancel'
}

export function AmendmentModel({
    targetItem,
    amendQty,
    setAmendQty,
    reason,
    setReason,
    cancelReason,
    setCancelReason,
    processAmendment,
    processCancellation,
    setSelectedId,
    initialView,
}: AmendmentModelProps) {
    const [activeTab, setActiveTab] = useState<'amend' | 'cancel'>(initialView)

    useEffect(() => {
        setActiveTab(initialView)
        const initialQty = targetItem.b3ApprovedQuantity !== null ? targetItem.b3ApprovedQuantity : targetItem.b3Quantity
        setAmendQty(initialQty)
    }, [initialView, targetItem.lineId, setAmendQty, targetItem.b3ApprovedQuantity, targetItem.b3Quantity])

    const modalHasVariance = targetItem.b3ApprovedQuantity !== null && targetItem.b3ApprovedQuantity !== targetItem.b3Quantity

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-100">
            <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-2xl overflow-hidden text-foreground bg-background transition-all">

                {/* LIGHT/DARK COMPACT ADAPTIVE HEADER */}
                <div className="p-2.5 px-4 border-b border-border bg-muted/20 dark:bg-muted/10 flex items-center justify-between gap-4 h-14 transition-colors">
                    <div className="truncate min-w-0">
                        <h3 className="text-xs font-bold truncate">Amendment / Cancellation Matrix</h3>
                        <p className="text-[11px] text-muted-foreground font-mono truncate mt-0.5">
                            {targetItem.itemCode || `ITEM-${targetItem.inventoryItemId}`} — {targetItem.customer || `CUST-${targetItem.customerId}`}
                        </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                        <div className="flex gap-0 bg-slate-100 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-md overflow-hidden h-6 transition-colors">
                            <button
                                type="button"
                                onClick={() => setActiveTab('amend')}
                                className={`text-[11px] font-semibold px-3.5 transition-all cursor-pointer ${activeTab === 'amend'
                                    ? 'bg-blue-600 text-white shadow-inner dark:bg-blue-600'
                                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-900'
                                    }`}
                            >
                                Amend
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab('cancel')}
                                className={`text-[11px] font-semibold px-3.5 transition-all cursor-pointer ${activeTab === 'cancel'
                                    ? 'bg-red-600 text-white shadow-inner dark:bg-red-600'
                                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-900'
                                    }`}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>

                {/* FORM CONFIGURATION VIEWS */}
                <div className="p-5 space-y-4">
                    {activeTab === 'amend' ? (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-muted-foreground block mb-1">Current Approved Qty</label>

                                    {/* MODAL ADAPTIVE QUANTITY DISPLAY BOX */}
                                    <div className="bg-muted/40 border border-border rounded-lg px-3 py-2 text-xs font-mono h-[34px] flex items-center">
                                        {modalHasVariance ? (
                                            <div className="flex items-center gap-2">
                                                <span className="line-through text-red-500 font-medium">{targetItem.b3Quantity}</span>
                                                <span className="text-green-600 dark:text-green-400 font-bold">{targetItem.b3ApprovedQuantity}</span>
                                            </div>
                                        ) : (
                                            <span>{targetItem.b3ApprovedQuantity !== null ? targetItem.b3ApprovedQuantity : targetItem.b3Quantity}</span>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs text-muted-foreground block mb-1">New Quantity</label>
                                    <input
                                        type="number"
                                        value={amendQty}
                                        min={0}
                                        onChange={(e) => setAmendQty(Number(e.target.value))}
                                        className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-xs font-mono focus:outline-none focus:border-primary transition-colors h-[34px]"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs text-muted-foreground block mb-1">Reason *</label>
                                <select
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-primary transition-colors"
                                >
                                    <option value="">Select reason...</option>
                                    <option value="Production schedule change">Production schedule change</option>
                                    <option value="Client order revision">Client order revision</option>
                                    <option value="Logistics/Supply delay">Logistics/Supply delay</option>
                                </select>
                            </div>

                            <div className="flex items-center gap-2 pt-2">
                                <button
                                    onClick={processAmendment}
                                    disabled={!reason || amendQty <= 0}
                                    className="flex-1 bg-orange-600 hover:bg-orange-500 disabled:bg-muted disabled:text-muted-foreground dark:disabled:bg-neutral-800 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-all h-9 cursor-pointer"
                                >
                                    Submit Amend
                                </button>
                                <button
                                    onClick={() => setSelectedId(null)}
                                    className="bg-secondary hover:bg-secondary/80 text-secondary-foreground text-xs px-4 py-2 rounded-lg h-9 cursor-pointer transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-muted-foreground block mb-1">Reason *</label>
                                <select
                                    value={cancelReason}
                                    onChange={(e) => setCancelReason(e.target.value)}
                                    className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-primary transition-colors"
                                >
                                    <option value="">Select cancellation reason...</option>
                                    <option value="Customer changed delivery schedule">Customer changed delivery schedule</option>
                                    <option value="Production plan revised">Production plan revised</option>
                                    <option value="Raw material delay">Raw material delay</option>
                                    <option value="Quality hold">Quality hold</option>
                                </select>
                            </div>

                            <div className="flex items-center gap-2 pt-2">
                                <button
                                    onClick={processCancellation}
                                    disabled={!cancelReason}
                                    className="flex-1 bg-destructive/90 hover:bg-destructive disabled:bg-muted disabled:text-muted-foreground dark:disabled:bg-neutral-800 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-all h-9 cursor-pointer"
                                >
                                    Confirm Cancellation
                                </button>
                                <button
                                    onClick={() => setSelectedId(null)}
                                    className="bg-secondary hover:bg-secondary/80 text-secondary-foreground text-xs px-4 py-2 rounded-lg h-9 cursor-pointer transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
