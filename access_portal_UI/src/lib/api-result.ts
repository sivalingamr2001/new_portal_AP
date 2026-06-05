import type {
  AccessRequestDetailDto,
  AccessRequestSummaryDto,
  AccessTypes,
  DepartmentDetailDto,
  HodCartItemDto,
  HodDto,
  NotificationDto,
  OperatorCartItemDto,
  PagedResult,
  PortalUserDetails,
  RequestStatus,
} from "@/api"

export interface Result<T> {
  isSuccess: boolean
  isFailure: boolean
  error: { message: string } | null
  value: T | undefined
}

export type AccessType = AccessTypes

export interface AccessNotificationDto extends NotificationDto {}

export interface AccessRequestItemRow {
  accessItemId: number
  itemId: number
  ticketNumber: string
  folderPath: string
  accessType: AccessTypes
  confirmAccessType: AccessTypes
  reason: string
  rejectionReason: string | null
  status: RequestStatus
  requestedAtUtc: string
  lastActionAtUtc: string
  approvedAtUtc: string | null
  expiresAtUtc: string | null
}

export interface AccessRequestDto {
  accessReqId: number
  requestId: number
  userId: number
  userName: string
  userEmail: string
  reqTo: number
  isAgreed: boolean
  itsrNo: string | null
  currentStatus: RequestStatus
  currentApproverId: number
  requestedAtUtc: string
  lastActionAtUtc: string
  createdOn: string
  totalItems?: number
  approvedItems?: number
  rejectedItems?: number
  requestedBy?: string
  department?: string
  items: AccessRequestItemRow[]
}

export interface DepartmentResponseDto {
  department: {
    deptId: number
    deptName: string | null
    hodId: string | null
  }
  hod: {
    hodId: string | null
    hodName: string | null
    emailId: string | null
    mobNo: string | null
  } | null
  users: unknown[]
}

export const toResult = <T>(value: T): Result<T> => ({
  isSuccess: true,
  isFailure: false,
  error: null,
  value,
})

export const toFailure = <T>(error: unknown): Result<T> => ({
  isSuccess: false,
  isFailure: true,
  error: {
    message: error instanceof Error ? error.message : "Request failed",
  },
  value: undefined,
})

export const emptyPage = <T>(page = 1, pageSize = 10): PagedResult<T> => ({
  data: [],
  totalCount: 0,
  page,
  pageSize,
  totalPages: 0,
  hasNextPage: false,
  hasPreviousPage: false,
})

export const accessStatusRank: Record<RequestStatus, number> = {
  Submitted: 1,
  PendingWithHod: 2,
  PendingWithIt: 3,
  HodApproved: 3,
  ItApproved: 4,
  HodRejected: 5,
  ItRejected: 5,
  Revoked: 6,
  Expired: 7,
}

export const accessTypeLabel = (type?: AccessTypes | null) => {
  if (type === "ReadOnly") return "Read Only"
  if (type === "ReadandWrite") return "Read & Write"
  return "Not Applicable"
}

export const normalizeUserDetails = (item: PortalUserDetails) => ({
  cmplUser: {
    cmplUserId: item.user?.id ?? 0,
    cmplUserName: item.user?.name ?? "",
    empId: item.user?.employeeId ?? null,
    mailId: item.user?.email ?? "",
    mobNo: item.user?.mobileNumber ? String(item.user.mobileNumber) : "",
    deptId: item.user?.departmentId ?? 0,
  },
  user: {
    userId: item.user?.id ?? 0,
    role: item.user?.role ?? "",
    location: item.user?.location ?? "",
  },
  department: {
    deptId: item.department?.id ?? item.user?.departmentId ?? 0,
    deptName: item.department?.name ?? null,
  },
  hod: item.headOfDepartment
    ? {
        hodId: Number(item.headOfDepartment.id) || 0,
        name: item.headOfDepartment.name ?? "",
      }
    : null,
})

export const normalizeHod = (hod: HodDto) => ({
  idRow: Number(hod.id) || 0,
  hodName: hod.name ?? "",
  id: String(hod.id),
  emailId: hod.email ?? "",
  mobNo: hod.mobileNumber ?? "",
})

export const normalizeDepartment = (
  department: DepartmentDetailDto
): DepartmentResponseDto => ({
  department: {
    deptId: department.id,
    deptName: department.name,
    hodId: department.hodId,
  },
  hod: {
    hodId: department.hodId,
    hodName: department.hodName,
    emailId: department.hodEmail,
    mobNo: null,
  },
  users: [],
})

export const normalizeSummaryRequest = (
  request: AccessRequestSummaryDto
): AccessRequestDto => ({
  accessReqId: request.requestId,
  requestId: request.requestId,
  userId: 0,
  userName: `Request #${request.requestId}`,
  userEmail: "",
  reqTo: 0,
  isAgreed: true,
  itsrNo: request.itsrNo,
  currentStatus: request.currentStatus,
  currentApproverId: 0,
  requestedAtUtc: request.createdOn,
  lastActionAtUtc: request.createdOn,
  createdOn: request.createdOn,
  totalItems: request.totalItems,
  approvedItems: request.approvedItems,
  rejectedItems: request.rejectedItems,
  items: [],
})

export const normalizeDetailRequest = (
  request: AccessRequestDetailDto
): AccessRequestDto => ({
  accessReqId: request.requestId,
  requestId: request.requestId,
  userId: request.userId,
  userName: `User #${request.userId}`,
  userEmail: "",
  reqTo: 0,
  isAgreed: true,
  itsrNo: request.itsrNo,
  currentStatus: request.currentStatus,
  currentApproverId: 0,
  requestedAtUtc: request.createdOn,
  lastActionAtUtc: request.createdOn,
  createdOn: request.createdOn,
  items: request.items.map((item) => ({
    accessItemId: item.itemId,
    itemId: item.itemId,
    ticketNumber: item.ticketNumber,
    folderPath: item.folderPath,
    accessType: item.accessType,
    confirmAccessType: item.confirmAccessType,
    reason: item.reason,
    rejectionReason: item.rejectionReason,
    status: item.status,
    requestedAtUtc: request.createdOn,
    lastActionAtUtc: item.approvedAtUtc ?? request.createdOn,
    approvedAtUtc: item.approvedAtUtc,
    expiresAtUtc: item.expiresAtUtc,
  })),
})

export const normalizeHodCartItem = (item: HodCartItemDto): AccessRequestDto => ({
  accessReqId: item.requestId,
  requestId: item.requestId,
  userId: item.requesterUserId,
  userName: `User #${item.requesterUserId}`,
  userEmail: "",
  reqTo: 0,
  isAgreed: true,
  itsrNo: null,
  currentStatus: "PendingWithHod",
  currentApproverId: 0,
  requestedAtUtc: item.submittedAt,
  lastActionAtUtc: item.submittedAt,
  createdOn: item.submittedAt,
  requestedBy: `User #${item.requesterUserId}`,
  items: [
    {
      accessItemId: item.itemId,
      itemId: item.itemId,
      ticketNumber: item.ticketNumber,
      folderPath: item.folderPath,
      accessType: item.accessType,
      confirmAccessType: item.accessType,
      reason: item.reason,
      rejectionReason: null,
      status: "PendingWithHod",
      requestedAtUtc: item.submittedAt,
      lastActionAtUtc: item.submittedAt,
      approvedAtUtc: null,
      expiresAtUtc: null,
    },
  ],
})

export const normalizeOperatorCartItem = (
  item: OperatorCartItemDto
): AccessRequestDto => ({
  accessReqId: item.requestId,
  requestId: item.requestId,
  userId: item.requesterUserId,
  userName: `User #${item.requesterUserId}`,
  userEmail: "",
  reqTo: item.hodApproverId ?? 0,
  isAgreed: true,
  itsrNo: null,
  currentStatus: "PendingWithIt",
  currentApproverId: 0,
  requestedAtUtc: item.submittedAt,
  lastActionAtUtc: item.submittedAt,
  createdOn: item.submittedAt,
  requestedBy: `User #${item.requesterUserId}`,
  items: [
    {
      accessItemId: item.itemId,
      itemId: item.itemId,
      ticketNumber: item.ticketNumber,
      folderPath: item.folderPath,
      accessType: item.requestedAccessType,
      confirmAccessType: item.confirmedAccessType,
      reason: item.reason,
      rejectionReason: null,
      status: "PendingWithIt",
      requestedAtUtc: item.submittedAt,
      lastActionAtUtc: item.submittedAt,
      approvedAtUtc: null,
      expiresAtUtc: null,
    },
  ],
})
