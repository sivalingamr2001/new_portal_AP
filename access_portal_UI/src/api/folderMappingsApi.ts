import { apiService } from "./axiosClient"
import type {
  FolderMappingDto,
  FolderMappingSearchParams,
  FolderResponse,
  PaginatedListDto,
  UpsertFolderMappingRequest,
} from "./types"

export const folderMappingsApi = {
  getFolderMappings: async (
    params?: FolderMappingSearchParams
  ): Promise<PaginatedListDto<FolderMappingDto>> => {
    const response = await apiService.get<PaginatedListDto<FolderMappingDto>>(
      "/folder-mappings",
      {
        params: {
          pageNumber: params?.pageNumber,
          pageSize: params?.pageSize,
          search: params?.search,
        },
      }
    )
    return response.data
  },

  getFolderMapping: async (id: number): Promise<FolderMappingDto> => {
    const response = await apiService.get<FolderMappingDto>(
      `/folder-mappings/${id}`
    )
    return response.data
  },

  createFolderMapping: async (
    dto: UpsertFolderMappingRequest
  ): Promise<number> => {
    const response = await apiService.post<number>(
      "/folder-mappings",
      dto
    )
    return response.data
  },

  updateFolderMapping: async (
    id: number,
    dto: UpsertFolderMappingRequest
  ): Promise<void> => {
    await apiService.put<void>(`/folder-mappings/${id}`, dto)
  },

  deleteFolderMapping: async (id: number): Promise<void> => {
    await apiService.delete<void>(`/folder-mappings/${id}`)
  },

  getParentFolders: async (): Promise<FolderResponse[]> => {
    const response = await apiService.get<FolderResponse[]>(
      "/folder-mappings/parents"
    )
    return response.data
  },

  getFolderHierarchy: async (): Promise<FolderResponse[]> => {
    const response = await apiService.get<FolderResponse[]>(
      "/folder-mappings/hierarchy"
    )
    return response.data
  },
}
