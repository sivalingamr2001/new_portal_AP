import { apiService, ApiException, type PaginationParams, type PagedResult, type AccessTypes, type RequestStatus } from "./axiosClient"

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AccessItemRequestDto {
  folderPath: string
  accessType: AccessTypes
  reason: string
}

export interface SubmitAccessRequestDto {
  reqTo: number
  isAgreed: boolean
  items: AccessItemRequestDto[]
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

// ─── Client ───────────────────────────────────────────────────────────────────

export const accessRequestsApi = {
  submitRequest: async (dto: SubmitAccessRequestDto): Promise<number> => {
    try {
      const response = await apiService.post<number>("/access-requests", dto)
      return response.data
    } catch (error) {
      if (error instanceof ApiException) throw error
      throw new ApiException(
        { code: "SUBMIT_REQUEST_FAILED", message: "Failed to submit access request.", type: "Failure" },
        0
      )
    }
  },

  submitHodRequest: async (dto: SubmitAccessRequestDto): Promise<number> => {
    try {
      const response = await apiService.post<number>("/access-requests/hod", dto)
      return response.data
    } catch (error) {
      if (error instanceof ApiException) throw error
      throw new ApiException(
        { code: "SUBMIT_HOD_REQUEST_FAILED", message: "Failed to submit HOD access request.", type: "Failure" },
        0
      )
    }
  },

  getRequestDetail: async (id: number): Promise<AccessRequestDetailDto> => {
    try {
      const response = await apiService.get<AccessRequestDetailDto>(`/access-requests/${id}`)
      return response.data
    } catch (error) {
      if (error instanceof ApiException) throw error
      throw new ApiException(
        { code: "FETCH_REQUEST_DETAIL_FAILED", message: `Failed to fetch access request ${id}.`, type: "Failure" },
        0
      )
    }
  },

  getMyRequests: async (params?: PaginationParams): Promise<PagedResult<AccessRequestSummaryDto>> => {
    try {
      const response = await apiService.get<PagedResult<AccessRequestSummaryDto>>("/access-requests/my", { params })
      return response.data
    } catch (error) {
      if (error instanceof ApiException) throw error
      throw new ApiException(
        { code: "FETCH_MY_REQUESTS_FAILED", message: "Failed to fetch your access requests.", type: "Failure" },
        0
      )
    }
  },

  resubmitItem: async (itemId: number, dto: ItemActionDto): Promise<void> => {
    try {
      await apiService.post<void>(`/access-requests/items/${itemId}/resubmit`, dto)
    } catch (error) {
      if (error instanceof ApiException) throw error
      throw new ApiException(
        { code: "RESUBMIT_ITEM_FAILED", message: `Failed to resubmit access item ${itemId}.`, type: "Failure" },
        0
      )
    }
  },

  renewItem: async (itemId: number, dto: ItemActionDto): Promise<void> => {
    try {
      await apiService.post<void>(`/access-requests/items/${itemId}/renew`, dto)
    } catch (error) {
      if (error instanceof ApiException) throw error
      throw new ApiException(
        { code: "RENEW_ITEM_FAILED", message: `Failed to renew access item ${itemId}.`, type: "Failure" },
        0
      )
    }
  },
}
