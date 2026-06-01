import accessRequestApi from "@/api/accessRequestApi"
import { CreateRequestModal } from "@/components/AccessRequests/create-request-modal"
import { accessRequestColumns } from "@/components/Columns/access-request-columns"
import { DataGrid } from "@/components/DynamicGrid/Index"
import { Loader } from "@/components/Loader"
import { useAuth } from "@/context/AuthContext"
import { useLoader } from "@/hooks/useLoader"
import { useEffect, useState } from "react"

export const MyRequests = () => {
    const [requests, setRequests] = useState([])
    const { loading, withLoader } = useLoader()
    const { currentUser } = useAuth()
    const [createRequestModalOpen, setCreateRequestModalOpen] = useState(false)

    useEffect(() => {
        const fetchRequests = async () => {
            try {
                const response: any = await withLoader(() => accessRequestApi.getAll(currentUser?.userId))
                if (response && response.isSuccess) {
                    setRequests(response)
                }
            } catch (error) {
                console.error("Error fetching requests:", error)
            }
        }

        fetchRequests()
    }, [])

    if (loading) {
        return <div className="flex min-h-screen w-full items-center justify-center bg-muted/40 p-4 md:p-8">
            <Loader />
        </div>
    }

    const customActions = [
        {
            label: "Create New Request",
            onClick: () => {
                setCreateRequestModalOpen(true)
            },
        },
    ]

    return (
        <div className="space-y-4">
            <DataGrid
                columnDefs={accessRequestColumns}
                rowData={requests}
                customActions={customActions}
            />

            <CreateRequestModal isOpen={createRequestModalOpen} onOpenChange={setCreateRequestModalOpen} />
        </div>
    )
}
