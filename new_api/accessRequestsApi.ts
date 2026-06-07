import { apiService, ApiException } from "./axiosClient"
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

export const accessRequestsApi = {
  /**
   * GET /api/access-requests
   * All requests (admin/IT view) with optional status, search, pagination.
   */
  getAllRequests: async (
    params?: AccessRequestSearchParams
  ): Promise<PaginatedListDto<AccessRequestSummaryDto>> => {
    try {
      const response = await apiService.get<PaginatedListDto<AccessRequestSummaryDto>>(
        "/access-requests",
        { params }
      )
      return response.data
    } catch (error) {
      if (error instanceof ApiException) throw error
      throw new ApiException(
        { code: "FETCH_REQUESTS_FAILED", message: "Failed to fetch access requests.", type: "Failure" },
        0
      )
    }
  },

  /**
   * GET /api/access-requests/my
   * The current user's own requests (filtered by X-User-Id header).
   */
  getMyRequests: async (
    params?: { page?: number; pageSize?: number; status?: RequestStatus }
  ): Promise<PaginatedListDto<AccessRequestSummaryDto>> => {
    try {
      const response = await apiService.get<PaginatedListDto<AccessRequestSummaryDto>>(
        "/access-requests/my",
        { params }
      )
      return response.data
    } catch (error) {
      if (error instanceof ApiException) throw error
      throw new ApiException(
        { code: "FETCH_MY_REQUESTS_FAILED", message: "Failed to fetch your access requests.", type: "Failure" },
        0
      )
    }
  },

  /**
   * GET /api/access-requests/by-user/{userId}
   */
  getRequestsByUser: async (
    userId: number
  ): Promise<PaginatedListDto<AccessRequestSummaryDto>> => {
    try {
      const response = await apiService.get<PaginatedListDto<AccessRequestSummaryDto>>(
        `/access-requests/by-user/${userId}`
      )
      return response.data
    } catch (error) {
      if (error instanceof ApiException) throw error
      throw new ApiException(
        {
          code: "FETCH_USER_REQUESTS_FAILED",
          message: `Failed to fetch requests for user ${userId}.`,
          type: "Failure",
        },
        0
      )
    }
  },

  /**
   * GET /api/access-requests/by-department/{deptId}
   */
  getRequestsByDepartment: async (
    deptId: number
  ): Promise<PaginatedListDto<AccessRequestSummaryDto>> => {
    try {
      const response = await apiService.get<PaginatedListDto<AccessRequestSummaryDto>>(
        `/access-requests/by-department/${deptId}`
      )
      return response.data
    } catch (error) {
      if (error instanceof ApiException) throw error
      throw new ApiException(
        {
          code: "FETCH_DEPT_REQUESTS_FAILED",
          message: `Failed to fetch requests for department ${deptId}.`,
          type: "Failure",
        },
        0
      )
    }
  },

  /**
   * GET /api/access-requests/my-folder-queue
   * Items queued for the current user's folders (HOD approval queue).
   */
  getMyFolderQueue: async (
    params?: PaginationParams
  ): Promise<PaginatedListDto<AccessRequestSummaryDto>> => {
    try {
      const response = await apiService.get<PaginatedListDto<AccessRequestSummaryDto>>(
        "/access-requests/my-folder-queue",
        { params }
      )
      return response.data
    } catch (error) {
      if (error instanceof ApiException) throw error
      throw new ApiException(
        { code: "FETCH_FOLDER_QUEUE_FAILED", message: "Failed to fetch folder queue.", type: "Failure" },
        0
      )
    }
  },

  /**
   * POST /api/access-requests
   * Submit a new access request (user submits for themselves).
   * Returns { masterRequestId, message }.
   */
  submitRequest: async (
    dto: CreateRequestDto
  ): Promise<CreateRequestResponseDto> => {
    try {
      const response = await apiService.post<CreateRequestResponseDto>(
        "/access-requests",
        dto
      )
      return response.data
    } catch (error) {
      if (error instanceof ApiException) throw error
      throw new ApiException(
        { code: "SUBMIT_REQUEST_FAILED", message: "Failed to submit access request.", type: "Failure" },
        0
      )
    }
  },

  /**
   * POST /api/access-requests/items/{itemId}/approve
   * HOD approves or rejects a specific request item.
   * decision: "Approved" | "Rejected"
   */
  approveItem: async (
    itemId: number,
    dto: ProcessApprovalDto
  ): Promise<string> => {
    try {
      const response = await apiService.post<string>(
        `/access-requests/items/${itemId}/approve`,
        dto
      )
      return response.data
    } catch (error) {
      if (error instanceof ApiException) throw error
      throw new ApiException(
        {
          code: "APPROVE_ITEM_FAILED",
          message: `Failed to process approval for item ${itemId}.`,
          type: "Failure",
        },
        0
      )
    }
  },

  /**
   * POST /api/access-requests/items/{itemId}/provision
   * IT operator finalizes provisioning (Completed or Rejected).
   */
  provisionItem: async (
    itemId: number,
    dto: FinalizeProvisioningDto
  ): Promise<string> => {
    try {
      const response = await apiService.post<string>(
        `/access-requests/items/${itemId}/provision`,
        dto
      )
      return response.data
    } catch (error) {
      if (error instanceof ApiException) throw error
      throw new ApiException(
        {
          code: "PROVISION_ITEM_FAILED",
          message: `Failed to provision item ${itemId}.`,
          type: "Failure",
        },
        0
      )
    }
  },

  /**
   * POST /api/access-requests/items/{itemId}/revoke
   * Revokes an active access item.
   */
  revokeItem: async (
    itemId: number,
    dto: RevokeAccessDto
  ): Promise<string> => {
    try {
      const response = await apiService.post<string>(
        `/access-requests/items/${itemId}/revoke`,
        dto
      )
      return response.data
    } catch (error) {
      if (error instanceof ApiException) throw error
      throw new ApiException(
        {
          code: "REVOKE_ITEM_FAILED",
          message: `Failed to revoke item ${itemId}.`,
          type: "Failure",
        },
        0
      )
    }
  },

  /**
   * POST /api/access-requests/items/{itemId}/renew
   * Renews access for an item nearing expiry.
   */
  renewItem: async (
    itemId: number,
    dto: RenewAccessDto
  ): Promise<string> => {
    try {
      const response = await apiService.post<string>(
        `/access-requests/items/${itemId}/renew`,
        dto
      )
      return response.data
    } catch (error) {
      if (error instanceof ApiException) throw error
      throw new ApiException(
        {
          code: "RENEW_ITEM_FAILED",
          message: `Failed to renew item ${itemId}.`,
          type: "Failure",
        },
        0
      )
    }
  },

  /**
   * POST /api/access-requests/items/{itemId}/resubmit
   * Resubmits a previously rejected item, optionally with an updated reason.
   * Returns { message, newMasterRequestId }.
   */
  resubmitItem: async (
    itemId: number,
    dto: ResubmitRequestDto
  ): Promise<ResubmitResponseDto> => {
    try {
      const response = await apiService.post<ResubmitResponseDto>(
        `/access-requests/items/${itemId}/resubmit`,
        dto
      )
      return response.data
    } catch (error) {
      if (error instanceof ApiException) throw error
      throw new ApiException(
        {
          code: "RESUBMIT_ITEM_FAILED",
          message: `Failed to resubmit item ${itemId}.`,
          type: "Failure",
        },
        0
      )
    }
  },
}
