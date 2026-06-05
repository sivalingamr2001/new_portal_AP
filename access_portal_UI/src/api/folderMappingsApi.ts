import { apiService, ApiException, type PaginationParams, type PagedResult } from "./axiosClient"

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FolderMappingDto {
  id: number
  folderPath: string
  primaryHodId: string | null
  primaryHodName: string | null
  primaryHodEmail: string | null
  secondaryHodId: string | null
  secondaryHodName: string | null
  secondaryHodEmail: string | null
}

export interface UpsertFolderMappingRequest {
  folderPath: string
  primaryHodId?: string | null
  primaryHodName?: string | null
  primaryHodEmail?: string | null
  secondaryHodId?: string | null
  secondaryHodName?: string | null
  secondaryHodEmail?: string | null
}

export interface FolderResponse {
  driveName: string
  name: string
  children: FolderResponse[]
}

// ─── Client ───────────────────────────────────────────────────────────────────

export const folderMappingsApi = {
  getFolderMappings: async (
    params?: PaginationParams & { search?: string }
  ): Promise<PagedResult<FolderMappingDto>> => {
    try {
      const response = await apiService.get<PagedResult<FolderMappingDto>>("/folder-mappings", { params })
      return response.data
    } catch (error) {
      if (error instanceof ApiException) throw error
      throw new ApiException(
        { code: "FETCH_FOLDER_MAPPINGS_FAILED", message: "Failed to fetch folder mappings.", type: "Failure" },
        0
      )
    }
  },

  getFolderMapping: async (id: number): Promise<FolderMappingDto> => {
    try {
      const response = await apiService.get<FolderMappingDto>(`/folder-mappings/${id}`)
      return response.data
    } catch (error) {
      if (error instanceof ApiException) throw error
      throw new ApiException(
        { code: "FETCH_FOLDER_MAPPING_FAILED", message: `Failed to fetch folder mapping ${id}.`, type: "Failure" },
        0
      )
    }
  },

  createFolderMapping: async (dto: UpsertFolderMappingRequest): Promise<number> => {
    try {
      const response = await apiService.post<number>("/folder-mappings", dto)
      return response.data
    } catch (error) {
      if (error instanceof ApiException) throw error
      throw new ApiException(
        { code: "CREATE_FOLDER_MAPPING_FAILED", message: "Failed to create folder mapping.", type: "Failure" },
        0
      )
    }
  },

  updateFolderMapping: async (id: number, dto: UpsertFolderMappingRequest): Promise<void> => {
    try {
      await apiService.put<void>(`/folder-mappings/${id}`, dto)
    } catch (error) {
      if (error instanceof ApiException) throw error
      throw new ApiException(
        { code: "UPDATE_FOLDER_MAPPING_FAILED", message: `Failed to update folder mapping ${id}.`, type: "Failure" },
        0
      )
    }
  },

  deleteFolderMapping: async (id: number): Promise<void> => {
    try {
      await apiService.delete<void>(`/folder-mappings/${id}`)
    } catch (error) {
      if (error instanceof ApiException) throw error
      throw new ApiException(
        { code: "DELETE_FOLDER_MAPPING_FAILED", message: `Failed to delete folder mapping ${id}.`, type: "Failure" },
        0
      )
    }
  },

  getParentFolders: async (): Promise<FolderResponse[]> => {
    try {
      const response = await apiService.get<FolderResponse[]>("/folder-mappings/parents")
      return response.data
    } catch (error) {
      if (error instanceof ApiException) throw error
      throw new ApiException(
        { code: "FETCH_PARENT_FOLDERS_FAILED", message: "Failed to fetch parent folders.", type: "Failure" },
        0
      )
    }
  },

  getFolderHierarchy: async (): Promise<FolderResponse[]> => {
    try {
      const response = await apiService.get<FolderResponse[]>("/folder-mappings/hierarchy")
      return response.data
    } catch (error) {
      if (error instanceof ApiException) throw error
      throw new ApiException(
        { code: "FETCH_FOLDER_HIERARCHY_FAILED", message: "Failed to fetch folder hierarchy.", type: "Failure" },
        0
      )
    }
  },
}
