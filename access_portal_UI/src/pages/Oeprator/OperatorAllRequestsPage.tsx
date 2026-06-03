import accessRequestApi from "@/api/accessRequestApi"
import { RequestsPageFactory } from "../common/RequestsPageFactory"

export const OperatorAllRequestsPage = () => {
    return (
        <RequestsPageFactory 
            fetchApiFn={() => accessRequestApi.getAllGlobal()}
            actionButtonLabel="View"
            actionButtonRoutePrefix="/request"
            extraColumns={[
                { headerName: "Requested By", field: "requestedBy", width: 150 },
                { headerName: "Department", field: "department", width: 150 }
            ]}
        />
    )
}