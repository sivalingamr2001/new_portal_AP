import { axiosClient } from "./axiosClient"

export interface RegionDetailsDto {
  region: string
  subRegion: string
}

export const loginApi = async (
  username: string,
  password?: string
): Promise<RegionDetailsDto> => {
  const response = await axiosClient.post<RegionDetailsDto>(
    "/Auth/login-details",
    { username, password }
  )
  return response.data
}
