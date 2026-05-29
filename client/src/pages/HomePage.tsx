import { Button } from "@/components/ui/button"
import { useAuth } from "@/context/AuthContext"

export const HomePage = () => {
  const { currentUser, logout } = useAuth()

  if (!currentUser) return null

  const {
    employee,
    user,
    department,
    hod,
  } = currentUser

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-semibold">
        Home Page
      </h1>

      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-medium">
          User Details
        </h2>

        <div className="space-y-6">

          {/* Employee */}
          <div>
            <h3 className="mb-2 font-semibold">
              Employee
            </h3>

            <ul className="space-y-1 text-sm">
              <li>
                <strong>Name:</strong>{" "}
                {employee.cmplUserName}
              </li>

              <li>
                <strong>Email:</strong>{" "}
                {employee.mailId ?? "-"}
              </li>

              <li>
                <strong>Employee ID:</strong>{" "}
                {employee.empId ?? "-"}
              </li>

              <li>
                <strong>Mobile:</strong>{" "}
                {employee.mobNo ?? "-"}
              </li>
            </ul>
          </div>

          {/* User */}
          <div>
            <h3 className="mb-2 font-semibold">
              User
            </h3>

            <ul className="space-y-1 text-sm">
              <li>
                <strong>Role:</strong>{" "}
                {user.role}
              </li>

              <li>
                <strong>Location:</strong>{" "}
                {user.location}
              </li>
            </ul>
          </div>

          {/* Department */}
          <div>
            <h3 className="mb-2 font-semibold">
              Department
            </h3>

            <ul className="space-y-1 text-sm">
              <li>
                <strong>Name:</strong>{" "}
                {department.deptName}
              </li>

              <li>
                <strong>Department ID:</strong>{" "}
                {department.deptId}
              </li>
            </ul>
          </div>

          {/* HOD */}
          <div>
            <h3 className="mb-2 font-semibold">
              HOD
            </h3>

            <ul className="space-y-1 text-sm">
              <li>
                <strong>Name:</strong>{" "}
                {hod.hodName}
              </li>

              <li>
                <strong>Email:</strong>{" "}
                {hod.emailId ?? "-"}
              </li>

              <li>
                <strong>Employee ID:</strong>{" "}
                {hod.id ?? "-"}
              </li>

              <li>
                <strong>Mobile:</strong>{" "}
                {hod.mobNo ?? "-"}
              </li>
            </ul>
          </div>
        </div>
      </div>

      <Button
        variant="destructive"
        onClick={logout}
      >
        Logout
      </Button>
    </div>
  )
}