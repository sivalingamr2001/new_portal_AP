import type {
  AccessItemDto,
  AccessRequestSummaryDto,
  PagedResult,
} from "@/api/types"
import { usersApi } from "@/api/usersApi"
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

  // New State: Cache for user names indexed by their user ID string or number
  const [userNames, setUserNames] = useState<Record<string | number, string>>({})
  const navigate = useNavigate()

  const { title } = useMemo(
    () => getTitleFromSidebar(location.pathname),
    [location.pathname]
  )

  const fetchRequests = useCallback(async () => {
    const targetId = currentUser?.user?.id ?? ""

    try {
      const result = await withLoader(() =>
        fetchApiFn(targetId ? String(targetId) : undefined)
      )
      setRequests(Array.isArray(result) ? result : result.data ?? [])
    } catch (error) {
      console.error("Error fetching requests:", error)
    }
  }, [currentUser, fetchApiFn, withLoader])

  useEffect(() => {
    fetchRequests()
  }, [fetchRequests])

  // New Effect: Detects new rows, extracts distinct IDs, and fetches user names concurrently
  useEffect(() => {
    const loadMissingNames = async () => {
      if (!requests || requests.length === 0) return

      // Find all unique user IDs across the flat request structures safely
      const uniqueUserIds = new Set<string | number>()

      requests.forEach((req: any) => {
        if (req?.requesterUserId) uniqueUserIds.add(req.requesterUserId)
        if (req?.requestedBy) uniqueUserIds.add(req.requestedBy)

        // Also check nested structural arrays if present
        const items = Array.isArray(req?.items) ? req.items : []
        items.forEach((item: any) => {
          if (item?.requesterUserId) uniqueUserIds.add(item.requesterUserId)
        })
      })

      // Select only user IDs that haven't been fetched and stored in our state yet
      const missingIds = Array.from(uniqueUserIds).filter(id => !userNames[id])
      if (missingIds.length === 0) return

      const updatedNamesMap = { ...userNames }

      // Fetch names concurrently using Promise.all to maximize performance
      await Promise.all(
        missingIds.map(async (id) => {
          try {
            const numId = typeof id === "string" ? parseInt(id, 10) : id
            if (isNaN(numId)) return

            const profile = await usersApi.getPortalUser(numId)
            updatedNamesMap[id] = profile?.user?.name || `User #${id}`
          } catch (error) {
            console.error(`Error resolving name for user ID ${id}:`, error)
            updatedNamesMap[id] = `User #${id}` // Safe display fallback
          }
        })
      )

      setUserNames(updatedNamesMap)
    }

    loadMissingNames()
  }, [requests, userNames])

  const handleActionClick = (data: any): void => {
    // 1. Ensure we fall back to item ID variations safely based on payload structure
    const currentItemId = data.itemId;

    // 2. Format query parameter string cleanly
    const itemQuery = currentItemId ? `?itemId=${currentItemId}` : "";

    // 3. Force routing strictly to your matching application path pattern
    navigate(`/request/${data.requestId}${itemQuery}`);
  };

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

      return items.map((item: any) => {
        // Retrieve the current entity's relevant user ID
        const targetUserId = item?.requesterUserId || req?.requesterUserId || req?.requestedBy

        return {
          requestId: req.requestId ?? item.requestId,
          itemId: item.itemId,
          ticketNumber: item.ticketNumber,
          folderPath: item.folderPath,
          accessType: item.accessType ?? item.accessType,
          status: item.status ?? req.currentStatus,
          // Map to cached API name if available; fall back to original property
          requestedBy: userNames[targetUserId] || req.requestedBy || `User #${targetUserId}`,
          department: req.department,
        }
      })
    })
  }, [requests, userNames]) // Recalculates dynamically when userNames updates

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
