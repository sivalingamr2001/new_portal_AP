import { apiService } from "@/api/axiosClient"
import type {
  FolderMappingDto,
  UpsertFolderMappingRequest,
} from "@/api/types"

const folderMappingApi = {
  getAll: async (): Promise<
    FolderMappingDto[]
  > => {
    const { data } =
      await apiService.get<
        FolderMappingDto[]
      >("/foldermapping")

    return data
  },

  getById: async (
    id: number
  ): Promise<FolderMappingDto> => {
    const { data } =
      await apiService.get<
        FolderMappingDto
      >(`/foldermapping/${id}`)

    return data
  },

  create: async (
    payload: UpsertFolderMappingRequest
  ): Promise<FolderMappingDto> => {
    const { data } =
      await apiService.post<
        FolderMappingDto,
        UpsertFolderMappingRequest
      >("/foldermapping", payload)

    return data
  },

  update: async (
    id: number,
    payload: UpsertFolderMappingRequest
  ): Promise<FolderMappingDto> => {
    const { data } =
      await apiService.put<
        FolderMappingDto,
        UpsertFolderMappingRequest
      >(
        `/foldermapping/${id}`,
        payload
      )

    return data
  },

  delete: async (
    id: number
  ): Promise<void> => {
    await apiService.delete(
      `/foldermapping/${id}`
    )
  },
}

export default folderMappingApi
