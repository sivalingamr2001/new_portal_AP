import { hodCartApi } from "@/api"
import type { HodCartItemDto } from "@/api/types"
import { RequestsPageFactory } from "../common/RequestsPageFactory"
import { useAuth } from "@/context/AuthContext"

export const HodPendingRequestsPage = () => {
  const {currentUser} = useAuth()
  return (
    <RequestsPageFactory<HodCartItemDto>
      fetchApiFn={async () => {
        const result = await hodCartApi.getCart(currentUser?.user?.employeeId || "")
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
