import { UserRole } from "./constants"

/**
 * Maps API role strings to numeric role constants
 * API returns: "User", "Admin", "Operator", "HOD"
 * Constants use numeric values: 1=Admin, 2=It/Operator, 3=HOD, 4=User
 */
export const roleStringToNumeric = (
  roleString: string | null | undefined
): number => {
  if (!roleString) return UserRole.User

  const roleMap: Record<string, number> = {
    Admin: UserRole.Admin,
    It: UserRole.It,
    Operator: UserRole.It,
    Hod: UserRole.Hod,
    HOD: UserRole.Hod,
    User: UserRole.User,
  }

  return roleMap[roleString] ?? UserRole.User
}

/**
 * Maps numeric role to string representation for logging/display
 */
export const numericToRoleString = (roleNumber: number): string => {
  const reverseMap: Record<number, string> = {
    [UserRole.Admin]: "Admin",
    [UserRole.It]: "Operator",
    [UserRole.Hod]: "HOD",
    [UserRole.User]: "User",
  }

  return reverseMap[roleNumber] ?? "Unknown"
}

/**
 * Gets allowed roles for a page/route
 */
export const getAllowedRoles = (roleNames: string[]): number[] => {
  return roleNames.map((role) => roleStringToNumeric(role))
}
