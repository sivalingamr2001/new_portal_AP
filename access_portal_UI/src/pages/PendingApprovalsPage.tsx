import { DataGrid } from "@/components/DynamicGrid/Index"
import type { ColDef } from "ag-grid-community"
import { useCallback, useMemo, useState, useEffect } from "react"
import accessRequestApi from "@/api/accessRequestApi"
import type { AccessRequestDto } from "@/api/types"
import { useLoader } from "@/hooks/useLoader"
import { getTitleFromSidebar } from "@/lib/getTitleFromSidebar"
import { useLocation, useNavigate } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"
import { Button } from "@/components/ui/button"

export const PendingApprovalsPage = () => {
  const location = useLocation()
  const { currentUser } = useAuth()
  const [requests, setRequests] = useState<AccessRequestDto[]>([])
  const { loading, withLoader } = useLoader()
  const navigate = useNavigate()

  useEffect(() => {
    fetchRequests()
  }, [])

  const { title } = useMemo(
    () => getTitleFromSidebar(location.pathname),
    [location.pathname]
  )

  const fetchRequests = useCallback(async () => {
    if (!currentUser?.cmplUser?.cmplUserId) return
    try {
      const result = await withLoader(() =>
        accessRequestApi.getHodCart(currentUser.cmplUser.cmplUserId)
      )
      if (!result.isSuccess || !result.value) {
        console.error("Failed to load pending approvals:", result.error?.message)
        return
      }
      setRequests(result.value.data)
    } catch (error) {
      console.error("Failed to load pending approvals:", error)
    }
  }, [currentUser?.userId, withLoader])

  const handleEditAction = (data: any): void => {
    navigate(`/request/${data.accessReqId}`)
  }

  const columns = useMemo<(Omit<ColDef<any>, "field"> & { field?: string })[]>(
    () => [
      { headerName: "Ticket Number", field: "ticketNumber", width: 160 },
      { headerName: "Folder Path", field: "folderPath", width: 300 },
      {
        headerName: "Access Type", field: "accessType", width: 120,
        valueFormatter: (params) => params.value === 2 ? "Read/Write" : params.value
      },
      {
        headerName: "Status", field: "status", width: 120,
        valueFormatter: (params) => params.value === 2 ? "Pending" : params.value
      },
      {
        headerName: "Actions",
        sortable: false,
        filter: false,
        cellRenderer: (params: any) => {
          if (!params.data || params.data.__isDetailRow) return null

          return (
            <div className="flex h-full items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="h-7 px-2 text-xs"
                onClick={() => handleEditAction(params.data)}
              >
                Edit
              </Button>
            </div>
          )
        },
        width: 100,
      },
    ],
    []
  )

  return (
    <div className="space-y-4">
      <DataGrid
        rowData={requests}
        columnDefs={columns}
        title={title}
        loading={loading}
        onRefresh={fetchRequests}
        showRefreshButton
        showSearch
        showClearFiltersButton
        noRowsMessage="No pending approvals found"
        pageSize={10}
      />
    </div>
  )
}
