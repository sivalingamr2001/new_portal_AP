import { hodCartApi } from "@/api"
import { normalizeHodCartItem } from "@/lib/api-result"
import { RequestsPageFactory } from "../common/RequestsPageFactory"

export const HodPendingRequestsPage = () => {
  return (
    <RequestsPageFactory
      fetchApiFn={async () => {
        const result = await hodCartApi.getCart()
        return result.data.map(normalizeHodCartItem)
      }}
      actionButtonLabel="Review"
      actionButtonRoutePrefix="/review"
      extraColumns={[
        { headerName: "Requested By", field: "requestedBy", width: 160 },
      ]}
    />
  )
}
