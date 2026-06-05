import axios, {
  AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios"
import type { ApiError } from "./types"
import { ENV_CONFIG } from "@/lib/constants"

export type { PagedResult, PaginationParams } from "./types"

export class ApiException extends Error {
  public readonly apiError: ApiError
  public readonly httpStatus: number

  constructor(apiError: ApiError, httpStatus: number) {
    super(apiError.message)
    this.name = "ApiException"

    this.apiError = apiError
    this.httpStatus = httpStatus
  }
}

let cachedUserId: string | null = null

export const updateAxiosUserCache = () => {
  try {
    const rawData = sessionStorage.getItem("jan_AP_user")
    if (!rawData) {
      cachedUserId = null
      return
    }
    const session = JSON.parse(rawData)
    const id = session?.user?.id ?? session?.id ?? session?.value?.user?.id
    cachedUserId = id ? String(id) : null
  } catch {
    cachedUserId = null
  }
}

updateAxiosUserCache()

const axiosInstance: AxiosInstance = axios.create({
  baseURL: ENV_CONFIG?.BASE_API_URL ?? "/api",
  withCredentials: true,
  headers: { "Content-Type": "application/json" }
})

axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (!cachedUserId) updateAxiosUserCache()

    if (cachedUserId) {
      config.headers["X-User-Id"] = cachedUserId
    }
    return config
  },
  (error) => Promise.reject(error)
)

axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError<ApiError>) => {
    const response = error.response
    if (response) {
      const data = response.data
      if (data && typeof data === "object" && "code" in data) {
        return Promise.reject(
          new ApiException(data as ApiError, response.status)
        )
      }
      return Promise.reject(
        new ApiException(
          {
            code: "UNKNOWN_ERROR",
            message: `Error Status: ${response.status}`,
            type: "Failure",
          },
          response.status
        )
      )
    }
    return Promise.reject(
      new ApiException(
        {
          code: error.request ? "NETWORK_ERROR" : "SETUP_ERROR",
          message: error.message,
          type: "Failure",
        },
        0
      )
    )
  }
)

export const apiService = {
  get: <T>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> => axiosInstance.get<T>(url, config),
  post: <T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> => axiosInstance.post<T>(url, data, config),
  put: <T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> => axiosInstance.put<T>(url, data, config),
  patch: <T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> => axiosInstance.patch<T>(url, data, config),
  delete: <T>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> => axiosInstance.delete<T>(url, config),
}

export default axiosInstance
