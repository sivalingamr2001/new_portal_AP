import { apiService, type PaginationParams } from "@/api/axiosClient"
import type {
  FolderMappingDto,
  UpsertFolderMappingRequest,
  Result,
  PagedResult,
} from "@/api/types"

const folderMappingApi = {
  getAll: async (
    params?: PaginationParams
  ): Promise<Result<PagedResult<FolderMappingDto>>> => {
    const { data } = await apiService.get<
      Result<PagedResult<FolderMappingDto>>
    >("/foldermapping", {
      params: {
        page: params?.page ?? 1,
        pageSize: params?.pageSize ?? 10,
      },
    })
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
}

export default folderMappingApi
