import accessRequestApi from "@/api/accessRequestApi"
import { RequestsPageFactory } from "../common/RequestsPageFactory"

export const HodPendingRequestsPage = () => {
    return (
        <RequestsPageFactory 
            fetchApiFn={(deptId) => accessRequestApi.getPendingByDepartment(deptId)}
            actionButtonLabel="Review"
            actionButtonRoutePrefix="/review"
            extraColumns={[{ headerName: "Requested By", field: "requestedBy", width: 160 }]}
        />
    )
}