import accessRequestApi from "@/api/accessRequestApi"
import { RequestsPageFactory } from "../common/RequestsPageFactory"

export const OperatorPendingRequestsPage = () => {
    return (
        <RequestsPageFactory 
            fetchApiFn={() => accessRequestApi.getAllPendingGlobal()}
            actionButtonLabel="Process"
            actionButtonRoutePrefix="/process"
            extraColumns={[
                { headerName: "Requested By", field: "requestedBy", width: 150 },
                { headerName: "Department", field: "department", width: 150 }
            ]}
        />
    )
}