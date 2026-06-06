import { hodCartApi } from "@/api"
import { RequestsPageFactory } from "../common/RequestsPageFactory"
import { useAuth } from "@/context/AuthContext"

export const HodPendingRequestsPage = () => {

  const { currentUser } = useAuth()
  
  return (
    <RequestsPageFactory
      fetchApiFn={async () => {
        const result = await hodCartApi.getCart(currentUser?.user?.employeeId ?? "")
        return result
      }}
      actionButtonLabel="Review"
      actionButtonRoutePrefix="/review"
      extraColumns={[
        { headerName: "Requested By", field: "requestedBy", width: 160 },
      ]}
    />
  )
}
