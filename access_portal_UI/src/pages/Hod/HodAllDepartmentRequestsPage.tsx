import { accessRequestsApi } from "@/api"
import { RequestsPageFactory } from "../common/RequestsPageFactory"

export const HodAllDepartmentRequestsPage = () => {
  return (
    <RequestsPageFactory
      fetchApiFn={async () => {
        const result = await accessRequestsApi.getMyRequests()
        return result
      }}
      actionButtonLabel="View"
      actionButtonRoutePrefix="/request"
      extraColumns={[
        { headerName: "Requested By", field: "requestedBy", width: 160 },
      ]}
    />
  )
}
