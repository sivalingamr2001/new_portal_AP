import type { ColDef } from "ag-grid-community"

export const accessRequestColumns: (
  Omit<ColDef<object>, "field"> & {
    field?: string
  }
)[] = [
  {
    headerName: "",
    width: 72,
    suppressMovable: true,
    sortable: false,
    filter: false,
  },
  {
    headerName: "Request ID",
    field: "accessReqId",
    width: 120,
  },
  {
    headerName: "User Name",
    field: "userName",
    width: 160,
  },
  {
    headerName: "Folder / Email",
    field: "userEmail",
    width: 240,
  },
  {
    headerName: "Status",
    field: "currentStatus",
    width: 140,
  },
  {
    headerName: "Access Type",
    field: "items",
    width: 160,
  },
  {
    headerName: "Requested Date",
    field: "requestedAtUtc",
    width: 160,
  },
  {
    headerName: "Last Action",
    field: "lastActionAtUtc",
    width: 160,
  },
  {
    headerName: "Reason / ITSR",
    field: "itsrNo",
    width: 220,
  },
  {
    headerName: "Actions",
    width: 140,
    sortable: false,
    filter: false,
  },
]