import { apiService, ApiException } from "./axiosClient"
import type { PaginationParams, PagedResult, OperatorCartItemDto, ItemActionDto, OverrideAccessTypeDto } from "./types"

export const operatorCartApi = {
  getCart: async (params?: PaginationParams): Promise<PagedResult<OperatorCartItemDto>> => {
    try {
      const response = await apiService.get<PagedResult<OperatorCartItemDto>>("/operator-cart", { params })
      return response.data
    } catch (error) {
      if (error instanceof ApiException) throw error
      throw new ApiException(
        { code: "FETCH_OPERATOR_CART_FAILED", message: "Failed to fetch operator cart.", type: "Failure" },
        0
      )
    }
  },

  approveItem: async (itemId: number, dto: ItemActionDto): Promise<void> => {
    try {
      await apiService.post<void>(`/operator-cart/items/${itemId}/approve`, dto)
    } catch (error) {
      if (error instanceof ApiException) throw error
      throw new ApiException(
        { code: "OPERATOR_APPROVE_ITEM_FAILED", message: `Failed to approve item ${itemId}.`, type: "Failure" },
        0
      )
    }
  },

  rejectItem: async (itemId: number, dto: ItemActionDto): Promise<void> => {
    try {
      await apiService.post<void>(`/operator-cart/items/${itemId}/reject`, dto)
    } catch (error) {
      if (error instanceof ApiException) throw error
      throw new ApiException(
        { code: "OPERATOR_REJECT_ITEM_FAILED", message: `Failed to reject item ${itemId}.`, type: "Failure" },
        0
      )
    }
  },

  revokeItem: async (itemId: number, dto: ItemActionDto): Promise<void> => {
    try {
      await apiService.post<void>(`/operator-cart/items/${itemId}/revoke`, dto)
    } catch (error) {
      if (error instanceof ApiException) throw error
      throw new ApiException(
        { code: "OPERATOR_REVOKE_ITEM_FAILED", message: `Failed to revoke item ${itemId}.`, type: "Failure" },
        0
      )
    }
  },

  overrideAccessType: async (itemId: number, dto: OverrideAccessTypeDto): Promise<void> => {
    try {
      await apiService.patch<void>(`/operator-cart/items/${itemId}/access-type`, dto)
    } catch (error) {
      if (error instanceof ApiException) throw error
      throw new ApiException(
        { code: "OVERRIDE_ACCESS_TYPE_FAILED", message: `Failed to override access type for item ${itemId}.`, type: "Failure" },
        0
      )
    }
  },
}
