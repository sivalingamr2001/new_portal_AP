import { DataGrid } from "@/components/DynamicGrid/Index"
import type { DetailSectionConfig } from "@/components/DynamicGrid/types"
import { Button } from "@/components/ui/button"
import type { ColDef } from "ag-grid-community"
import { ChevronUp, TextQuote } from "lucide-react"
import { useCallback, useMemo, useState, useEffect } from "react"
import type { UserRowPayload } from "./types"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { usersApi } from "@/api"
import { useLoader } from "@/hooks/useLoader"
import { useLocation } from "react-router-dom"
import { getTitleFromSidebar } from "@/lib/getTitleFromSidebar"
import { usePaginatedDataGrid } from "@/hooks/usePaginatedDataGrid"
import type { PagedResult } from "@/api"
import {
  normalizeUserDetails,
  toFailure,
  toResult,
  type Result,
} from "@/lib/api-result"
import { EditUsersModal } from "@/components/Users/EditUsersModal"

const USERS_PAGE_CHUNK_SIZE = 20

export const UsersPage = () => {
  const location = useLocation()
  const [expandedRowIds, setExpandedRowIds] = useState<number[]>([])
  const { showLoader, hideLoader } = useLoader()
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<any>(null)

  const handleEditAction = (userData: any) => {
    setSelectedUser(userData)
    setIsEditModalOpen(true)
  }

  const { title } = useMemo(
    () => getTitleFromSidebar(location.pathname),
    [location.pathname]
  )

  const handleUsersError = useCallback(
    (error: Error) => {
      console.error(
        "Failed to load user records:",
        error
      )
      hideLoader()
    },
    [hideLoader]
  )

  const fetchUsersPage = useCallback(
    async (page: number, pageSize: number) => {
      try {
        const result = await usersApi.getPortalUsers({
          page,
          pageSize,
        })

        return toResult({
          ...result,
          data: result.data.map(normalizeUserDetails),
        } satisfies PagedResult<UserRowPayload>)
      } catch (error) {
        return toFailure<PagedResult<UserRowPayload>>(error)
      }
    },
    []
  )

  const {
    rowData: users,
    totalPages,
    currentPage,
    loading,
    loadData,
    loadMore,
  } = usePaginatedDataGrid<UserRowPayload>(
    fetchUsersPage,
    {
      pageSize: USERS_PAGE_CHUNK_SIZE,
      onError: handleUsersError,
    }
  )

  useEffect(() => {
    showLoader()
    loadData(1).finally(hideLoader)
  }, [hideLoader, loadData, showLoader])

  const toggleRowExpansion = useCallback((id: number) => {
    setExpandedRowIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }, [])

  // FIX 2: Restored the free-tier row interleaving proxy transformer engine
  const computedRowData = useMemo(() => {
    const flatList: any[] = []
    users.forEach((row) => {
      flatList.push(row)
      if (expandedRowIds.includes(row.cmplUser.cmplUserId)) {
        flatList.push({
          __isDetailRow: true,
          __parentData: row,
          cmplUser: { cmplUserId: `detail_${row.cmplUser.cmplUserId}` },
        })
      }
    })
    return flatList
  }, [users, expandedRowIds])

  const dynamicSectionsConfig = useMemo<DetailSectionConfig[]>(
    () => [
      { title: "Core User Profile Info", objectKey: "user" },
      { title: "Compliance Audit Status", objectKey: "cmplUser" },
      { title: "Corporate Department Details", objectKey: "department" },
    ],
    []
  )

  const columns = useMemo<(Omit<ColDef<any>, "field"> & { field?: string })[]>(
    () => [
      {
        headerName: "",
        width: 80,
        suppressMovable: true,
        filter: false,
        sortable: false,
        cellRenderer: (params: any) => {
          if (params.data?.__isDetailRow) return null
          const isExpanded = expandedRowIds.includes(
            params.data?.cmplUser?.cmplUserId
          )

          return (
            /* FIX: Replaced primitive prop-string structure with declarative layout elements */
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 cursor-pointer font-bold text-slate-500 transition hover:text-indigo-600"
                  onClick={() =>
                    toggleRowExpansion(params.data.cmplUser.cmplUserId)
                  }
                >
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <TextQuote className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                {isExpanded ? "Collapse Details" : "Expand Details"}
              </TooltipContent>
            </Tooltip>
          )
        },
      },
      { headerName: "User ID", field: "cmplUser.cmplUserId" },
      { headerName: "Employee ID", field: "cmplUser.emp_id" },
      { headerName: "Username", field: "cmplUser.cmplUserName" },
      { headerName: "Email Address", field: "cmplUser.mailId" },
      { headerName: "Mobile", field: "cmplUser.mobNo" },
      { headerName: "Department ID", field: "department.deptId" },
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
    [handleEditAction, expandedRowIds, toggleRowExpansion]
  )

  const handleUserUpdate = async (updatedData: any) => {
    try {
      showLoader()
      if (!selectedUser) return
      await usersApi.updatePortalUser(selectedUser.cmplUser.cmplUserId, {
        cmplUserId: selectedUser.cmplUser.cmplUserId,
        role: updatedData.role,
        location: updatedData.location,
      })
      await loadData(1) // Refresh the grid after update
    }
    catch (error) {
      console.error("Failed to update user:", error)
    }
    finally {
      hideLoader()
      setIsEditModalOpen(false)
    }
  }

  const globalCustomActions = useMemo(() => [], [])

  return (
    <div className="w-full space-y-4">
      <DataGrid
        title={title}
        rowData={computedRowData}
        rowSelection='none'
        columnDefs={columns}
        gridId="compliance_users_free_v35"
        pageSize={USERS_PAGE_CHUNK_SIZE}
        pageSizeOptions={[20, 50, 100]}
        loading={loading}
        showSearch={true}
        showRefreshButton={true}
        showClearFiltersButton={true}
        customActions={globalCustomActions}
        onRefresh={async () => {
          showLoader()
          try {
            await loadData(1)
          } finally {
            hideLoader()
          }
        }}
        theme="system"
        masterDetail={false}
        detailSections={dynamicSectionsConfig}
        gridHeight="550px"
        virtualScroll={{
          enabled: true,
          pageSize: USERS_PAGE_CHUNK_SIZE,
          bufferSize: 3,
          currentPage,
          totalPages,
          hasMore: currentPage < totalPages,
          onLoadMore: async (nextPage: number) => {
            await loadMore(nextPage)
          },
        }}
      />
      <EditUsersModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        userData={selectedUser}
        onSave={(updatedData) => {
          handleUserUpdate(updatedData)
        }}
      />
    </div>
  )
}
