import { accessRequestsApi } from "@/api"
import { RequestsPageFactory } from "../common/RequestsPageFactory"
import { useAuth } from "@/context/AuthContext"

export const MyRequestsPage = () => {
  const { currentUser } = useAuth();

  return (
    <RequestsPageFactory
      fetchApiFn={async () => {
        const result = await accessRequestsApi.getMyRequests(currentUser?.user?.employeeId || "")
        return result
      }}
      actionButtonLabel="Edit"
      actionButtonRoutePrefix="/request"
      showCreateButton={true}
    />
  )
}
