import { useAuth } from "@/context/AuthContext"
import axios, {
  AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios"

// ─── Shared Types ────────────────────────────────────────────────────────────

export interface ApiError {
  code: string
  message: string
  type: "Failure" | "Validation" | "NotFound" | "Conflict"
}

export interface PaginationParams {
  page?: number
  pageSize?: number
}

export interface PagedResult<T> {
  data: T[]
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export type AccessTypes = "NotApplicable" | "ReadOnly" | "ReadandWrite"

export type RequestStatus =
  | "Submitted"
  | "PendingWithHod"
  | "PendingWithIt"
  | "HodApproved"
  | "ItApproved"
  | "HodRejected"
  | "ItRejected"
  | "Revoked"
  | "Expired"

// ─── Custom API Error ─────────────────────────────────────────────────────────

export class ApiException extends Error {
  public readonly code: string
  public readonly type: ApiError["type"]
  public readonly httpStatus: number

  constructor(apiError: ApiError, httpStatus: number) {
    super(apiError.message)
    this.name = "ApiException"
    this.code = apiError.code
    this.type = apiError.type
    this.httpStatus = httpStatus
  }
}

// ─── ENV Config ───────────────────────────────────────────────────────────────

declare const ENV_CONFIG: { BASE_API_URL: string }

const BASE_URL =
  typeof ENV_CONFIG !== "undefined"
    ? ENV_CONFIG.BASE_API_URL
    : (import.meta as unknown as { env: Record<string, string> }).env
        ?.VITE_API_BASE_URL ?? "/api"

// ─── Axios Instance ───────────────────────────────────────────────────────────

const axiosInstance: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,          // send HttpOnly session cookie automatically
  headers: { "Content-Type": "application/json" },
  timeout: 15_000,
})

// Request interceptor – attach any additional headers (e.g. CSRF) if needed
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => config,
  (error: unknown) => Promise.reject(error)
)

axiosInstance.interceptors.request.use((config) => {
  const {currentUser} = useAuth()
  const userId = currentUser?.id

  if (userId) {
    config.headers["X-User-Id"] = userId
  }

  return config
})

// Response interceptor – normalise errors into ApiException
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError<ApiError>) => {
    if (error.response) {
      const { data, status } = error.response

      // Server returned a structured ApiError body
      if (data && typeof data === "object" && "code" in data && "type" in data) {
        return Promise.reject(new ApiException(data as ApiError, status))
      }

      // Fallback for non-standard error bodies
      return Promise.reject(
        new ApiException(
          {
            code: "UNKNOWN_ERROR",
            message: `Request failed with status ${status}`,
            type: "Failure",
          },
          status
        )
      )
    }

    if (error.request) {
      return Promise.reject(
        new ApiException(
          {
            code: "NETWORK_ERROR",
            message: "No response received from server. Check your network connection.",
            type: "Failure",
          },
          0
        )
      )
    }

    return Promise.reject(
      new ApiException(
        {
          code: "REQUEST_SETUP_ERROR",
          message: error.message ?? "An unexpected error occurred.",
          type: "Failure",
        },
        0
      )
    )
  }
)

// ─── Thin typed wrapper (mirrors Axios interface) ─────────────────────────────

export const apiService = {
  get: <T>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> =>
    axiosInstance.get<T>(url, config),

  post: <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> =>
    axiosInstance.post<T>(url, data, config),

  put: <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> =>
    axiosInstance.put<T>(url, data, config),

  patch: <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> =>
    axiosInstance.patch<T>(url, data, config),

  delete: <T>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> =>
    axiosInstance.delete<T>(url, config),
}

export default axiosInstance
