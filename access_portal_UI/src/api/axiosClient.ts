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

export const getUserId = () => {
  try {
    const rawData: any = sessionStorage.getItem("jan_AP_user")
    const session = JSON.parse(rawData)
    const userId: number | null =
      session?.user?.id ?? session?.id ?? session?.value?.user?.id
    return userId ?? null
  } catch (error) {
    console.error("Error parsing user session data:", error)
    return null
  }
}

const axiosInstance: AxiosInstance = axios.create({
  baseURL: ENV_CONFIG?.BASE_API_URL ?? "/access-portal/api",
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
})

axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const userId = getUserId()
    if (userId) {
      config.headers["X-User-Id"] = userId
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
      const data: any = response.data
      if (data && typeof data === "object" && "code" in data) {
        return Promise.reject(
          new ApiException(
            {
              code: data.message,
              message: data.message,
              type: "Failure",
            },
            response.status
          )
        )
      }
      return Promise.reject(
        new ApiException(
          {
            code: data.message.code,
            message: data.message.message,
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
