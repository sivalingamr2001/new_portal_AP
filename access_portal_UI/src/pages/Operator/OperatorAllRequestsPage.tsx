import { operatorCartApi } from "@/api"
import { RequestsPageFactory } from "../common/RequestsPageFactory"

export const OperatorAllRequestsPage = () => {
  return (
    <RequestsPageFactory
      fetchApiFn={async () => {
        const result = await operatorCartApi.getCart()
        return result
            }}
      actionButtonLabel="View"
      actionButtonRoutePrefix="/request"
      extraColumns={[
        { headerName: "Requested By", field: "requestedBy", width: 150 },
        { headerName: "Department", field: "department", width: 150 },
      ]}
    />
  )
}
