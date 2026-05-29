import { DataGrid } from "@/components/DynamicGrid/Index"
import type { ColDef } from "ag-grid-community"
import { useCallback, useMemo, useState, useEffect } from "react"
import accessRequestApi from "@/api/accessRequestApi"
import type { AccessRequestDto } from "@/api/types"
import { useLoader } from "@/hooks/useLoader"
import { getTitleFromSidebar } from "@/lib/getTitleFromSidebar"
import { useLocation } from "react-router-dom"

export const ApprovalQueuePage = () => {
  const location = useLocation()
  const [requests, setRequests] = useState<AccessRequestDto[]>([])
  const { loading, withLoader } = useLoader()

  const { title } = useMemo(
    () => getTitleFromSidebar(location.pathname),
    [location.pathname]
  )

  const fetchRequests = useCallback(async () => {
    try {
      const data = await withLoader(() => accessRequestApi.getItCart())
      setRequests(data)
    } catch (error) {
      console.error("Failed to load approval queue:", error)
    }
  }, [withLoader])

  useEffect(() => {
    fetchRequests()
  }, [])

  const columns = useMemo<(Omit<ColDef<any>, 'field'> & { field?: string })[]>(
    () => [
      {
        headerName: "Request ID",
        field: "accessReqId",
        width: 100,
      },
      {
        headerName: "User Name",
        field: "userName",
        width: 150,
      },
      {
        headerName: "Email",
        field: "userEmail",
        width: 180,
      },
      {
        headerName: "Current Status",
        field: "currentStatus",
        width: 120,
      },
      {
        headerName: "Requested Date",
        field: "requestedAtUtc",
        width: 150,
        valueFormatter: (params: any) => {
          if (!params.value) return "-"
          return new Date(params.value).toLocaleDateString()
        },
      },
      {
        headerName: "Last Action",
        field: "lastActionAtUtc",
        width: 150,
        valueFormatter: (params: any) => {
          if (!params.value) return "-"
          return new Date(params.value).toLocaleDateString()
        },
      },
      {
        headerName: "Items Count",
        field: "items",
        width: 100,
        valueGetter: (params: any) => params.data?.items?.length || 0,
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
        noRowsMessage="No approval queue items found"
        pageSize={10}
      />
    </div>
  )
}
