import axios from "axios"
import { ENV_CONFIG } from "./constants"
import { toast } from "sonner"

const baseURL = ENV_CONFIG.BASE_API_URL

const showToast = (message: string) => {
  toast.error("User Notification", {
    description: message,
  })
}

export const axiosClient = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
})

// Global interceptor to capture and process backend responses/errors cleanly
axiosClient.interceptors.response.use(
  (response) => {
    // Return the response data if the request succeeds
    return response
  },
  (error) => {
    let friendlyMessage =
      "An unexpected network error occurred. Please try again."

    if (error.response) {
      // The server responded with a status code outside the 2xx range
      const status = error.response.status
      const serverMessage = error.response.data?.message

      switch (status) {
        case 401:
          friendlyMessage =
            serverMessage ||
            "Invalid username or password. Please check your credentials."
          break
        case 403:
          friendlyMessage = "You do not have permission to perform this action."
          break
        case 404:
          friendlyMessage =
            "The requested record or resource could not be found."
          break
        case 500:
        case 502:
        case 503:
          friendlyMessage =
            "The database server is currently busy or down. Please contact support."
          break
        default:
          friendlyMessage =
            serverMessage || `Server Error (${status}). Please try again later.`
          break
      }
    } else if (error.request) {
      // The request was made but no response was received from the backend host
      friendlyMessage =
        "Cannot connect to the server. Please check your internet connection."
    }

    // Trigger the notification toast on screen for the user
    showToast(friendlyMessage)

    return Promise.reject(error)
  }
)
