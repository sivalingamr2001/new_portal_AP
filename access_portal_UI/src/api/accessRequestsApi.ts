import type {
  PaginatedListDto,
  PaginationParams,
  AccessRequestSummaryDto,
  AccessRequestSearchParams,
  CreateRequestDto,
  CreateRequestResponseDto,
  ProcessApprovalDto,
  FinalizeProvisioningDto,
  RevokeAccessDto,
  RenewAccessDto,
  ResubmitRequestDto,
  ResubmitResponseDto,
  RequestStatus,
} from "./types"
import {
  mockAccessRequests,
  createPaginatedResponse,
  filterBySearchTerm,
} from "./mockData"

export const accessRequestsApi = {
  /**
   * GET /api/access-requests (MOCK)
   * Returns paginated list of mock access requests with optional filtering.
   */
  getAllRequests: async (
    params?: AccessRequestSearchParams
  ): Promise<PaginatedListDto<AccessRequestSummaryDto>> => {
    await new Promise((resolve) => setTimeout(resolve, 300))
    
    let filtered = mockAccessRequests
    if (params?.search) {
      filtered = filterBySearchTerm(filtered, params.search, [
        "folderPath",
        "reason",
        "requesterName",
      ])
    }
    
    if (params?.status) {
      filtered = filtered.filter((r) => r.status === params.status)
    }
    
    return createPaginatedResponse(
      filtered,
      params?.pageNumber || 1,
      params?.pageSize || 20
    )
  },

  /**
   * GET /api/access-requests/my (MOCK)
   * Returns current user's own requests.
   */
  getMyRequests: async (
    params?: { page?: number; pageSize?: number; status?: RequestStatus }
  ): Promise<PaginatedListDto<AccessRequestSummaryDto>> => {
    await new Promise((resolve) => setTimeout(resolve, 300))
    
    let filtered = mockAccessRequests
    if (params?.status) {
      filtered = filtered.filter((r) => r.status === params.status)
    }
    
    return createPaginatedResponse(
      filtered,
      params?.page || 1,
      params?.pageSize || 10
    )
  },

  /**
   * GET /api/access-requests/by-user/{userId} (MOCK)
   */
  getRequestsByUser: async (
    userId: number
  ): Promise<PaginatedListDto<AccessRequestSummaryDto>> => {
    await new Promise((resolve) => setTimeout(resolve, 300))
    const filtered = mockAccessRequests.filter(
      (r) => r.requesterUserId === userId
    )
    return createPaginatedResponse(filtered, 1, 10)
  },

  /**
   * GET /api/access-requests/by-department/{deptId} (MOCK)
   */
  getRequestsByDepartment: async (
    deptId: number
  ): Promise<PaginatedListDto<AccessRequestSummaryDto>> => {
    await new Promise((resolve) => setTimeout(resolve, 300))
    // Mock implementation - filter by department if applicable
    return createPaginatedResponse(mockAccessRequests, 1, 10)
  },

  /**
   * GET /api/access-requests/my-folder-queue (MOCK)
   * Items queued for the current user's folders (HOD approval queue).
   */
  getMyFolderQueue: async (
    params?: PaginationParams
  ): Promise<PaginatedListDto<AccessRequestSummaryDto>> => {
    await new Promise((resolve) => setTimeout(resolve, 300))
    const pending = mockAccessRequests.filter((r) => r.status === "Pending")
    return createPaginatedResponse(
      pending,
      params?.pageNumber || 1,
      params?.pageSize || 10
    )
  },

  /**
   * POST /api/access-requests (MOCK)
   * Submit a new access request.
   */
  submitRequest: async (
    dto: CreateRequestDto
  ): Promise<CreateRequestResponseDto> => {
    await new Promise((resolve) => setTimeout(resolve, 400))
    return {
      masterRequestId: Math.floor(Math.random() * 10000),
      message: "Request batch submitted successfully.",
    }
  },

  /**
   * POST /api/access-requests/items/{itemId}/approve (MOCK)
   * HOD approves or rejects a specific request item.
   */
  approveItem: async (
    itemId: number,
    dto: ProcessApprovalDto
  ): Promise<string> => {
    await new Promise((resolve) => setTimeout(resolve, 300))
    return `Ticket #${itemId} evaluation recorded.`
  },

  /**
   * POST /api/access-requests/items/{itemId}/provision (MOCK)
   * IT operator finalizes provisioning.
   */
  provisionItem: async (
    itemId: number,
    dto: FinalizeProvisioningDto
  ): Promise<string> => {
    await new Promise((resolve) => setTimeout(resolve, 300))
    return `Provisioning for ticket #${itemId} completed.`
  },

  /**
   * POST /api/access-requests/items/{itemId}/revoke (MOCK)
   * Revokes an active access item.
   */
  revokeItem: async (
    itemId: number,
    dto: RevokeAccessDto
  ): Promise<string> => {
    await new Promise((resolve) => setTimeout(resolve, 300))
    return `Access for ticket #${itemId} has been revoked.`
  },

  /**
   * POST /api/access-requests/items/{itemId}/renew (MOCK)
   * Renews access for an item nearing expiry.
   */
  renewItem: async (
    itemId: number,
    dto: RenewAccessDto
  ): Promise<string> => {
    await new Promise((resolve) => setTimeout(resolve, 300))
    return `Access for ticket #${itemId} renewed by 90 days.`
  },

  /**
   * POST /api/access-requests/items/{itemId}/resubmit (MOCK)
   * Resubmits a previously rejected item.
   */
  resubmitItem: async (
    itemId: number,
    dto: ResubmitRequestDto
  ): Promise<ResubmitResponseDto> => {
    await new Promise((resolve) => setTimeout(resolve, 400))
    return {
      message: "Resubmission successful.",
      newMasterRequestId: Math.floor(Math.random() * 10000),
    }
  },
}
