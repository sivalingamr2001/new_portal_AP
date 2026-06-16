import { Button } from "@/components/ui/button";
import { Box, FileText } from "lucide-react";

export const AllocationHeader = () => {
    return (
        <div className="flex w-full items-center justify-between rounded-lg border bg-background p-2 shadow-sm mb-2">
            <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded p-1 text-primary">
                    <Box className="h-5 w-5 stroke-[2.5]" />
                </div>
                <div className="flex flex-col gap-0.5">
                    <h2 className="text-sm font-semibold tracking-tight text-slate-900">
                        New BIN Allocation
                    </h2>
                    <p className="text-xs text-muted-foreground">
                        Forecast commitment — allocate stock by customer or open pool
                    </p>
                </div>
            </div>

            <Button
                className="flex items-center gap-1.5 bg-blue-400 font-medium text-white hover:bg-blue-500"
                size="sm"
            >
                <FileText className="h-4 w-4" />
                Submit for Approval
            </Button>
        </div>
    );
}