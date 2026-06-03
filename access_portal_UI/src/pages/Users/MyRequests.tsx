import accessRequestApi from "@/api/accessRequestApi"
import { RequestsPageFactory } from "../common/RequestsPageFactory"
import { useAuth } from "@/context/AuthContext"

export const MyRequestsPage = () => {
    const { currentUser } = useAuth()
    const userId = currentUser?.cmpl || ""

    return (
        <RequestsPageFactory
            fetchApiFn={(userId) => accessRequestApi.getAll(userId)}
            actionButtonLabel="Edit"
            actionButtonRoutePrefix="/request"
            showCreateButton={true}
        />
    )
}
