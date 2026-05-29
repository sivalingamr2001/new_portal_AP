import { DataGrid } from "@/components/DynamicGrid/Index"
import type { ColDef } from "ag-grid-community"
import { useCallback, useMemo, useState, useEffect } from "react"
import accessRequestApi from "@/api/accessRequestApi"
import type { AccessRequestDto, AccessRequestItemDto, RequestStatus } from "@/api/types"
import { useLoader } from "@/hooks/useLoader"
import { getTitleFromSidebar } from "@/lib/getTitleFromSidebar"
import { useLocation } from "react-router-dom"
import { ChevronUp, Pencil, Plus, RefreshCw, TextQuote } from "lucide-react"
import CreateRequestModal from "@/components/AccessRequest/Create/CreateRequestModal"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

type RequestGridRow =
  | AccessRequestDto
  | {
      __isItemRow: true
      __parentData: AccessRequestDto
      accessReqId: string
      item: AccessRequestItemDto
    }

const statusLabels: Record<string, string> = {
  "1": "Submitted",
  "2": "Pending With HOD",
  "3": "Pending With IT",
  "4": "HOD Approved",
  "5": "IT Approved",
  "6": "HOD Rejected",
  "7": "IT Rejected",
  "8": "Revoked",
  "9": "Expired",
  Submitted: "Submitted",
  PendingWithHod: "Pending With HOD",
  PendingWithIt: "Pending With IT",
  HodApproved: "HOD Approved",
  ItApproved: "IT Approved",
  HodRejected: "HOD Rejected",
  ItRejected: "IT Rejected",
  Revoked: "Revoked",
  Expired: "Expired",
}

const accessTypeLabels: Record<string, string> = {
  "0": "Not Applicable",
  "1": "Read Only",
  "2": "Read and Write",
  NotApplicable: "Not Applicable",
  ReadOnly: "Read Only",
  ReadandWrite: "Read and Write",
}

const formatDate = (value?: string | null) => {
  if (!value) return "-"
  return new Date(value).toLocaleDateString()
}

const formatStatus = (value?: RequestStatus | null) =>
  statusLabels[String(value ?? "")] ?? String(value ?? "-")

const formatAccessType = (value: unknown) =>
  accessTypeLabels[String(value ?? "")] ?? String(value ?? "-")

const isRejected = (status: RequestStatus) =>
  status === "HodRejected" || status === "ItRejected" || status === 6 || status === 7

const isRenewable = (status: RequestStatus) =>
  status === "Revoked" || status === "Expired" || status === 8 || status === 9

export const MyRequestsPage = () => {
  const location = useLocation()

  const [requests, setRequests] = useState<AccessRequestDto[]>([])
  const [expandedRowIds, setExpandedRowIds] = useState<number[]>([])
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<"create" | "resubmit" | "renew">(
    "create"
  )
  const [selectedRequest, setSelectedRequest] = useState<AccessRequestDto | null>(
    null
  )
  const [selectedItem, setSelectedItem] = useState<AccessRequestItemDto | null>(
    null
  )

  const { loading, withLoader } = useLoader()

  const { title } = useMemo(
    () => getTitleFromSidebar(location.pathname),
    [location.pathname]
  )

  const fetchRequests = useCallback(async () => {
    try {
      const result = await withLoader(() =>
        accessRequestApi.getAll()
      )

      if (
        !result.isSuccess ||
        !result.value
      ) {
        console.error(
          "Failed to load requests:",
          result.error?.message
        )
        return
      }

      setRequests(result.value.data)
    } catch (error) {
      console.error(
        "Failed to load requests:",
        error
      )
    }
  }, [withLoader])

  useEffect(() => {
    fetchRequests()
  }, [fetchRequests])

  const toggleRowExpansion = useCallback((id: number) => {
    setExpandedRowIds((previous) =>
      previous.includes(id)
        ? previous.filter((item) => item !== id)
        : [...previous, id]
    )
  }, [])

  const openCreateModal = useCallback(() => {
    setModalMode("create")
    setSelectedRequest(null)
    setSelectedItem(null)
    setIsCreateModalOpen(true)
  }, [])

  const openItemModal = useCallback(
    (
      mode: "resubmit" | "renew",
      request: AccessRequestDto,
      item: AccessRequestItemDto
    ) => {
      setModalMode(mode)
      setSelectedRequest(request)
      setSelectedItem(item)
      setIsCreateModalOpen(true)
    },
    []
  )

  const computedRowData = useMemo<RequestGridRow[]>(() => {
    const rows: RequestGridRow[] = []

    requests.forEach((request) => {
      rows.push(request)

      if (expandedRowIds.includes(request.accessReqId)) {
        request.items.forEach((item) => {
          rows.push({
            __isItemRow: true,
            __parentData: request,
            accessReqId: `item_${request.accessReqId}_${item.accessItemId}`,
            item,
          })
        })
      }
    })

    return rows
  }, [expandedRowIds, requests])

  const columns = useMemo<
    (Omit<ColDef<any>, "field"> & {
      field?: string
    })[]
  >(
    () => [
      {
        headerName: "",
        width: 72,
        suppressMovable: true,
        filter: false,
        sortable: false,
        cellRenderer: (params: any) => {
          if (params.data?.__isItemRow) return null

          const isExpanded = expandedRowIds.includes(params.data.accessReqId)

          return (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => toggleRowExpansion(params.data.accessReqId)}
                >
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <TextQuote className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                {isExpanded ? "Collapse Items" : "Show Items"}
              </TooltipContent>
            </Tooltip>
          )
        },
      },
      {
        headerName: "Request ID",
        field: "accessReqId",
        width: 100,
        valueGetter: (params: any) =>
          params.data?.__isItemRow ? params.data.item.ticketNumber : params.data?.accessReqId,
      },
      {
        headerName: "User Name",
        field: "userName",
        width: 150,
        valueGetter: (params: any) =>
          params.data?.__isItemRow ? "Item" : params.data?.userName,
      },
      {
        headerName: "Folder / Email",
        field: "userEmail",
        width: 240,
        valueGetter: (params: any) =>
          params.data?.__isItemRow ? params.data.item.folderPath : params.data?.userEmail,
      },
      {
        headerName: "Status",
        field: "currentStatus",
        width: 120,
        valueGetter: (params: any) =>
          formatStatus(
            params.data?.__isItemRow
              ? params.data.item.status
              : params.data?.currentStatus
          ),
      },
      {
        headerName: "Access Type",
        field: "items",
        width: 140,
        valueGetter: (params: any) =>
          params.data?.__isItemRow
            ? formatAccessType(params.data.item.accessType)
            : `${params.data?.items?.length ?? 0} item(s)`,
      },
      {
        headerName: "Requested Date",
        field: "requestedAtUtc",
        width: 150,
        valueGetter: (params: any) =>
          formatDate(
            params.data?.__isItemRow
              ? params.data.item.requestedAtUtc
              : params.data?.requestedAtUtc
          ),
      },
      {
        headerName: "Last Action",
        field: "lastActionAtUtc",
        width: 150,
        valueGetter: (params: any) =>
          formatDate(
            params.data?.__isItemRow
              ? params.data.item.lastActionAtUtc
              : params.data?.lastActionAtUtc
          ),
      },
      {
        headerName: "Reason / ITSR",
        field: "itsrNo",
        width: 220,
        valueGetter: (params: any) =>
          params.data?.__isItemRow ? params.data.item.reason : params.data?.itsrNo ?? "-",
      },
      {
        headerName: "Actions",
        width: 140,
        sortable: false,
        filter: false,
        cellRenderer: (params: any) => {
          if (!params.data?.__isItemRow) return null

          const item = params.data.item as AccessRequestItemDto
          const request = params.data.__parentData as AccessRequestDto

          if (isRejected(item.status)) {
            return (
              <Button
                size="sm"
                variant="outline"
                className="h-7 px-2 text-xs"
                onClick={() => openItemModal("resubmit", request, item)}
              >
                <Pencil className="mr-1 h-3.5 w-3.5" />
                Resubmit
              </Button>
            )
          }

          if (isRenewable(item.status)) {
            return (
              <Button
                size="sm"
                variant="outline"
                className="h-7 px-2 text-xs"
                onClick={() => openItemModal("renew", request, item)}
              >
                <RefreshCw className="mr-1 h-3.5 w-3.5" />
                Renew
              </Button>
            )
          }

          return null
        },
      },
    ],
    [expandedRowIds, openItemModal, toggleRowExpansion]
  )

  const globalCustomActions = useMemo(
    () => [
      {
        label: "Create Request",
        icon: <Plus className="h-4 w-4" />,
        variant: "default" as const,
        onClick: openCreateModal,
      },
    ],
    [openCreateModal]
  )

  return (
    <div className="space-y-4">
      <DataGrid
        rowData={computedRowData}
        columnDefs={columns}
        title={title}
        loading={loading}
        onRefresh={fetchRequests}
        showRefreshButton
        showSearch
        showClearFiltersButton
        customActions={globalCustomActions}
        noRowsMessage="No access requests found"
        pageSize={10}
        rowSelection="none"
      />

      <CreateRequestModal
        isOpen={isCreateModalOpen}
        mode={modalMode}
        request={selectedRequest}
        item={selectedItem}
        onClose={() =>
          setIsCreateModalOpen(false)
        }
        onSuccess={fetchRequests}
      />
    </div>
  )
}

export default MyRequestsPage
