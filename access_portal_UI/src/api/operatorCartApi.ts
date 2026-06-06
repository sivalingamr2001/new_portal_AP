import { ApiException, apiService } from "./axiosClient"
import type {
  ItemActionDto,
  OverrideAccessTypeDto
} from "./types"

export const operatorCartApi = {
  getCart: async (
    params?: any // Changed to any to absorb arbitrary factory input parameters safely
  ): Promise<any> => {
    // Returns any to allow downstream casting inside components
    try {
      // If the factory passes separate primitives or an unexpected string ID instead of a clean object,
      // normalize the structural layout before hitting the backend endpoint
      const queryParams = typeof params === "object" ? params : {}

      const response = await apiService.get<any>("/operator-cart", {
        params: queryParams,
      })
      return response.data
    } catch (error) {
      if (error instanceof ApiException) throw error
      throw new ApiException(
        {
          code: "FETCH_OPERATOR_CART_FAILED",
          message: "Failed to fetch operator cart.",
          type: "Failure",
        },
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
        {
          code: "OPERATOR_APPROVE_ITEM_FAILED",
          message: `Failed to approve item ${itemId}.`,
          type: "Failure",
        },
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
        {
          code: "OPERATOR_REJECT_ITEM_FAILED",
          message: `Failed to reject item ${itemId}.`,
          type: "Failure",
        },
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
        {
          code: "OPERATOR_REVOKE_ITEM_FAILED",
          message: `Failed to revoke item ${itemId}.`,
          type: "Failure",
        },
        0
      )
    }
  },

  overrideAccessType: async (
    itemId: number,
    dto: OverrideAccessTypeDto
  ): Promise<void> => {
    try {
      await apiService.patch<void>(
        `/operator-cart/items/${itemId}/access-type`,
        dto
      )
    } catch (error) {
      if (error instanceof ApiException) throw error
      throw new ApiException(
        {
          code: "OVERRIDE_ACCESS_TYPE_FAILED",
          message: `Failed to override access type for item ${itemId}.`,
          type: "Failure",
        },
        0
      )
    }
  },
}
