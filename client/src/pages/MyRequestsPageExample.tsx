/**
 * EXAMPLE: MyRequestsPage with Virtual Scrolling
 * Shows how to integrate paginated API with DataGrid virtual scroll
 */

import { useEffect } from "react"
import { DataGrid } from "@/components/DynamicGrid/Index"
import type { ColDef } from "ag-grid-community"
import { usePaginatedDataGrid } from "@/hooks/usePaginatedDataGrid"
import { accessRequestApi } from "@/api"
import type { AccessRequestDto } from "@/api/types"
import { useLoader } from "@/hooks/useLoader"

export function MyRequestsPageExample() {
  const userId = 1 // Get from auth context
  const { showLoader, hideLoader } = useLoader()

  const { rowData, totalCount, totalPages, loading, loadData, loadMore } =
    usePaginatedDataGrid<AccessRequestDto>(
      (page, pageSize) => accessRequestApi.getAll(userId, { page, pageSize }),
      {
        pageSize: 20,
        onError: (error) => {
          console.error("Failed to load requests:", error)
          hideLoader()
        },
      }
    )

  // Load initial data
  useEffect(() => {
    showLoader()
    loadData(1).finally(hideLoader)
  }, [])

  const columnDefs: ColDef<AccessRequestDto>[] = [
    {
      headerName: "Request ID",
      field: "accessReqId",
      width: 100,
    },
    {
      headerName: "User",
      field: "userName",
      width: 150,
    },
    {
      headerName: "Status",
      field: "currentStatus",
      width: 120,
    },
    {
      headerName: "Requested Date",
      field: "requestedAtUtc",
      width: 150,
      valueFormatter: (params) => {
        if (!params.value) return ""
        return new Date(params.value).toLocaleDateString()
      },
    },
    {
      headerName: "Items",
      field: "items",
      width: 80,
      valueGetter: (params) => params.data?.items?.length ?? 0,
    },
  ]

  return (
    <div className="h-full w-full">
      <DataGrid<AccessRequestDto>
        title="My Access Requests"
        rowData={rowData}
        columnDefs={columnDefs}
        loading={loading}
        pageSize={20}
        pageSizeOptions={[20, 50, 100]}
        // VIRTUAL SCROLL CONFIGURATION
        virtualScroll={{
          enabled: true,
          pageSize: 20,
          bufferSize: 3,
          onLoadMore: async (nextPage) => {
            try {
              const result = await loadMore(nextPage)
              return result
            } catch (error) {
              console.error("Error loading more data:", error)
              throw error
            }
          },
        }}
        onRefresh={async () => {
          showLoader()
          try {
            await loadData(1)
          } finally {
            hideLoader()
          }
        }}
        showSearch={true}
        showRefreshButton={true}
        showClearFiltersButton={true}
      />
    </div>
  )
}
