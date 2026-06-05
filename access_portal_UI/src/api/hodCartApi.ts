import { apiService, ApiException, type PaginationParams, type PagedResult, type AccessTypes } from "./axiosClient"
import type { ItemActionDto } from "./accessRequestsApi"

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

// ─── Client ───────────────────────────────────────────────────────────────────

export const hodCartApi = {
  getCart: async (params?: PaginationParams): Promise<PagedResult<HodCartItemDto>> => {
    try {
      const response = await apiService.get<PagedResult<HodCartItemDto>>("/hod-cart", { params })
      return response.data
    } catch (error) {
      if (error instanceof ApiException) throw error
      throw new ApiException(
        { code: "FETCH_HOD_CART_FAILED", message: "Failed to fetch HOD cart.", type: "Failure" },
        0
      )
    }
  },

  approveItem: async (itemId: number, dto: ItemActionDto): Promise<void> => {
    try {
      await apiService.post<void>(`/hod-cart/items/${itemId}/approve`, dto)
    } catch (error) {
      if (error instanceof ApiException) throw error
      throw new ApiException(
        { code: "HOD_APPROVE_ITEM_FAILED", message: `Failed to approve item ${itemId}.`, type: "Failure" },
        0
      )
    }
  },

  rejectItem: async (itemId: number, dto: ItemActionDto): Promise<void> => {
    try {
      await apiService.post<void>(`/hod-cart/items/${itemId}/reject`, dto)
    } catch (error) {
      if (error instanceof ApiException) throw error
      throw new ApiException(
        { code: "HOD_REJECT_ITEM_FAILED", message: `Failed to reject item ${itemId}.`, type: "Failure" },
        0
      )
    }
  },

  approveAll: async (requestId: number, dto: ItemActionDto): Promise<void> => {
    try {
      await apiService.post<void>(`/hod-cart/requests/${requestId}/approve-all`, dto)
    } catch (error) {
      if (error instanceof ApiException) throw error
      throw new ApiException(
        { code: "HOD_APPROVE_ALL_FAILED", message: `Failed to approve all items for request ${requestId}.`, type: "Failure" },
        0
      )
    }
  },
}
