import { operatorCartApi } from "@/api"
import { RequestsPageFactory } from "../common/RequestsPageFactory"

export const OperatorPendingRequestsPage = () => {
  return (
    <RequestsPageFactory
      // Explicitly catch whatever the factory injects, but call the API with your custom params object
      fetchApiFn={(async (factoryArg?: any) => {
        // Safe structural parameter fallback construction logic
        const page = typeof factoryArg === "number" ? factoryArg : 1;
        
        const result = await operatorCartApi.getCart({
          page: page,
          pageSize: 20,
          status: "PendingWithIt"
        })
        return result;
      }) as any} // Cast the whole function wrapper to 'as any' to eliminate signature conflicts
      actionButtonLabel="Process"
      actionButtonRoutePrefix="/process"
      extraColumns={[
        { headerName: "Requested By", field: "requestedBy", width: 150 }
      ]}
    />
  )
}
