import { ApiException, apiService } from "./axiosClient"
import type {
  PaginationParams,
  PagedResult,
  CmplUserDto,
  HodDto,
  PortalUserDetails,
  UpsertPortalUserDto,
} from "./types"

export const usersApi = {
  getCmplUsers: async (
    params?: PaginationParams & { search?: string }
  ): Promise<PagedResult<CmplUserDto>> => {
    try {
      const response = await apiService.get<PagedResult<CmplUserDto>>(
        "/users/cmpl",
        { params }
      )
      return response.data
    } catch (error) {
      if (error instanceof ApiException) throw error
      throw new ApiException(
        {
          code: "FETCH_CMPL_USERS_FAILED",
          message: "Failed to fetch CMPL users.",
          type: "Failure",
        },
        0
      )
    }
  },

  getCmplUser: async (id: number): Promise<CmplUserDto> => {
    try {
      const response = await apiService.get<CmplUserDto>(`/users/cmpl/${id}`)
      return response.data
    } catch (error) {
      if (error instanceof ApiException) throw error
      throw new ApiException(
        {
          code: "FETCH_CMPL_USER_FAILED",
          message: `Failed to fetch CMPL user with id ${id}.`,
          type: "Failure",
        },
        0
      )
    }
  },

  getHods: async (
    params?: PaginationParams & { search?: string }
  ): Promise<PagedResult<HodDto>> => {
    try {
      const response = await apiService.get<PagedResult<HodDto>>(
        "/users/hods",
        { params }
      )
      return response.data
    } catch (error) {
      if (error instanceof ApiException) throw error
      throw new ApiException(
        {
          code: "FETCH_HODS_FAILED",
          message: "Failed to fetch HODs.",
          type: "Failure",
        },
        0
      )
    }
  },

  getHod: async (id: number): Promise<HodDto> => {
    try {
      const response = await apiService.get<HodDto>(`/users/hods/${id}`)
      return response.data
    } catch (error) {
      if (error instanceof ApiException) throw error
      throw new ApiException(
        {
          code: "FETCH_HOD_FAILED",
          message: `Failed to fetch HOD with id ${id}.`,
          type: "Failure",
        },
        0
      )
    }
  },

  getPortalUsers: async (
    params?: PaginationParams & { search?: string }
  ): Promise<PagedResult<PortalUserDetails>> => {
    try {
      const response = await apiService.get<PagedResult<PortalUserDetails>>(
        "/users",
        { params }
      )
      return response.data
    } catch (error) {
      if (error instanceof ApiException) throw error
      throw new ApiException(
        {
          code: "FETCH_PORTAL_USERS_FAILED",
          message: "Failed to fetch portal users.",
          type: "Failure",
        },
        0
      )
    }
  },

  getPortalUser: async (id: number): Promise<PortalUserDetails> => {
    try {
      const response = await apiService.get<PortalUserDetails>(`/users/${id}`)
      return response.data
    } catch (error) {
      if (error instanceof ApiException) throw error
      throw new ApiException(
        {
          code: "FETCH_PORTAL_USER_FAILED",
          message: `Failed to fetch portal user with id ${id}.`,
          type: "Failure",
        },
        0
      )
    }
  },

  updatePortalUser: async (
    id: number,
    dto: UpsertPortalUserDto
  ): Promise<void> => {
    try {
      await apiService.put<void>(`/users/${id}`, dto)
    } catch (error) {
      if (error instanceof ApiException) throw error
      throw new ApiException(
        {
          code: "UPDATE_PORTAL_USER_FAILED",
          message: `Failed to update portal user with id ${id}.`,
          type: "Failure",
        },
        0
      )
    }
  },

  deletePortalUser: async (id: number): Promise<void> => {
    try {
      await apiService.delete<void>(`/users/${id}`)
    } catch (error) {
      if (error instanceof ApiException) throw error
      throw new ApiException(
        {
          code: "DELETE_PORTAL_USER_FAILED",
          message: `Failed to delete portal user with id ${id}.`,
          type: "Failure",
        },
        0
      )
    }
  },
}
