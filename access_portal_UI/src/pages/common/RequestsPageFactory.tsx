import type {
  AccessItemDto,
  AccessRequestSummaryDto,
  PagedResult,
} from "@/api/types"
import { CreateRequestModal } from "@/components/AccessRequests/create-request-modal"
import { DataGrid } from "@/components/DynamicGrid/Index"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/context/AuthContext"
import { useLoader } from "@/hooks/useLoader"
import { getTitleFromSidebar } from "@/lib/getTitleFromSidebar"
import type { ColDef } from "ag-grid-community"
import { Pen } from "lucide-react"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"

// ==========================================
// 1. GENERIC BASE FACTORY COMPONENT
// ==========================================

interface RequestsPageFactoryProps {
  fetchApiFn: (
    id?: string
  ) => Promise<PagedResult<AccessRequestSummaryDto> | AccessRequestSummaryDto[]>
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
  showCreateButton = false,
}: RequestsPageFactoryProps) => {
  const location = useLocation()
  const { currentUser } = useAuth()
  const { loading, withLoader } = useLoader()
  const [requests, setRequests] = useState<AccessRequestSummaryDto[]>([])
  const [createRequestModalOpen, setCreateRequestModalOpen] = useState(false)
  const navigate = useNavigate()

  const { title } = useMemo(
    () => getTitleFromSidebar(location.pathname),
    [location.pathname]
  )

  const fetchRequests = useCallback(async () => {
    // Fallback checks for different user types
    const targetId =
      currentUser?.user?.id ?? ""

    try {
      const result = await withLoader(() =>
        fetchApiFn(targetId ? String(targetId) : undefined)
      )
      setRequests(Array.isArray(result) ? result : result.data ?? [])
    } catch (error) {
      console.error("Error fetching requests:", error)
    }
  }, [currentUser, fetchApiFn, withLoader, location.pathname])

  useEffect(() => {
    fetchRequests()
  }, [fetchRequests])

  const handleActionClick = (data: any): void => {
    const itemQuery = data.itemId ? `?itemId=${data.itemId}` : ""
    navigate(`${actionButtonRoutePrefix}/${data.requestId}${itemQuery}`)
  }

  const flattenedRowData = useMemo(() => {
    return requests.flatMap((req: any) => {
      const rawItems = req?.items
      const items: AccessItemDto[] = Array.isArray(rawItems)
        ? rawItems
        : rawItems
          ? [rawItems]
          : req?.itemId
            ? [req]
            : []

      return items.map((item) => ({
        requestId: req.requestId,
        itemId: item.itemId,
        ticketNumber: item.ticketNumber,
        folderPath: item.folderPath,
        accessType: item.accessType ?? item.accessType,
        status: item.status ?? req.currentStatus,
        requestedBy: req.requestedBy,
        department: req.department,
      }))
    })
  }, [requests])

  const coreColumns = useMemo<
    (Omit<ColDef<any>, "field"> & { field?: string })[]
  >(
    () => [
      {
        headerName: "Ticket Number",
        field: "ticketNumber",
        width: 220,
      },
      {
        headerName: "Folder Path",
        field: "folderPath",
        flex: 1,
      },
      {
        headerName: "Access Type",
        field: "accessType",
        width: 140,
      },
      {
        headerName: "Status",
        field: "status",
        width: 140,
      },
      ...extraColumns,
      {
        headerName: "Actions",
        sortable: false,
        filter: false,
        width: 90,
        cellRenderer: (params: any) => {
          if (!params.data) return null

          return (
            <div className="flex h-full justify-center mt-2 items-center">
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                onClick={() => handleActionClick(params.data)}
              >
                <Pen />
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
