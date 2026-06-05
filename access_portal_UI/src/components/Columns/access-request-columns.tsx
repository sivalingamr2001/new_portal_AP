import type { ColDef } from "ag-grid-community"
import { Button } from "../ui/button"
import { ChevronUp, Pencil, RefreshCw, TextQuote, Eye } from "lucide-react" // Added Eye icon
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip"

// Types for your cell renderer parameters
interface AccessRequestColumnParams {
  data?: {
    __isItemRow?: boolean
    __parentData?: any
    accessReqId?: string
    userName?: string
    userEmail?: string
    currentStatus?: string
    items?: any[]
    requestedAtUtc?: string
    lastActionAtUtc?: string
    itsrNo?: string
    item?: {
      ticketNumber?: string
      folderPath?: string
      status?: string
      accessType?: string
      requestedAtUtc?: string
      lastActionAtUtc?: string
      reason?: string
    }
  }
}

// Helper types for the function-based definition
interface ColumnConfigDependencies {
  expandedRowIds: string[]
  toggleRowExpansion: (id: string) => void
  // Added "view" type to the modal actions
  openItemModal: (
    action: "resubmit" | "renew" | "view",
    request: any,
    item?: any
  ) => void
  formatStatus: (status?: string) => string
  formatAccessType: (type?: string) => string
  formatDate: (date?: string) => string
  isRejected: (status?: string) => boolean
  isRenewable: (status?: string) => boolean
}

export const getAccessRequestColumns = ({
  expandedRowIds,
  toggleRowExpansion,
  openItemModal,
  formatStatus,
  formatAccessType,
  formatDate,
  isRejected,
  isRenewable,
}: ColumnConfigDependencies): (Omit<ColDef<object>, "field"> & {
  field?: string
})[] => [
  {
    headerName: "",
    width: 72,
    suppressMovable: true,
    filter: false,
    sortable: false,
    cellRenderer: (params: AccessRequestColumnParams) => {
      if (params.data?.__isItemRow) return null
      if (!params.data?.accessReqId) return null

      const isExpanded = expandedRowIds.includes(params.data.accessReqId)

      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => toggleRowExpansion(params.data!.accessReqId!)}
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
    valueGetter: (params: AccessRequestColumnParams) =>
      params.data?.__isItemRow
        ? params.data.item?.ticketNumber
        : params.data?.accessReqId,
  },
  {
    headerName: "User Name",
    field: "userName",
    width: 150,
    valueGetter: (params: AccessRequestColumnParams) =>
      params.data?.__isItemRow ? "Item" : params.data?.userName,
  },
  {
    headerName: "Folder / Email",
    field: "userEmail",
    width: 240,
    valueGetter: (params: AccessRequestColumnParams) =>
      params.data?.__isItemRow
        ? params.data.item?.folderPath
        : params.data?.userEmail,
  },
  {
    headerName: "Status",
    field: "currentStatus",
    width: 120,
    valueGetter: (params: AccessRequestColumnParams) =>
      formatStatus(
        params.data?.__isItemRow
          ? params.data.item?.status
          : params.data?.currentStatus
      ),
  },
  {
    headerName: "Access Type",
    field: "items",
    width: 140,
    valueGetter: (params: AccessRequestColumnParams) =>
      params.data?.__isItemRow
        ? formatAccessType(params.data.item?.accessType)
        : `${params.data?.items?.length ?? 0} item(s)`,
  },
  {
    headerName: "Requested Date",
    field: "requestedAtUtc",
    width: 150,
    valueGetter: (params: AccessRequestColumnParams) =>
      formatDate(
        params.data?.__isItemRow
          ? params.data.item?.requestedAtUtc
          : params.data?.requestedAtUtc
      ),
  },
  {
    headerName: "Last Action",
    field: "lastActionAtUtc",
    width: 150,
    valueGetter: (params: AccessRequestColumnParams) =>
      formatDate(
        params.data?.__isItemRow
          ? params.data.item?.lastActionAtUtc
          : params.data?.lastActionAtUtc
      ),
  },
  {
    headerName: "Reason / ITSR",
    field: "itsrNo",
    width: 220,
    valueGetter: (params: AccessRequestColumnParams) =>
      params.data?.__isItemRow
        ? params.data.item?.reason
        : (params.data?.itsrNo ?? "-"),
  },
  {
    headerName: "Actions",
    width: 140,
    sortable: false,
    filter: false,
    cellRenderer: (params: AccessRequestColumnParams) => {
      if (!params.data) return null

      // Case 1: Parent Request Row Actions
      if (!params.data.__isItemRow) {
        return (
          <Button
            size="sm"
            variant="outline"
            className="h-7 px-2 text-xs"
            onClick={() => openItemModal("view", params.data)}
          >
            <Eye className="mr-1 h-3.5 w-3.5" />
            View
          </Button>
        )
      }

      // Case 2: Sub-item Row Actions
      const item = params.data.item
      const request = params.data.__parentData

      if (!item) return null

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
]
