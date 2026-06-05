export interface AccessItemRequestDto {
  folderPath: string
  accessType: AccessTypes
  confirmAccessType?: AccessTypes
  reason: string
}

export interface SubmitAccessRequestDto {
  userId?: number
  reqTo?: number
  isAgreed: boolean
  itsrNo?: string | null
  items: AccessItemRequestDto[]
}

export interface AccessItemDto {
  itemId: number
  ticketNumber: string
  folderPath: string
  accessType: AccessTypes
  requestedAtUtc?: string
  confirmAccessType: AccessTypes
  status: RequestStatus
  reason: string
  rejectionReason: string | null
  approvedAtUtc: string | null
  expiresAtUtc: string | null
}

export interface AccessRequestDetailDto {
  requestId: number
  userId: number
  currentStatus: RequestStatus
  itsrNo: string | null
  createdOn: string
  items: AccessItemDto[]
}

export interface AccessRequestSummaryDto {
  requestId: number
  currentStatus: RequestStatus
  itsrNo: string | null
  createdOn: string
  totalItems: number
  approvedItems: number
  rejectedItems: number
}

export interface ItemActionDto {
  reason: string
  confirmAccessType?: AccessTypes | null
  comments?: string | null
}

// ─── Notification Types ────────────────────────────────────────────────────────────────────

export interface NotificationDto {
  auditId: number
  eventType: string
  message: string
  ticketNumber: string | null
  accessReqId: number
  accessItemId: number | null
  isRead: boolean
  readAtUtc: string | null
  createdOn: string
}

// ─── Users Types ────────────────────────────────────────────────────────────────────

export interface CmplUserDto {
  id: number
  name: string | null
  employeeId: string | null
  email: string | null
  mobileNumber: number | null
  departmentId: number | null
}

export interface PortalUserDto {
  id: number
  name: string
  employeeId: string | null
  email: string | null
  mobileNumber: number | null
  departmentId: number | null
  role: string
  location: string
  isActive: boolean
  createdOn: string
}

export interface PortalUserDetails {
  user: UserProfile | null
  department: DepartmentDto | null
  headOfDepartment: HodDto | null
}

export interface UpsertPortalUserDto {
  cmplUserId: number
  role: string
  location: string
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LoginValues {
  identifier: string
  password: string
}

export interface UserProfile {
  id: number
  name: string | null
  role: string
  location: string
  employeeId: string | null
  email: string | null
  mobileNumber: number | null
  departmentId: number | null
}

export interface DepartmentDto {
  id: number
  name: string | null
  hodId: string | null
}

export interface HodDto {
  id: number
  name: string | null
  employeeId: string | null
  email: string | null
  mobileNumber: string | null
}

export interface LoginResponse {
  user: UserProfile | null
  department: DepartmentDto | null
  headOfDepartment: HodDto | null
}

// ─── Shared Types ────────────────────────────────────────────────────────────

export interface ApiError {
  code: string
  message: string
  type: "Failure" | "Validation" | "NotFound" | "Conflict"
}

export interface PaginationParams {
  page?: number
  pageSize?: number
}

export interface PagedResult<T> {
  data: T[]
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export type AccessTypes = "NotApplicable" | "ReadOnly" | "ReadandWrite"

export type RequestStatus =
  | "Submitted"
  | "PendingWithHod"
  | "PendingWithIt"
  | "HodApproved"
  | "ItApproved"
  | "HodRejected"
  | "ItRejected"
  | "Revoked"
  | "Expired"

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RecentRequestDto {
  requestId: number
  userId: number
  status: string
  createdOn: string
  itemCount: number
}

export interface DashboardDto {
  totalRequests: number
  pendingWithHod: number
  pendingWithIt: number
  approvedActive: number
  hodRejected: number
  itRejected: number
  revoked: number
  expired: number
  expiringSoon: number
  myPendingItems: number
  myApprovedItems: number
  myRejectedItems: number
  recentRequests: RecentRequestDto[]
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DepartmentDetailDto {
  id: number
  name: string | null
  hodId: string | null
  hodName: string | null
  hodEmail: string | null
  isActive: boolean
  createdOn: string
}

export interface UpsertDepartmentDto {
  name: string
  hodId?: string | null
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FolderMappingDto {
  id: number
  folderPath: string
  primaryHodId: string | null
  primaryHodName: string | null
  primaryHodEmail: string | null
  secondaryHodId: string | null
  secondaryHodName: string | null
  secondaryHodEmail: string | null
}

export interface UpsertFolderMappingRequest {
  folderPath: string
  primaryHodId?: string | null
  primaryHodName?: string | null
  primaryHodEmail?: string | null
  secondaryHodId?: string | null
  secondaryHodName?: string | null
  secondaryHodEmail?: string | null
}

export interface FolderResponse {
  driveName: string
  name: string
  children: FolderResponse[]
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface HodCartItemDto {
  itemId: number
  requestId: number
  ticketNumber: string
  folderPath: string
  accessType: AccessTypes
  reason: string
  requesterUserId: number
  submittedAt: string
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OperatorCartItemDto {
  itemId: number
  requestId: number
  ticketNumber: string
  folderPath: string
  requestedAccessType: AccessTypes
  confirmedAccessType: AccessTypes
  reason: string
  hodApproverId: number | null
  requesterUserId: number
  submittedAt: string
}

export interface OverrideAccessTypeDto {
  accessType: AccessTypes
}

export interface Result<T> {
  isSuccess: boolean
  isFailure: boolean
  error: { message: string } | null
  value: T | undefined
}
