import { useCallback, useEffect, useMemo, useState } from "react"
import { useParams, useSearchParams } from "react-router-dom"
import { accessRequestsApi, hodCartApi, operatorCartApi } from "@/api"
import { useAuth } from "@/context/AuthContext"
import type { AccessRequestDetailDto, AccessTypes } from "@/api/types"
import RequestDetails from "./RequestDetailSheet"
import { toast } from "sonner"
import { AccessRequestBpf } from "./AccessRequestBpf"

export const RequestDetailsPage = () => {
  const { requestId } = useParams<{ requestId: string }>()
  const [searchParams] = useSearchParams()
  const selectedItemId = Number(searchParams.get("itemId") || 0)
  const { currentUserRole } = useAuth()

  const [request, setRequest] = useState<AccessRequestDetailDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchRequest = useCallback(() => {
    const accessReqId = Number(requestId)

    if (!accessReqId) {
      setRequest(null)
      setError("Invalid request id.")
      setLoading(false)
      return
    }

    let isMounted = true

    setLoading(true)
    setError(null)

    accessRequestsApi
      .getRequestDetail(accessReqId)
      .then((response) => {
        if (!isMounted) return
        setRequest(response)
      })
      .catch(() => {
        if (!isMounted) return
        setRequest(null)
        setError("Unable to load request details.")
      })
      .finally(() => {
        if (isMounted) setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [requestId])

  useEffect(() => fetchRequest(), [fetchRequest])

  const visibleRequest = useMemo(() => {
    if (!request) return null
    if (!selectedItemId) return request

    const selectedItem = request.items.find(
      (item) => item.itemId === selectedItemId
    )

    return selectedItem
      ? {
          ...request,
          currentStatus: selectedItem.status,
          items: [selectedItem],
        }
      : request
  }, [request, selectedItemId])

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center rounded-2xl border bg-card p-8 text-sm text-muted-foreground">
        Loading request details...
      </div>
    )
  }

  if (error || !visibleRequest) {
    return (
      <div className="flex h-full items-center justify-center rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-sm text-destructive">
        {error || "Request details not found."}
      </div>
    )
  }

  const refreshAfterAction = async (
    action: () => Promise<void>,
    message: string
  ) => {
    try {
      await action()
      toast.success(message)
      fetchRequest()
    } catch (actionError) {
      console.error(actionError)
      toast.error("Action failed. Please try again.")
    }
  }

  const handleApprove = (
    itemId: number,
    confirmAccessType?: AccessTypes,
    reason?: string
  ) => {
    const item = visibleRequest.items.find(
      (candidate) => candidate.itemId === itemId
    )
    const approvalReason = reason || (item?.status === "PendingWithHod" ? "Approved" : "Provisioned")

    if (item?.status === "PendingWithHod") {
      refreshAfterAction(
        () =>
          hodCartApi.approveItem(itemId, {
            reason: approvalReason,
            confirmAccessType,
            comments: approvalReason,
          }),
        "Item approved."
      )
      return
    }

    refreshAfterAction(
      () =>
        operatorCartApi.approveItem(itemId, {
          reason: approvalReason,
          comments: approvalReason,
        }),
      "Item provisioned."
    )
  }

  const handleReject = (itemId: number, reason: string) => {
    const item = visibleRequest.items.find(
      (candidate) => candidate.itemId === itemId
    )

    if (item?.status === "PendingWithHod") {
      refreshAfterAction(
        () => hodCartApi.rejectItem(itemId, { reason }),
        "Item rejected."
      )
      return
    }

    refreshAfterAction(
      () => operatorCartApi.rejectItem(itemId, { reason }),
      "Item rejected."
    )
  }

  const handleRevoke = (itemId: number, reason?: string) => {
    refreshAfterAction(
      () => operatorCartApi.revokeItem(itemId, { reason: reason || "Revoked" }),
      "Item revoked."
    )
  }

  const handleResubmit = (itemId: number, reason: string) => {
    refreshAfterAction(
      () => accessRequestsApi.resubmitItem(itemId, { reason }),
      "Item resubmitted."
    )
  }

  const handleRenew = (itemId: number, reason: string) => {
    refreshAfterAction(
      () => accessRequestsApi.renewItem(itemId, { reason }),
      "Renewal request submitted."
    )
  }

  const handleExport = () => {
    const fileName =
      visibleRequest.items.length === 1
        ? `${visibleRequest.items[0].ticketNumber}.json`
        : `request-${visibleRequest.requestId}.json`
    const blob = new Blob([JSON.stringify(visibleRequest, null, 2)], {
      type: "application/json",
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")

    link.href = url
    link.download = fileName
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-hidden">
      <AccessRequestBpf status={visibleRequest.currentStatus} />
      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        <RequestDetails
          request={visibleRequest}
          currentUserRole={currentUserRole}
          onApprove={handleApprove}
          onReject={handleReject}
          onRevoke={handleRevoke}
          onResubmit={handleResubmit}
          onRenew={handleRenew}
          onExport={handleExport}
        />
      </div>
    </div>
  )
}
