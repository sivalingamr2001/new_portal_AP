# API Client Reference

This document contains all server API endpoints exposed by `Server/Web/API/Controllers`, sample response payloads, TypeScript React DTOs, and ready-to-use API client objects using `apiService`.

> Note: these clients assume `apiService` is exported from `access_portal_UI/src/api/axiosClient.ts` and that your API base URL is configured in `ENV_CONFIG.BASE_API_URL`.

---

## Shared Types

```ts
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
```

---

## Auth API

### Types

```ts
export interface LoginValues {
  identifier: string
  password: string
}

export interface LoginResponse {
  user: UserProfile | null
  department: DepartmentDto | null
  headOfDepartment: HodDto | null
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
```

### Endpoints

#### `POST /api/auth/login`

Request body:

```json
{
  "identifier": "E001",
  "password": "password123"
}
```

Sample response:

```json
{
  "user": {
    "id": 1,
    "name": "Demo Admin",
    "role": "ADMIN",
    "location": "Default",
    "employeeId": "E001",
    "email": "e001@demo.com",
    "mobileNumber": 0,
    "departmentId": 101
  },
  "department": {
    "id": 101,
    "name": "IT Department",
    "hodId": "HOD001"
  },
  "headOfDepartment": {
    "id": 5,
    "name": "Demo HOD",
    "employeeId": "E003",
    "email": "e003@demo.com",
    "mobileNumber": "0000000000"
  }
}
```

#### `POST /api/auth/logout`

Response:

```json
{
  "message": "Logged out."
}
```

### Client

```ts
import { apiService } from "@/api/axiosClient"

export const authApi = {
  login: async (values: LoginValues): Promise<LoginResponse> => {
    const response = await apiService.post<LoginResponse>("/Auth/login", values)
    return response.data
  },

  logout: async (): Promise<{ message: string }> => {
    const response = await apiService.post<{ message: string }>("/Auth/logout")
    return response.data
  },
}
```

---

## Users API

### Types

```ts
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
```

### Endpoints

#### `GET /api/users/cmpl`

Query params: `page`, `pageSize`, `search`

Response: `PagedResult<CmplUserDto>`

#### `GET /api/users/cmpl/{id}`

Response: `CmplUserDto`

#### `GET /api/users/hods`

Query params: `page`, `pageSize`, `search`

Response: `PagedResult<HodDto>`

#### `GET /api/users/hods/{id}`

Response: `HodDto`

#### `GET /api/users`

Query params: `page`, `pageSize`, `search`

Response: `PagedResult<PortalUserDetails>`

#### `GET /api/users/{id}`

Response: `PortalUserDetails`

#### `PUT /api/users/{id}`

Request body: `UpsertPortalUserDto`

Response: `200 OK`

#### `DELETE /api/users/{id}`

Response: `204 No Content`

### Client

```ts
export const usersApi = {
  getCmplUsers: async (
    params?: PaginationParams & { search?: string }
  ): Promise<PagedResult<CmplUserDto>> => {
    const response = await apiService.get<PagedResult<CmplUserDto>>("/users/cmpl", {
      params,
    })
    return response.data
  },

  getCmplUser: async (id: number): Promise<CmplUserDto> => {
    const response = await apiService.get<CmplUserDto>(`/users/cmpl/${id}`)
    return response.data
  },

  getHods: async (
    params?: PaginationParams & { search?: string }
  ): Promise<PagedResult<HodDto>> => {
    const response = await apiService.get<PagedResult<HodDto>>("/users/hods", {
      params,
    })
    return response.data
  },

  getHod: async (id: number): Promise<HodDto> => {
    const response = await apiService.get<HodDto>(`/users/hods/${id}`)
    return response.data
  },

  getPortalUsers: async (
    params?: PaginationParams & { search?: string }
  ): Promise<PagedResult<PortalUserDetails>> => {
    const response = await apiService.get<PagedResult<PortalUserDetails>>("/users", {
      params,
    })
    return response.data
  },

  getPortalUser: async (id: number): Promise<PortalUserDetails> => {
    const response = await apiService.get<PortalUserDetails>(`/users/${id}`)
    return response.data
  },

  updatePortalUser: async (
    id: number,
    dto: UpsertPortalUserDto
  ): Promise<void> => {
    await apiService.put<void>(`/users/${id}`, dto)
  },

  deletePortalUser: async (id: number): Promise<void> => {
    await apiService.delete<void>(`/users/${id}`)
  },
}
```

---

## Departments API

### Types

```ts
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
```

### Endpoints

#### `GET /api/departments`

Query params: `page`, `pageSize`, `search`

Response: `PagedResult<DepartmentDetailDto>`

#### `GET /api/departments/{id}`

Response: `DepartmentDetailDto`

#### `PUT /api/departments/{id}`

Request body: `UpsertDepartmentDto`

Response: `200 OK`

#### `DELETE /api/departments/{id}`

Response: `204 No Content`

### Client

```ts
export const departmentsApi = {
  getDepartments: async (
    params?: PaginationParams & { search?: string }
  ): Promise<PagedResult<DepartmentDetailDto>> => {
    const response = await apiService.get<PagedResult<DepartmentDetailDto>>("/departments", {
      params,
    })
    return response.data
  },

  getDepartment: async (id: number): Promise<DepartmentDetailDto> => {
    const response = await apiService.get<DepartmentDetailDto>(`/departments/${id}`)
    return response.data
  },

  updateDepartment: async (
    id: number,
    dto: UpsertDepartmentDto
  ): Promise<void> => {
    await apiService.put<void>(`/departments/${id}`, dto)
  },

  deleteDepartment: async (id: number): Promise<void> => {
    await apiService.delete<void>(`/departments/${id}`)
  },
}
```

---

## Access Requests API

### Types

```ts
export interface SubmitAccessRequestDto {
  reqTo: number
  isAgreed: boolean
  items: AccessItemRequestDto[]
}

export interface AccessItemRequestDto {
  folderPath: string
  accessType: AccessTypes
  reason: string
}

export interface AccessRequestDetailDto {
  requestId: number
  userId: number
  currentStatus: RequestStatus
  itsrNo: string | null
  createdOn: string
  items: AccessItemDto[]
}

export interface AccessItemDto {
  itemId: number
  ticketNumber: string
  folderPath: string
  accessType: AccessTypes
  confirmAccessType: AccessTypes
  status: RequestStatus
  reason: string
  rejectionReason: string | null
  approvedAtUtc: string | null
  expiresAtUtc: string | null
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

export interface OverrideAccessTypeDto {
  accessType: AccessTypes
}
```

### Endpoints

#### `POST /api/access-requests`

Request body: `SubmitAccessRequestDto`

Response: created request id (number)

#### `POST /api/access-requests/hod`

Request body: `SubmitAccessRequestDto`

Response: created request id (number)

#### `GET /api/access-requests/{id}`

Response: `AccessRequestDetailDto`

#### `GET /api/access-requests/my`

Query params: `page`, `pageSize`

Response: `PagedResult<AccessRequestSummaryDto>`

#### `POST /api/access-requests/items/{itemId}/resubmit`

Request body:

```json
{
  "reason": "Resubmitting with corrected access reason"
}
```

Response: `200 OK`

#### `POST /api/access-requests/items/{itemId}/renew`

Request body:

```json
{
  "reason": "Renewing access for continued work"
}
```

Response: `200 OK`

### Client

```ts
export const accessRequestsApi = {
  submitRequest: async (
    dto: SubmitAccessRequestDto
  ): Promise<number> => {
    const response = await apiService.post<number>("/access-requests", dto)
    return response.data
  },

  submitHodRequest: async (
    dto: SubmitAccessRequestDto
  ): Promise<number> => {
    const response = await apiService.post<number>("/access-requests/hod", dto)
    return response.data
  },

  getRequestDetail: async (
    id: number
  ): Promise<AccessRequestDetailDto> => {
    const response = await apiService.get<AccessRequestDetailDto>(`/access-requests/${id}`)
    return response.data
  },

  getMyRequests: async (
    params?: PaginationParams
  ): Promise<PagedResult<AccessRequestSummaryDto>> => {
    const response = await apiService.get<PagedResult<AccessRequestSummaryDto>>("/access-requests/my", {
      params,
    })
    return response.data
  },

  resubmitItem: async (itemId: number, dto: ItemActionDto): Promise<void> => {
    await apiService.post<void>(`/access-requests/items/${itemId}/resubmit`, dto)
  },

  renewItem: async (itemId: number, dto: ItemActionDto): Promise<void> => {
    await apiService.post<void>(`/access-requests/items/${itemId}/renew`, dto)
  },
}
```

---

## Folder Mappings API

### Types

```ts
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
```

### Endpoints

#### `GET /api/folder-mappings`

Query params: `page`, `pageSize`, `search`

Response: `PagedResult<FolderMappingDto>`

#### `GET /api/folder-mappings/{id}`

Response: `FolderMappingDto`

#### `POST /api/folder-mappings`

Request body: `UpsertFolderMappingRequest`

Response: created mapping id (number)

#### `PUT /api/folder-mappings/{id}`

Request body: `UpsertFolderMappingRequest`

Response: `200 OK`

#### `DELETE /api/folder-mappings/{id}`

Response: `204 No Content`

#### `GET /api/folder-mappings/parents`

Response: `FolderResponse[]`

#### `GET /api/folder-mappings/hierarchy`

Response: `FolderResponse[]`

### Client

```ts
export const folderMappingsApi = {
  getFolderMappings: async (
    params?: PaginationParams & { search?: string }
  ): Promise<PagedResult<FolderMappingDto>> => {
    const response = await apiService.get<PagedResult<FolderMappingDto>>("/folder-mappings", {
      params,
    })
    return response.data
  },

  getFolderMapping: async (id: number): Promise<FolderMappingDto> => {
    const response = await apiService.get<FolderMappingDto>(`/folder-mappings/${id}`)
    return response.data
  },

  createFolderMapping: async (
    dto: UpsertFolderMappingRequest
  ): Promise<number> => {
    const response = await apiService.post<number>("/folder-mappings", dto)
    return response.data
  },

  updateFolderMapping: async (
    id: number,
    dto: UpsertFolderMappingRequest
  ): Promise<void> => {
    await apiService.put<void>(`/folder-mappings/${id}`, dto)
  },

  deleteFolderMapping: async (id: number): Promise<void> => {
    await apiService.delete<void>(`/folder-mappings/${id}`)
  },

  getParentFolders: async (): Promise<FolderResponse[]> => {
    const response = await apiService.get<FolderResponse[]>("/folder-mappings/parents")
    return response.data
  },

  getFolderHierarchy: async (): Promise<FolderResponse[]> => {
    const response = await apiService.get<FolderResponse[]>("/folder-mappings/hierarchy")
    return response.data
  },
}
```

---

## Dashboard API

### Types

```ts
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

export interface RecentRequestDto {
  requestId: number
  userId: number
  status: string
  createdOn: string
  itemCount: number
}
```

### Endpoint

#### `GET /api/dashboard`

Response: `DashboardDto`

### Client

```ts
export const dashboardApi = {
  getDashboard: async (): Promise<DashboardDto> => {
    const response = await apiService.get<DashboardDto>("/dashboard")
    return response.data
  },
}
```

---

## HOD Cart API

### Types

```ts
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
```

### Endpoints

#### `GET /api/hod-cart`

Query params: `page`, `pageSize`

Response: `PagedResult<HodCartItemDto>`

#### `POST /api/hod-cart/items/{itemId}/approve`

Request body: `ItemActionDto`

Response: `200 OK`

#### `POST /api/hod-cart/items/{itemId}/reject`

Request body: `ItemActionDto`

Response: `200 OK`

#### `POST /api/hod-cart/requests/{requestId}/approve-all`

Request body: `ItemActionDto`

Response: `200 OK`

### Client

```ts
export const hodCartApi = {
  getCart: async (
    params?: PaginationParams
  ): Promise<PagedResult<HodCartItemDto>> => {
    const response = await apiService.get<PagedResult<HodCartItemDto>>("/hod-cart", {
      params,
    })
    return response.data
  },

  approveItem: async (itemId: number, dto: ItemActionDto): Promise<void> => {
    await apiService.post<void>(`/hod-cart/items/${itemId}/approve`, dto)
  },

  rejectItem: async (itemId: number, dto: ItemActionDto): Promise<void> => {
    await apiService.post<void>(`/hod-cart/items/${itemId}/reject`, dto)
  },

  approveAll: async (requestId: number, dto: ItemActionDto): Promise<void> => {
    await apiService.post<void>(`/hod-cart/requests/${requestId}/approve-all`, dto)
  },
}
```

---

## Operator Cart API

### Types

```ts
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
```

### Endpoints

#### `GET /api/operator-cart`

Query params: `page`, `pageSize`

Response: `PagedResult<OperatorCartItemDto>`

#### `POST /api/operator-cart/items/{itemId}/approve`

Request body: `ItemActionDto`

Response: `200 OK`

#### `POST /api/operator-cart/items/{itemId}/reject`

Request body: `ItemActionDto`

Response: `200 OK`

#### `POST /api/operator-cart/items/{itemId}/revoke`

Request body: `ItemActionDto`

Response: `200 OK`

#### `PATCH /api/operator-cart/items/{itemId}/access-type`

Request body: `OverrideAccessTypeDto`

Response: `200 OK`

### Client

```ts
export const operatorCartApi = {
  getCart: async (
    params?: PaginationParams
  ): Promise<PagedResult<OperatorCartItemDto>> => {
    const response = await apiService.get<PagedResult<OperatorCartItemDto>>("/operator-cart", {
      params,
    })
    return response.data
  },

  approveItem: async (itemId: number, dto: ItemActionDto): Promise<void> => {
    await apiService.post<void>(`/operator-cart/items/${itemId}/approve`, dto)
  },

  rejectItem: async (itemId: number, dto: ItemActionDto): Promise<void> => {
    await apiService.post<void>(`/operator-cart/items/${itemId}/reject`, dto)
  },

  revokeItem: async (itemId: number, dto: ItemActionDto): Promise<void> => {
    await apiService.post<void>(`/operator-cart/items/${itemId}/revoke`, dto)
  },

  overrideAccessType: async (
    itemId: number,
    dto: OverrideAccessTypeDto
  ): Promise<void> => {
    await apiService.patch<void>(`/operator-cart/items/${itemId}/access-type`, dto)
  },
}
```

---

## Notifications API

### Types

```ts
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
```

### Endpoints

#### `GET /api/notifications`

Query params: `unreadOnly` (boolean)

Response: `NotificationDto[]`

#### `GET /api/notifications/unread-count`

Response:

```json
{
  "count": 3
}
```

#### `PATCH /api/notifications/{id}/mark-read`

Response: `200 OK`

#### `PATCH /api/notifications/mark-all-read`

Response: `200 OK`

### Client

```ts
export const notificationsApi = {
  getNotifications: async (unreadOnly = false): Promise<NotificationDto[]> => {
    const response = await apiService.get<NotificationDto[]>("/notifications", {
      params: { unreadOnly },
    })
    return response.data
  },

  getUnreadCount: async (): Promise<{ count: number }> => {
    const response = await apiService.get<{ count: number }>("/notifications/unread-count")
    return response.data
  },

  markRead: async (id: number): Promise<void> => {
    await apiService.patch<void>(`/notifications/${id}/mark-read`)
  },

  markAllRead: async (): Promise<void> => {
    await apiService.patch<void>("/notifications/mark-all-read")
  },
}
```

---

## Common Error Shape

```ts
export interface ApiErrorResponse {
  code: string
  message: string
  type: "Failure" | "Validation" | "NotFound" | "Conflict"
}
```

> Use the shared `ApiError` type from `axiosClient.ts` if you want to unify error handling.
