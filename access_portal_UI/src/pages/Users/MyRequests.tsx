import { accessRequestsApi } from "@/api"
import { normalizeSummaryRequest } from "@/lib/api-result"
import { RequestsPageFactory } from "../common/RequestsPageFactory"

export const MyRequestsPage = () => {
  return (
    <RequestsPageFactory
      fetchApiFn={async () => {
        const result = await accessRequestsApi.getMyRequests()
        return result.data.map(normalizeSummaryRequest)
      }}
      actionButtonLabel="Edit"
      actionButtonRoutePrefix="/request"
      showCreateButton={true}
    />
  )
}
