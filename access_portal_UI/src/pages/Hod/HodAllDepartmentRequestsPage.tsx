import { accessRequestsApi } from "@/api"
import { normalizeSummaryRequest } from "@/lib/api-result"
import { RequestsPageFactory } from "../common/RequestsPageFactory"

export const HodAllDepartmentRequestsPage = () => {
  return (
    <RequestsPageFactory
      fetchApiFn={async () => {
        const result = await accessRequestsApi.getMyRequests()
        return result.data.map(normalizeSummaryRequest)
      }}
      actionButtonLabel="View"
      actionButtonRoutePrefix="/request"
      extraColumns={[
        { headerName: "Requested By", field: "requestedBy", width: 160 },
      ]}
    />
  )
}
