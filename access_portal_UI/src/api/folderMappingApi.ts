import { apiService, type PaginationParams } from "@/api/axiosClient"
import type {
  FolderMappingDto,
  FolderResponseDto,
  UpsertFolderMappingRequest,
  Result,
  PagedResult,
} from "@/api/types"

const folderMappingApi = {
  getAll: async (
    params?: PaginationParams
  ): Promise<Result<PagedResult<FolderMappingDto>>> => {
    const { data } = await apiService.get<
      Result<PagedResult<FolderMappingDto>> | FolderMappingDto[]
    >("/foldermapping", {
      params: {
        page: params?.page ?? 1,
        pageSize: params?.pageSize ?? 10,
      },
    })

    if (Array.isArray(data)) {
      return {
        isSuccess: true,
        isFailure: false,
        value: {
          data,
          totalCount: data.length,
          page: params?.page ?? 1,
          pageSize: params?.pageSize ?? data.length,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
        error: null,
      }
    }

    return data
  },

  getById: async (id: number): Promise<Result<FolderMappingDto>> => {
    const { data } = await apiService.get<Result<FolderMappingDto>>(
      `/foldermapping/${id}`
    )
    return data
  },

  create: async (
    payload: UpsertFolderMappingRequest
  ): Promise<Result<FolderMappingDto>> => {
    const { data } = await apiService.post<Result<FolderMappingDto>>(
      "/foldermapping",
      payload
    )
    return data
  },

  update: async (
    id: number,
    payload: UpsertFolderMappingRequest
  ): Promise<Result<FolderMappingDto>> => {
    const { data } = await apiService.put<Result<FolderMappingDto>>(
      `/foldermapping/${id}`,
      payload
    )
    return data
  },

  delete: async (id: number): Promise<void> => {
    await apiService.delete(`/foldermapping/${id}`)
  },

  getFolderHierarchy: async (): Promise<Result<FolderResponseDto[]>> => {
    const { data } = await apiService.get<
      Result<FolderResponseDto[]> | FolderResponseDto[]
    >(`/foldermapping/hierarchy`)

    if (Array.isArray(data)) {
      return {
        isSuccess: true,
        isFailure: false,
        value: data,
        error: null,
      }
    }

    return data
  },

  getFolderParents: async (): Promise<Result<FolderResponseDto[]>> => {
    const { data } = await apiService.get<
      Result<FolderResponseDto[]> | FolderResponseDto[]
    >(`/foldermapping/parents`)

    if (Array.isArray(data)) {
      return {
        isSuccess: true,
        isFailure: false,
        value: data,
        error: null,
      }
    }

    return data
  },
}

export default folderMappingApi
