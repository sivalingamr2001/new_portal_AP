import { apiService } from "@/api/axiosClient"
import type {
  AccessNotificationDto,
  AccessRequestDto,
  ApprovalActionRequestDto,
  ResubmitAccessRequestDto,
  SubmitAccessRequestDto,
} from "@/api/types"

const accessRequestApi = {
  getAll: async (userId?: number) => {
    const { data } = await apiService.get<AccessRequestDto[]>(
      "/accessrequest",
      {
        params: userId === undefined ? undefined : { userId },
      }
    )

    return data
  },

  getById: async (accessReqId: number): Promise<AccessRequestDto> => {
    const { data } = await apiService.get<AccessRequestDto>(
      `/accessrequest/${accessReqId}`
    )

    return data
  },

  submit: async (
    payload: SubmitAccessRequestDto
  ): Promise<AccessRequestDto> => {
    const { data } = await apiService.post<
      AccessRequestDto,
      SubmitAccessRequestDto
    >("/accessrequest", payload)

    return data
  },

  getHodCart: async (approverId: number): Promise<AccessRequestDto[]> => {
    const { data } = await apiService.get<AccessRequestDto[]>(
      `/accessrequest/cart/hod/${approverId}`
    )

    return data
  },

  getItCart: async (): Promise<AccessRequestDto[]> => {
    const { data } = await apiService.get<AccessRequestDto[]>(
      "/accessrequest/cart/it"
    )

    return data
  },

  approveByHod: async (
    accessReqId: number,
    accessItemId: number,
    payload: ApprovalActionRequestDto
  ): Promise<AccessRequestDto> => {
    const { data } = await apiService.post<
      AccessRequestDto,
      ApprovalActionRequestDto
    >(
      `/accessrequest/${accessReqId}/items/${accessItemId}/hod/approve`,
      payload
    )

    return data
  },

  rejectByHod: async (
    accessReqId: number,
    accessItemId: number,
    payload: ApprovalActionRequestDto
  ): Promise<AccessRequestDto> => {
    const { data } = await apiService.post<
      AccessRequestDto,
      ApprovalActionRequestDto
    >(`/accessrequest/${accessReqId}/items/${accessItemId}/hod/reject`, payload)

    return data
  },

  approveByIt: async (
    accessReqId: number,
    accessItemId: number,
    payload: ApprovalActionRequestDto
  ): Promise<AccessRequestDto> => {
    const { data } = await apiService.post<
      AccessRequestDto,
      ApprovalActionRequestDto
    >(`/accessrequest/${accessReqId}/items/${accessItemId}/it/approve`, payload)

    return data
  },

  rejectByIt: async (
    accessReqId: number,
    accessItemId: number,
    payload: ApprovalActionRequestDto
  ): Promise<AccessRequestDto> => {
    const { data } = await apiService.post<
      AccessRequestDto,
      ApprovalActionRequestDto
    >(`/accessrequest/${accessReqId}/items/${accessItemId}/it/reject`, payload)

    return data
  },

  resubmit: async (
    accessReqId: number,
    accessItemId: number,
    payload: ResubmitAccessRequestDto
  ): Promise<AccessRequestDto> => {
    const { data } = await apiService.post<
      AccessRequestDto,
      ResubmitAccessRequestDto
    >(`/accessrequest/${accessReqId}/items/${accessItemId}/resubmit`, payload)

    return data
  },

  revoke: async (
    accessReqId: number,
    accessItemId: number,
    payload: ApprovalActionRequestDto
  ): Promise<AccessRequestDto> => {
    const { data } = await apiService.post<
      AccessRequestDto,
      ApprovalActionRequestDto
    >(`/accessrequest/${accessReqId}/items/${accessItemId}/revoke`, payload)

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
