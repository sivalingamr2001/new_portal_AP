import { RequestsPageFactory } from "../common/RequestsPageFactory"

export const HodAllDepartmentRequestsPage = () => {
    return (
        <RequestsPageFactory 
            fetchApiFn={(deptId) => accessRequestApi.getAllByDepartment(deptId)}
            actionButtonLabel="View"
            actionButtonRoutePrefix="/request"
            extraColumns={[{ headerName: "Requested By", field: "requestedBy", width: 160 }]}
        />
    )
}