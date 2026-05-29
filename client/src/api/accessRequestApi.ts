import { apiService, type PaginationParams } from "@/api/axiosClient"
import type {
  AccessNotificationDto,
  AccessRequestDto,
  ApprovalActionRequestDto,
  ResubmitAccessRequestDto,
  SubmitAccessRequestDto,
  Result,
  PagedResult,
} from "@/api/types"

const accessRequestApi = {
  getAll: async (
    userId?: number,
    params?: PaginationParams
  ): Promise<Result<PagedResult<AccessRequestDto>>> => {
    const { data } = await apiService.get<
      Result<PagedResult<AccessRequestDto>>
    >("/accessrequest", {
      params: {
        userId,
        page: params?.page ?? 1,
        pageSize: params?.pageSize ?? 10,
      },
    })
    return data
  },

  getById: async (accessReqId: number): Promise<Result<AccessRequestDto>> => {
    const { data } = await apiService.get<Result<AccessRequestDto>>(
      `/accessrequest/${accessReqId}`
    )
    return data
  },

  submit: async (
    payload: SubmitAccessRequestDto
  ): Promise<Result<AccessRequestDto>> => {
    const { data } = await apiService.post<Result<AccessRequestDto>>(
      "/accessrequest",
      payload
    )
    return data
  },

  getHodCart: async (
    approverId: number,
    params?: PaginationParams
  ): Promise<Result<PagedResult<AccessRequestDto>>> => {
    const { data } = await apiService.get<
      Result<PagedResult<AccessRequestDto>>
    >(`/accessrequest/cart/hod/${approverId}`, {
      params: {
        page: params?.page ?? 1,
        pageSize: params?.pageSize ?? 10,
      },
    })
    return data
  },

  getItCart: async (
    params?: PaginationParams
  ): Promise<Result<PagedResult<AccessRequestDto>>> => {
    const { data } = await apiService.get<
      Result<PagedResult<AccessRequestDto>>
    >("/accessrequest/cart/it", {
      params: {
        page: params?.page ?? 1,
        pageSize: params?.pageSize ?? 10,
      },
    })
    return data
  },

  approveByHod: async (
    accessReqId: number,
    accessItemId: number,
    payload: ApprovalActionRequestDto
  ): Promise<Result<AccessRequestDto>> => {
    const { data } = await apiService.post<Result<AccessRequestDto>>(
      `/accessrequest/${accessReqId}/items/${accessItemId}/hod/approve`,
      payload
    )
    return data
  },

  rejectByHod: async (
    accessReqId: number,
    accessItemId: number,
    payload: ApprovalActionRequestDto
  ): Promise<Result<AccessRequestDto>> => {
    const { data } = await apiService.post<Result<AccessRequestDto>>(
      `/accessrequest/${accessReqId}/items/${accessItemId}/hod/reject`,
      payload
    )
    return data
  },

  approveByIt: async (
    accessReqId: number,
    accessItemId: number,
    payload: ApprovalActionRequestDto
  ): Promise<Result<AccessRequestDto>> => {
    const { data } = await apiService.post<Result<AccessRequestDto>>(
      `/accessrequest/${accessReqId}/items/${accessItemId}/it/approve`,
      payload
    )
    return data
  },

  rejectByIt: async (
    accessReqId: number,
    accessItemId: number,
    payload: ApprovalActionRequestDto
  ): Promise<Result<AccessRequestDto>> => {
    const { data } = await apiService.post<Result<AccessRequestDto>>(
      `/accessrequest/${accessReqId}/items/${accessItemId}/it/reject`,
      payload
    )
    return data
  },

  resubmit: async (
    accessReqId: number,
    accessItemId: number,
    payload: ResubmitAccessRequestDto
  ): Promise<Result<AccessRequestDto>> => {
    const { data } = await apiService.post<Result<AccessRequestDto>>(
      `/accessrequest/${accessReqId}/items/${accessItemId}/resubmit`,
      payload
    )
    return data
  },

  revoke: async (
    accessReqId: number,
    accessItemId: number,
    payload: ApprovalActionRequestDto
  ): Promise<Result<AccessRequestDto>> => {
    const { data } = await apiService.post<Result<AccessRequestDto>>(
      `/accessrequest/${accessReqId}/items/${accessItemId}/revoke`,
      payload
    )
    return data
  },

  getNotifications: async (
    userId: number
  ): Promise<AccessNotificationDto[]> => {
    const { data } = await apiService.get<AccessNotificationDto[]>(
      `/accessrequest/notifications/${userId}`
    )
    return data
  },

  markNotificationAsRead: async (
    auditId: number,
    userId: number
  ): Promise<void> => {
    await apiService.post(
      `/accessrequest/notifications/${auditId}/read`,
      undefined,
      {
        params: { userId },
      }
    )
  },
}

export default accessRequestApi
