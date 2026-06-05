import { operatorCartApi } from "@/api"
import { RequestsPageFactory } from "../common/RequestsPageFactory"

export const OperatorPendingRequestsPage = () => {
  return (
    <RequestsPageFactory
      fetchApiFn={async () => {
        const result = await operatorCartApi.getCart()
        return result
      }}
      actionButtonLabel="Process"
      actionButtonRoutePrefix="/process"
      extraColumns={[
        { headerName: "Requested By", field: "requestedBy", width: 150 },
        { headerName: "Department", field: "department", width: 150 },
      ]}
    />
  )
}
