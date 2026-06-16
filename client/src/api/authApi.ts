import { axiosClient } from "@/lib/axiosClient"
import type { RegionDetailsDto } from "./types/allocationDto"

/**
 * Validates user credentials and retrieves matching region configurations.
 * Maps to: POST /api/Allocation/login-details
 */
export const loginApi = async (
  username: string,
  password?: string
): Promise<RegionDetailsDto> => {
  const response = await axiosClient.post<RegionDetailsDto>(
    "/Allocation/login-details",
    { username, password }
  )
  return response.data
}
