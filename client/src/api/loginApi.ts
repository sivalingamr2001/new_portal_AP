import { apiService } from "@/api/axiosClient"
import type {
  ApiLoginResponseDto,
  LoginResponseDto,
} from "@/api/types"

const mockLoginResponse: LoginResponseDto = {
  employee: {
    cmplUserId: 1,
    cmplUserName: "Shiva",
    empId: "EMP001",
    mailId: "shiva@company.com",
    mobNo: "9876543210",
  },

  user: {
    userId: 1,
    role: "Admin",
    location: "Chennai",
  },

  department: {
    deptId: 101,
    deptName: "IT",
  },

  hod: {
    hodName: "John Manager",
    id: "EMP010",
    emailId: "john.manager@company.com",
    mobNo: "9876500000",
  },
}

const loginApi = {
  login: async (values: {
    username: string
    password: string
  }): Promise<LoginResponseDto> => {
    if (
      !values.username ||
      !values.password
    ) {
      throw new Error(
        "Username and password required"
      )
    }

    try {
      const { data } =
        await apiService.post<
          ApiLoginResponseDto,
          {
            identifier: string
            password: string
          }
        >("/auth/login", {
          identifier: values.username,
          password: values.password,
        })

      return {
        employee: data.cmplUser,
        user: data.user,
        department:
          data.department ?? {
            deptId: 0,
            deptName: "",
          },
        hod:
          data.hod ?? {
            hodName: "",
          },
      }
    } catch (error) {
      console.error(
        "Error during login:",
        error
      )

      if (
        import.meta.env.DEV
      ) {
        return mockLoginResponse
      }

      throw error
    }
  },
}

export default loginApi
