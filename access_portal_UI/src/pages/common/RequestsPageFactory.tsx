import type { AccessRequestDto, AccessType } from "@/api/types"
import { CreateRequestModal } from "@/components/AccessRequests/create-request-modal"
import { DataGrid } from "@/components/DynamicGrid/Index"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/context/AuthContext"
import { useLoader } from "@/hooks/useLoader"
import { getTitleFromSidebar } from "@/lib/getTitleFromSidebar"
import type { ColDef } from "ag-grid-community"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"

// ==========================================
// 1. GENERIC BASE FACTORY COMPONENT
// ==========================================

interface RequestsPageFactoryProps {
    fetchApiFn: (id: string) => Promise<any>
    actionButtonLabel?: string
    actionButtonRoutePrefix: string
    extraColumns?: (Omit<ColDef<any>, "field"> & { field?: string })[]
    showCreateButton?: boolean
}

export const RequestsPageFactory = ({
    fetchApiFn,
    actionButtonLabel = "View",
    actionButtonRoutePrefix,
    extraColumns = [],
    showCreateButton = false
}: RequestsPageFactoryProps) => {
    const location = useLocation()
    const { currentUser } = useAuth()
    const { loading, withLoader } = useLoader()
    const [requests, setRequests] = useState<AccessRequestDto[]>([])
    const [createRequestModalOpen, setCreateRequestModalOpen] = useState(false)
    const navigate = useNavigate()

    const { title } = useMemo(
        () => getTitleFromSidebar(location.pathname),
        [location.pathname]
    )

    const fetchRequests = useCallback(async () => {
        // Fallback checks for different user types
        const targetId = currentUser?.user?.userId ?? 
                         currentUser?.cmplUser?.userId ?? 
                         currentUser?.departmentId

        if (!targetId) return

        try {
            const result = await withLoader(() => fetchApiFn(targetId))

            if (!result?.isSuccess || !result.value) {
                console.error(`Failed to load requests for route: ${location.pathname}`, result?.error)
                return
            }

            setRequests(result.value.data ?? [])
        } catch (error) {
            console.error("Error fetching requests:", error)
        }
    }, [currentUser, fetchApiFn, withLoader, location.pathname])

    useEffect(() => {
        fetchRequests()
    }, [fetchRequests])

    const handleActionClick = (data: any): void => {
        navigate(`${actionButtonRoutePrefix}/${data.accessReqId}`)
    }

    const flattenedRowData = useMemo(() => {
        return requests.flatMap((req) => {
            if (!req.items || req.items.length === 0) {
                return [{
                    accessReqId: req.accessReqId,
                    ticketNumber: "-",
                    folderPath: "-",
                    accessType: "-" as unknown as AccessType,
                    status: req.currentStatus,
                    requestedAtUtc: req.requestedAtUtc
                }]
            }

            return req.items.map((item) => ({
                accessReqId: req.accessReqId,
                ticketNumber: item.ticketNumber,
                folderPath: item.folderPath,
                accessType: item.accessType, // This already matches AccessType
                status: item.status,
                requestedAtUtc: item.requestedAtUtc
            }))
        })
    }, [requests])

    const coreColumns = useMemo<(Omit<ColDef<any>, "field"> & { field?: string })[]>(
        () => [
            { headerName: "Ticket Number", field: "ticketNumber", width: 140 },
            ...extraColumns, // Dynamically injects User Info / Dept Info based on role
            { headerName: "Folder Path", field: "folderPath", width: 280 },
            {
                headerName: "Access Type", 
                field: "accessType", 
                width: 120,
                valueFormatter: (params) => params.value === 2 ? "Read/Write" : params.value
            },
            {
                headerName: "Status", 
                field: "status", 
                width: 120,
                cellRenderer: (params: any) => {
                    const status = params.value === 2 ? "Pending" : params.value;
                    const isPending = status === "Pending";
                    
                    return (
                        <div className="flex h-full items-center">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                                isPending 
                                    ? "bg-amber-50 text-amber-700 border-amber-200" 
                                    : "bg-emerald-50 text-emerald-700 border-emerald-200"
                            }`}>
                                <span className={`w-1.5 h-1.5 mr-1.5 rounded-full ${isPending ? "bg-amber-500" : "bg-emerald-500"}`} />
                                {status}
                            </span>
                        </div>
                    );
                }
            },
            {
                headerName: "Actions",
                sortable: false,
                filter: false,
                width: 100,
                cellRenderer: (params: any) => {
                    if (!params.data || params.data.__isDetailRow) return null

                    return (
                        <div className="flex h-full items-center gap-2">
                            <Button
                                size="sm"
                                variant="outline"
                                className="h-7 px-3 text-xs font-medium shadow-sm transition-all hover:bg-secondary"
                                onClick={() => handleActionClick(params.data)}
                            >
                                {actionButtonLabel}
                            </Button>
                        </div>
                    )
                },
            },
        ],
        [extraColumns, actionButtonLabel, actionButtonRoutePrefix]
    )

    const customActions = useMemo(() => {
        if (!showCreateButton) return []
        return [
            {
                label: "Create New Request",
                onClick: () => setCreateRequestModalOpen(true),
            },
        ]
    }, [showCreateButton])

    return (
        <div className="space-y-4">
            <DataGrid
                rowData={flattenedRowData}
                columnDefs={coreColumns}
                title={title}
                loading={loading}
                onRefresh={fetchRequests}
                showRefreshButton
                showSearch
                showClearFiltersButton
                customActions={customActions}
                noRowsMessage="No access requests found"
                pageSize={10}
                rowSelection="none"
            />

            {showCreateButton && (
                <CreateRequestModal
                    isOpen={createRequestModalOpen}
                    onOpenChange={setCreateRequestModalOpen}
                />
            )}
        </div>
    )
}