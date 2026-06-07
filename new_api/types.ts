// ─── Enums ────────────────────────────────────────────────────────────────────

export type AccessTypes = "NotApplicable" | "ReadOnly" | "ReadAndWrite"

export type RequestStatus =
  | "Pending"
  | "Approved"
  | "Rejected"
  | "ApprovedByHod"
  | "Completed"
  | "Revoked"
  | "Expired"
  | "ItemRejectedByIt"

// ─── Shared ───────────────────────────────────────────────────────────────────

export interface ApiError {
  code: string
  message: string
  type: "Failure" | "Validation" | "NotFound" | "Conflict"
}

export interface PaginationParams {
  page?: number
  pageSize?: number
}

export interface PaginatedListDto<T> {
  items: T[]
  pageNumber: number
  pageSize: number
  totalCount: number
  totalPages: number
  hasPreviousPage: boolean
  hasNextPage: boolean
}

// Keep PagedResult as alias so existing UI components that reference it still compile
export type PagedResult<T> = PaginatedListDto<T>

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface LoginRequestDto {
  userName: string
  userKey: string
}

/** @deprecated Use LoginRequestDto – kept for backward-compat with existing login form */
export interface LoginValues {
  identifier: string
  password: string
}

export interface AuthSessionResponseDto {
  userId: number
  userName: string
  userKey?: string
  mobileNo?: number
  mailId?: string
  deptId?: number
  empId?: string
  userRole: string
  location?: string
  authenticatedAtUtc: string
}

// ─── Users ────────────────────────────────────────────────────────────────────

export interface UserSearchParams extends PaginationParams {
  searchTerm?: string
  roleFilter?: string
  locationFilter?: string
}

export interface HodDetailResponse {
  hodName?: string
  hodEmployeeId?: string
  hodEmail?: string
  hodMobileNumber?: number
}

export interface DepartmentDetailResponse {
  departmentId: number
  departmentName: string
  hodId?: number
  hod?: HodDetailResponse
}

export interface UserProfileResponseDto {
  userId: number
  userName: string
  userKey?: string
  mobileNo?: number
  mailId?: string
  deptId?: number
  empId?: string
  userRole: string
  location?: string
  isActive: boolean
  department?: DepartmentDetailResponse
}

export interface HodUserDto {
  userId: number
  userName?: string
  email?: string
  departmentId?: number
}

// ─── Department ───────────────────────────────────────────────────────────────

export interface DepartmentSearchParams extends PaginationParams {
  searchTerm?: string
  hodId?: number
}

export interface UpdateDepartmentRequest {
  departmentId: number
  departmentName: string
  hodId?: number
}

// ─── Access Requests ──────────────────────────────────────────────────────────

export interface AccessRequestSearchParams extends PaginationParams {
  status?: RequestStatus
  search?: string
}

export interface AccessRequestSummaryDto {
  accessItemId: number
  accessReqId: number
  ticketNumber: string
  requesterUserId: number
  requesterName: string
  folderPath: string
  accessType: AccessTypes
  confirmedAccessType: AccessTypes
  reason: string
  status: RequestStatus
  accessFrom?: string
  accessTo?: string
  revokedOn?: string
  createdOn: string
}

export interface RequestedFolderItemDto {
  folderPath: string
  accessType: AccessTypes
  reason: string
}

export interface CreateRequestDto {
  items: RequestedFolderItemDto[]
  isAgreed: boolean
  itsrNo: string
}

export interface CreateRequestResponseDto {
  masterRequestId: number
  message: string
}

export interface ProcessApprovalDto {
  decision: RequestStatus
  comments: string
}

export interface FinalizeProvisioningDto {
  finalDecision: RequestStatus
  confirmedAccessType: AccessTypes
  operationalComments: string
}

export interface RevokeAccessDto {
  revocationReason: string
}

export interface RenewAccessDto {
  renewalNotes: string
}

export interface ResubmitRequestDto {
  updatedReason?: string
}

export interface ResubmitResponseDto {
  message: string
  newMasterRequestId: number
}

// ─── Folder Mappings ─────────────────────────────────────────────────────────

export interface FolderMappingDto {
  id: number
  folderPath: string
  primaryHodId?: string
  primaryHodName?: string
  primaryHodEmail?: string
  secondaryHodId?: string
  secondaryHodName?: string
  secondaryHodEmail?: string
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

export interface FolderMappingSearchParams extends PaginationParams {
  search?: string
}
