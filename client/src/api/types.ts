// Result & Pagination Wrappers
export interface Error {
  message: string
  code?: string
}

export interface Result<T = void> {
  value?: T
  isSuccess: boolean
  isFailure: boolean
  error?: Error | null
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

export type ApiResponse<T> = Result<T>
export type PagedApiResponse<T> = Result<PagedResult<T>>

export interface CmplUser {
  cmplUserId: number
  cmplUserName: string
  empId: number | null
  mailId: string | null
  mobNo: string
  deptId: number
}

export interface User {
  userId: number
  role: string
  location: string
}

export interface Department {
  deptId: number
  deptName: string | null
}

export interface LoginUserData {
  cmplUser: CmplUser
  user: User
  department: Department
  hod: any | null
}

export type LoginResponse = ApiResponse<LoginUserData>

export interface UserDto {
  userId: number
  role: string
  location: string
}

export interface CmplUserDto {
  cmplUserId: number
  cmplUserName: string
  empId?: string | null
  mailId?: string | null
  mobNo?: string | null
  deptId?: number | null
}

export interface EmployeeDto {
  cmplUserId: number
  cmplUserName: string
  empId?: string | null
  mailId?: string | null
  mobNo?: string | null
}

export interface DepartmentDto {
  deptId: number
  deptName?: string | null
}

export interface HodDto {
  idRow?: number
  hodName: string
  id?: string | null
  emailId?: string | null
  mobNo?: string | null
}

export interface ApiLoginResponseDto {
  cmplUser: CmplUserDto
  user: UserDto
  department?: DepartmentDto | null
  hod?: HodDto | null
}

export interface LoginResponseDto {
  employee: EmployeeDto
  user: UserDto
  department: DepartmentDto
  hod: HodDto
}

export interface DepartmentResponseDto {
  department: DepartmentDto
  hod?: HodDto | null
  users: CmplUserDto[]
}

export interface FolderMappingDto {
  id: number
  folderPath: string
  primaryHodId?: string | null
  primaryHodName?: string | null
  primaryHodEmail?: string | null
  secondaryHodId?: string | null
  secondaryHodName?: string | null
  secondaryHodEmail?: string | null
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

export type AccessType =
  | "NotApplicable"
  | "ReadOnly"
  | "ReadandWrite"
  | 0
  | 1
  | 2

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
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9

export interface SubmitAccessRequestItemDto {
  folderPath: string
  accessType: AccessType
  confirmAccessType: AccessType
  reason: string
}

export interface SubmitAccessRequestDto {
  userId: number
  isAgreed: boolean
  itsrNo?: string | null
  items: SubmitAccessRequestItemDto[]
}

export interface ApprovalActionRequestDto {
  approverId: number
  comments?: string | null
  confirmAccessType?: AccessType | null
}

export interface ResubmitAccessRequestDto {
  userId: number
  accessType?: AccessType | null
  confirmAccessType?: AccessType | null
  reason: string
}

export interface AccessApprovalDto {
  accessApproveId: number
  accessItemId: number
  approverId: number
  approvalLevel: string
  approvalStatus: RequestStatus
  comments: string
  actionedAtUtc: string
}

export interface AccessRequestItemDto {
  accessItemId: number
  ticketNumber: string
  folderPath: string
  accessType: AccessType
  confirmAccessType: AccessType
  reason: string
  rejectionReason?: string | null
  status: RequestStatus
  hodApproverId?: number | null
  itApproverId?: number | null
  requestedAtUtc: string
  lastActionAtUtc: string
  approvedAtUtc?: string | null
  expiresAtUtc?: string | null
  approvals: AccessApprovalDto[]
}

export interface AccessRequestDto {
  accessReqId: number
  userId: number
  userName: string
  userEmail?: string | null
  reqTo: number
  isAgreed: boolean
  itsrNo?: string | null
  currentStatus: RequestStatus
  currentApproverId?: number | null
  requestedAtUtc: string
  lastActionAtUtc: string
  items: AccessRequestItemDto[]
}

export interface AccessNotificationDto {
  auditId: number
  eventType: string
  message: string
  isRead: boolean
  createdAtUtc: string
}
