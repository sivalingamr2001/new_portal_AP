import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Box, FileText, Globe, Plus, Search, Trash2, User } from "lucide-react";
import { useState } from "react";
import { AllocationHeader } from "./allocation/allocation-header";

interface ItemLine {
    id: string
    itemCode: string
    itemName: string
    qty: number
    targetDate: string
}

export const MyRequestsPage = () => {
    const [allocationType, setAllocationType] = useState<"customer" | "open">("customer")
    const [customer, setCustomer] = useState("")
    const [region, setRegion] = useState("")
    const [lines, setLines] = useState<ItemLine[]>([
        { id: "1", itemCode: "", itemName: "— select item code first", qty: 0, targetDate: "" }
    ])

    const handleAddRow = () => {
        setLines([
            ...lines,
            {
                id: crypto.randomUUID(),
                itemCode: "",
                itemName: "— select item code first",
                qty: 0,
                targetDate: ""
            }
        ])
    }

    const handleUpdateLine = (id: string, field: keyof ItemLine, value: any) => {
        setLines(lines.map(line => (line.id === id ? { ...line, [field]: value } : line)))
    }

    const handleRemoveRow = (id: string) => {
        if (lines.length > 1) {
            setLines(lines.filter(line => line.id !== id))
        }
    }

    const totalQty = lines.reduce((sum, line) => sum + (Number(line.qty) || 0), 0)

    return (
        <div>
            <AllocationHeader />

            <div className="w-full rounded-lg border bg-background p-4 shadow-sm text-slate-700">
                <div className="space-y-4 border-b pb-4">
                    <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                            Allocation Type
                        </label>
                        <div className="mt-2 flex gap-2">
                            <button
                                onClick={() => setAllocationType("customer")}
                                className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium transition-colors ${allocationType === "customer"
                                    ? "bg-blue-600 text-white"
                                    : "bg-slate-50 border text-slate-600 hover:bg-slate-100"
                                    }`}
                            >
                                <User className="h-3.5 w-3.5" />
                                Customer Specific
                            </button>
                            <button
                                onClick={() => setAllocationType("open")}
                                className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium transition-colors ${allocationType === "open"
                                    ? "bg-blue-600 text-white"
                                    : "bg-slate-50 border text-slate-600 hover:bg-slate-100"
                                    }`}
                            >
                                <Globe className="h-3.5 w-3.5" />
                                Open Pool (Any Customer)
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-medium text-slate-600">
                                Customer <span className="text-destructive">*</span>
                            </label>
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                <Input
                                    type="text"
                                    placeholder="Type customer name or code..."
                                    value={customer}
                                    onChange={(e) => setCustomer(e.target.value)}
                                    className="pl-9 h-9 bg-slate-50/50 text-xs"
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-medium text-slate-600">
                                Region <span className="text-destructive">*</span>
                            </label>
                            <select
                                value={region}
                                onChange={(e) => setRegion(e.target.value)}
                                className="flex h-9 w-full rounded-md border border-input bg-slate-50/50 px-3 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            >
                                <option value="">Select state / region...</option>
                                <option value="HO">HO / HO</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="mt-4">
                    <div className="flex items-center justify-between pb-2">
                        <h3 className="text-xs font-bold text-slate-700">Item Lines</h3>
                        <Button
                            variant="ghost"
                            onClick={handleAddRow}
                            className="h-7 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2"
                        >
                            <Plus className="mr-1 h-3.5 w-3.5 stroke-[2.5]" />
                            Add Row
                        </Button>
                    </div>

                    <div className="overflow-x-auto border rounded">
                        <table className="w-full border-collapse text-left text-xs">
                            <thead>
                                <tr className="border-b bg-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                    <th className="p-2 w-10 text-center">#</th>
                                    <th className="p-2 w-10 text-center">ORG</th>
                                    <th className="p-2 w-48">Item Code</th>
                                    <th className="p-2">DESCRIPTION</th>
                                    <th className="p-2 w-48">Weeks</th>
                                    <th className="p-2 w-48">PEND Qty</th>
                                    <th className="p-2 w-48">RSV Qty</th>
                                    <th className="p-2 w-48">PICKED Qty</th>
                                    <th className="p-2 w-48">BIN Qty</th>
                                    <th className="p-2 w-48">BIN RSV Qty</th>
                                    <th className="p-2 w-28">Qty (BIN)</th>
                                    <th className="p-2 w-44">Target Date</th>
                                    <th className="p-2 w-10"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {lines.map((line, index) => (
                                    <tr key={line.id} className="border-b last:border-0 hover:bg-slate-50/50">
                                        <td className="p-2 text-center text-slate-400 font-medium">{index + 1}</td>
                                        <td className="p-2">
                                            <Input
                                                type="text"
                                                placeholder="Code / name..."
                                                value={line.itemCode}
                                                onChange={(e) => handleUpdateLine(line.id, "itemCode", e.target.value)}
                                                className="h-8 text-xs bg-white"
                                            />
                                        </td>
                                        <td className="p-2 text-slate-400 font-medium">{line.itemName}</td>
                                        <td className="p-2">
                                            <Input
                                                type="number"
                                                value={line.qty || ""}
                                                onChange={(e) => handleUpdateLine(line.id, "qty", Number(e.target.value))}
                                                className="h-8 text-xs bg-white text-right"
                                            />
                                        </td>
                                        <td className="p-2">
                                            <div className="relative">
                                                <Input
                                                    type="date"
                                                    value={line.targetDate}
                                                    onChange={(e) => handleUpdateLine(line.id, "targetDate", e.target.value)}
                                                    className="h-8 text-xs bg-white pr-8"
                                                />
                                            </div>
                                        </td>
                                        <td className="p-2 text-center">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                disabled={lines.length === 1}
                                                onClick={() => handleRemoveRow(line.id)}
                                                className="h-7 w-7 text-slate-300 hover:text-destructive disabled:opacity-30"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex items-center justify-between mt-3 text-[11px] font-medium text-slate-400 px-1">
                        <div>{lines.length} item line(s)</div>
                        <div className="font-bold text-slate-600">Total Qty: <span className="text-blue-600">{totalQty}</span></div>
                    </div>
                </div>
            </div>
        </div>
    );
}