import { apiService, ApiException } from "./axiosClient"
import type {
  PaginatedListDto,
  FolderMappingDto,
  FolderMappingSearchParams,
  UpsertFolderMappingRequest,
  FolderResponse,
} from "./types"

export const folderMappingsApi = {
  /**
   * GET /api/folder-mappings
   * Paginated list of all folder mappings with optional search.
   */
  getFolderMappings: async (
    params?: FolderMappingSearchParams
  ): Promise<PaginatedListDto<FolderMappingDto>> => {
    try {
      const response = await apiService.get<PaginatedListDto<FolderMappingDto>>(
        "/folder-mappings",
        { params }
      )
      return response.data
    } catch (error) {
      if (error instanceof ApiException) throw error
      throw new ApiException(
        { code: "FETCH_FOLDER_MAPPINGS_FAILED", message: "Failed to fetch folder mappings.", type: "Failure" },
        0
      )
    }
  },

  /**
   * GET /api/folder-mappings/{id}
   */
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

  /**
   * POST /api/folder-mappings
   * Creates a new folder mapping. Returns the new record ID.
   */
  createFolderMapping: async (
    dto: UpsertFolderMappingRequest
  ): Promise<number> => {
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

  /**
   * PUT /api/folder-mappings/{id}
   * Updates an existing folder mapping.
   */
  updateFolderMapping: async (
    id: number,
    dto: UpsertFolderMappingRequest
  ): Promise<void> => {
    try {
      await apiService.put<void>(`/folder-mappings/${id}`, dto)
    } catch (error) {
      if (error instanceof ApiException) throw error
      throw new ApiException(
        {
          code: "UPDATE_FOLDER_MAPPING_FAILED",
          message: `Failed to update folder mapping ${id}.`,
          type: "Failure",
        },
        0
      )
    }
  },

  /**
   * DELETE /api/folder-mappings/{id}
   * Deletes a folder mapping. Returns 204 No Content.
   */
  deleteFolderMapping: async (id: number): Promise<void> => {
    try {
      await apiService.delete<void>(`/folder-mappings/${id}`)
    } catch (error) {
      if (error instanceof ApiException) throw error
      throw new ApiException(
        {
          code: "DELETE_FOLDER_MAPPING_FAILED",
          message: `Failed to delete folder mapping ${id}.`,
          type: "Failure",
        },
        0
      )
    }
  },

  /**
   * GET /api/folder-mappings/parents
   * Returns the top-level (parent) folder list.
   */
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

  /**
   * GET /api/folder-mappings/hierarchy
   * Returns the full nested folder tree.
   */
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
