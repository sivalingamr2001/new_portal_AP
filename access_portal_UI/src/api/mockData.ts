import type {
  AuthSessionResponseDto,
  UserProfileResponseDto,
  DepartmentDetailResponse,
  AccessRequestSummaryDto,
  FolderMappingDto,
  PaginatedListDto,
  HodUserDto,
} from "./types"

// Mock Users Data
export const mockUsers: UserProfileResponseDto[] = [
  {
    userId: 12,
    userName: "John Smith",
    userKey: null,
    mobileNo: 9123456780,
    mailId: "john.smith@example.com",
    deptId: 3,
    empId: "EMP-1003",
    userRole: "Hod",
    location: "Chennai",
    isActive: true,
    department: {
      departmentId: 3,
      departmentName: "Finance",
      hodId: 12,
      hod: {
        hodName: "John Smith",
        hodEmployeeId: "EMP-1003",
        hodEmail: "john.smith@example.com",
        hodMobileNumber: 9123456780,
      },
    },
  },
  {
    userId: 14,
    userName: "Priya Kumar",
    userKey: null,
    mobileNo: 9988776655,
    mailId: "priya.kumar@example.com",
    deptId: 5,
    empId: "EMP-1014",
    userRole: "Hod",
    location: "Bangalore",
    isActive: true,
    department: {
      departmentId: 5,
      departmentName: "IT Operations",
      hodId: 14,
      hod: {
        hodName: "Priya Kumar",
        hodEmployeeId: "EMP-1014",
        hodEmail: "priya.kumar@example.com",
        hodMobileNumber: 9988776655,
      },
    },
  },
  {
    userId: 101,
    userName: "Jane Doe",
    userKey: null,
    mobileNo: 9876543210,
    mailId: "jdoe@example.com",
    deptId: 12,
    empId: "EMP-1001",
    userRole: "User",
    location: "Bangalore",
    isActive: true,
    department: {
      departmentId: 12,
      departmentName: "HR",
      hodId: 15,
      hod: {
        hodName: "Anita Rao",
        hodEmployeeId: "EMP-1015",
        hodEmail: "anita.rao@example.com",
        hodMobileNumber: 9876543210,
      },
    },
  },
]

// Mock Session Data
export const mockAuthSession: AuthSessionResponseDto = {
  userId: 101,
  userName: "jdoe",
  userKey: null,
  mobileNo: 9876543210,
  mailId: "jdoe@example.com",
  deptId: 12,
  empId: "EMP-1001",
  userRole: "User",
  location: "Bangalore",
  authenticatedAtUtc: new Date().toISOString(),
}

// Mock HODs Data
export const mockHods: HodUserDto[] = [
  {
    userId: 12,
    userName: "John Smith",
    email: "john.smith@example.com",
    departmentId: 3,
  },
  {
    userId: 14,
    userName: "Priya Kumar",
    email: "priya.kumar@example.com",
    departmentId: 5,
  },
  {
    userId: 15,
    userName: "Anita Rao",
    email: "anita.rao@example.com",
    departmentId: 12,
  },
]

// Mock Departments Data
export const mockDepartments: DepartmentDetailResponse[] = [
  {
    departmentId: 3,
    departmentName: "Finance",
    hodId: 12,
    hod: {
      hodName: "John Smith",
      hodEmployeeId: "EMP-1003",
      hodEmail: "john.smith@example.com",
      hodMobileNumber: 9123456780,
    },
  },
  {
    departmentId: 5,
    departmentName: "IT Operations",
    hodId: 14,
    hod: {
      hodName: "Priya Kumar",
      hodEmployeeId: "EMP-1014",
      hodEmail: "priya.kumar@example.com",
      hodMobileNumber: 9988776655,
    },
  },
  {
    departmentId: 12,
    departmentName: "HR",
    hodId: 15,
    hod: {
      hodName: "Anita Rao",
      hodEmployeeId: "EMP-1015",
      hodEmail: "anita.rao@example.com",
      hodMobileNumber: 9876543210,
    },
  },
]

// Mock Access Requests Data
export const mockAccessRequests: AccessRequestSummaryDto[] = [
  {
    accessItemId: 501,
    accessReqId: 120,
    ticketNumber: "AR-2026-120-01",
    requesterUserId: 101,
    requesterName: "Jane Doe",
    folderPath: "\\\\server\\share\\Finance",
    accessType: "ReadOnly",
    confirmedAccessType: "ReadOnly",
    reason: "Review monthly invoice files",
    status: "Pending",
    accessFrom: null,
    accessTo: null,
    revokedOn: null,
    createdOn: new Date().toISOString(),
  },
  {
    accessItemId: 502,
    accessReqId: 121,
    ticketNumber: "AR-2026-121-01",
    requesterUserId: 101,
    requesterName: "Jane Doe",
    folderPath: "\\\\server\\share\\Finance\\Projects",
    accessType: "ReadWrite",
    confirmedAccessType: "ReadWrite",
    reason: "Q3 budget updates",
    status: "Approved",
    accessFrom: null,
    accessTo: null,
    revokedOn: null,
    createdOn: new Date().toISOString(),
  },
]

// Mock Folder Mappings Data
export const mockFolderMappings: FolderMappingDto[] = [
  {
    id: 11,
    folderPath: "\\\\server\\share\\Finance",
    primaryHodId: "EMP-1003",
    primaryHodName: "John Smith",
    primaryHodEmail: "john.smith@example.com",
    secondaryHodId: "EMP-1004",
    secondaryHodName: "Priya Kumar",
    secondaryHodEmail: "priya.kumar@example.com",
  },
  {
    id: 12,
    folderPath: "\\\\server\\share\\Finance\\Projects",
    primaryHodId: "EMP-1003",
    primaryHodName: "John Smith",
    primaryHodEmail: "john.smith@example.com",
    secondaryHodId: "EMP-1005",
    secondaryHodName: "Anita Rao",
    secondaryHodEmail: "anita.rao@example.com",
  },
]

// Helper function to create paginated responses
export function createPaginatedResponse<T>(
  items: T[],
  pageNumber: number = 1,
  pageSize: number = 20
): PaginatedListDto<T> {
  const totalCount = items.length
  const totalPages = Math.ceil(totalCount / pageSize)
  const startIndex = (pageNumber - 1) * pageSize
  const endIndex = Math.min(startIndex + pageSize, totalCount)
  const paginatedItems = items.slice(startIndex, endIndex)

  return {
    items: paginatedItems,
    pageNumber,
    pageSize,
    totalCount,
    totalPages,
    hasPreviousPage: pageNumber > 1,
    hasNextPage: pageNumber < totalPages,
  }
}

// Helper function to filter items by search term
export function filterBySearchTerm<T>(
  items: T[],
  searchTerm: string | undefined,
  searchFields: (keyof T)[]
): T[] {
  if (!searchTerm) return items
  const lowerSearch = searchTerm.toLowerCase()
  return items.filter((item) =>
    searchFields.some(
      (field) =>
        String(item[field]).toLowerCase().includes(lowerSearch)
    )
  )
}
