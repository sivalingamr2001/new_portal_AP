import { accessRequestsApi } from "@/api"
import { RequestsPageFactory } from "../common/RequestsPageFactory"

export const MyRequestsPage = () => {
  return (
    <RequestsPageFactory
      fetchApiFn={async () => {
        const result = await accessRequestsApi.getMyRequests()
        return result
      }}
      actionButtonLabel="Edit"
      actionButtonRoutePrefix="/request"
      showCreateButton={true}
    />
  )
}
