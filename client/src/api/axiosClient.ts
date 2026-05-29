import axios, {
    AxiosError,
    type AxiosInstance,
    type AxiosRequestConfig
} from "axios"

export interface ApiError {
    message: string
    statusCode: number
    details?: unknown
}

function createApiInstance(): AxiosInstance {
    const instance = axios.create({
        baseURL:
            import.meta.env.VITE_API_BASE_URL ??
            "/api",
        timeout: 10000,
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
        },
    })

    instance.interceptors.response.use(
        (response) => response,
        (error: AxiosError) =>
            Promise.reject(normalizeError(error))
    )

    return instance
}

function normalizeError(error: unknown): ApiError {
    if (axios.isAxiosError(error)) {
        return {
            statusCode: error.response?.status ?? 0,
            message:
                (error.response?.data as { message?: string })?.message ??
                error.message,
            details: error.response?.data,
        }
    }

    return {
        statusCode: 0,
        message: "Something went wrong",
    }
}

export const api = createApiInstance()

export const apiService = {
    get<T>(url: string, config?: AxiosRequestConfig) {
        return api.get<T>(url, config)
    },

    post<T, D = unknown>(
        url: string,
        data?: D,
        config?: AxiosRequestConfig
    ) {
        return api.post<T>(url, data, config)
    },

    put<T, D = unknown>(
        url: string,
        data?: D,
        config?: AxiosRequestConfig
    ) {
        return api.put<T>(url, data, config)
    },

    delete<T>(
        url: string,
        config?: AxiosRequestConfig
    ) {
        return api.delete<T>(url, config)
    },
}
