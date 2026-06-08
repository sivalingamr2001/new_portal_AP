import { useState } from "react"
import {
  CalendarDays,
  Check,
  Clock,
  Download,
  Folder,
  Mail,
  RefreshCw,
  Shield,
  Ticket,
  Trash2,
  User,
  X,
} from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type {
  AccessItemDto,
  AccessRequestDetailDto,
  AccessTypes,
  RequestStatus,
} from "@/api/types"

interface RequestDetailsProps {
  request: AccessRequestDetailDto
  currentUserRole: string | null
  onApprove?: (
    itemId: number,
    confirmAccessType?: AccessTypes,
    reason?: string
  ) => void
  onReject?: (itemId: number, reason: string) => void
  onRevoke?: (itemId: number, reason: string) => void
  onResubmit?: (itemId: number, reason: string) => void
  onOpenResubmit?: (itemId: number) => void
  onRenew?: (itemId: number, reason: string) => void
  onExport?: () => void
}

const statusLabels: Record<RequestStatus, string> = {
  Submitted: "Submitted",
  PendingWithHod: "Pending with HOD",
  PendingWithIt: "Pending with IT",
  HodApproved: "HOD Approved",
  ItApproved: "IT Approved",
  HodRejected: "HOD Rejected",
  ItRejected: "IT Rejected",
  Revoked: "Revoked",
  Expired: "Expired",
}

const accessTypeLabels: Record<AccessTypes, string> = {
  NotApplicable: "Not Applicable",
  ReadOnly: "Read Only",
  ReadandWrite: "Read & Write",
}

const getStatusClass = (status: RequestStatus) => {
  if (status === "ItApproved") {
    return "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
  }

  if (status === "HodRejected" || status === "ItRejected") {
    return "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300"
  }

  if (status === "Expired" || status === "Revoked") {
    return "border-slate-500/20 bg-slate-500/10 text-slate-600 dark:text-slate-300"
  }

  return "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300"
}

const formatDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return "N/A"

  return new Date(dateStr).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })
}

const getAccessTypeLabel = (type: AccessTypes) => accessTypeLabels[type] ?? type

const getStatusLabel = (status: RequestStatus) => statusLabels[status] ?? status

export default function RequestDetails({
  request,
  currentUserRole,
  onApprove,
  onReject,
  onRevoke,
  onResubmit,
  onOpenResubmit,
  onRenew,
  onExport,
}: RequestDetailsProps) {
  const primaryTicketNumber =
    request.items.length === 1 ? request.items[0]?.ticketNumber : null
  const itemGridClass =
    request.items.length === 1 ? "grid gap-3" : "grid gap-3 xl:grid-cols-2"

  return (
    <div className="w-full space-y-4 rounded-2xl border border-border/70 bg-background/70 p-4 text-foreground shadow-sm">
      <header className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-card p-4 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold tracking-[0.18em] text-primary uppercase">
            <Ticket className="h-3.5 w-3.5" />
            <span>{primaryTicketNumber ? "Ticket" : "Request"}</span>
            <span className="truncate text-muted-foreground">
              {primaryTicketNumber ?? `#${request.requestId}`}
            </span>
          </div>
          <h1 className="mt-1 text-lg font-semibold tracking-tight md:text-xl">
            {primaryTicketNumber
              ? primaryTicketNumber
              : `Request #${request.requestId}`}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onExport}
            className="inline-flex h-8 items-center gap-2 rounded-xl border border-border bg-background px-3 text-xs font-semibold text-foreground shadow-sm transition-colors hover:bg-accent"
          >
            <Download className="h-3.5 w-3.5" />
            Export
          </button>
        </div>
      </header>

      <section className="rounded-2xl border border-border/70 bg-card p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold tracking-[0.18em] text-muted-foreground uppercase">
            Request Details
          </h2>
          <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
            {request.items.length} item(s)
          </span>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <DetailRow
            label="Request ID"
            value={String(request.requestId)}
            icon={Shield}
          />
          <DetailRow
            label="Requester Name"
            value={request.requesterName || "N/A"}
            icon={User}
          />
          <DetailRow
            label="Created On"
            value={formatDate(request.createdOn)}
            icon={CalendarDays}
          />
          <DetailRow
            label="ITSR No."
            value={request.itsrNo || "Not provided"}
            icon={Folder}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-border/70 bg-card p-4">
        <h2 className="mb-3 text-sm font-semibold tracking-[0.18em] text-muted-foreground uppercase">
          Requested Access Items
        </h2>

        <div className={itemGridClass}>
          {request.items.map((item) => (
            <AccessItemCard
              key={item.itemId}
              item={item}
              currentUserRole={currentUserRole}
              onApprove={onApprove}
              onReject={onReject}
              onRevoke={onRevoke}
              onResubmit={onResubmit}
              onOpenResubmit={onOpenResubmit}
              onRenew={onRenew}
            />
          ))}
        </div>
      </section>
    </div>
  )
}

function AccessItemCard({
  item,
  currentUserRole,
  onApprove,
  onReject,
  onRevoke,
  onResubmit,
  onOpenResubmit,
  onRenew,
}: {
  item: AccessItemDto
  currentUserRole: string | null
  onApprove?: (
    itemId: number,
    confirmAccessType?: AccessTypes,
    reason?: string
  ) => void
  onReject?: (itemId: number, reason: string) => void
  onRevoke?: (itemId: number, reason: string) => void
  onResubmit?: (itemId: number, reason: string) => void
  onOpenResubmit?: (itemId: number) => void
  onRenew?: (itemId: number, reason: string) => void
}) {
  const [modal, setModal] = useState<
    "approve" | "reject" | "revoke" | "resubmit" | "renew" | null
  >(null)
  const [reason, setReason] = useState("")
  const [confirmAccessType, setConfirmAccessType] = useState<AccessTypes>(
    item.confirmAccessType ?? item.accessType
  )
  const isAdmin = currentUserRole === "Admin"
  const isHod = currentUserRole === "Hod" || isAdmin
  const isOperator = currentUserRole === "Operator" || isAdmin
  const isUser = currentUserRole === "User"
  const canHodReview = isHod && item.status === "PendingWithHod"
  const canOperatorReview =
    isOperator &&
    (item.status === "PendingWithIt" || item.status === "HodApproved")
  const canRevoke = isOperator && item.status === "ItApproved"
  const canResubmit =
    isUser && (item.status === "HodRejected" || item.status === "ItRejected")
  const canRenew =
    isUser && (item.status === "ItApproved" || item.status === "Expired")
  const showActions =
    canHodReview || canOperatorReview || canRevoke || canResubmit || canRenew

  const openModal = (
    nextModal: "approve" | "reject" | "revoke" | "resubmit" | "renew"
  ) => {
    setReason("")
    setConfirmAccessType(item.confirmAccessType ?? item.accessType)
    setModal(nextModal)
  }

  const closeModal = () => {
    setModal(null)
    setReason("")
  }

  const submitModal = () => {
    const trimmedReason = reason.trim()
    const actionReason =
      trimmedReason ||
      (modal === "approve"
        ? canHodReview
          ? "Approved"
          : "Provisioned"
        : modal === "revoke"
          ? "Revoked"
          : modal === "resubmit"
            ? "Resubmitted"
            : "Renewed")

    if (modal === "approve") {
      onApprove?.(item.itemId, confirmAccessType, actionReason)
    }
    if (modal === "reject") onReject?.(item.itemId, actionReason)
    if (modal === "revoke") onRevoke?.(item.itemId, actionReason)
    if (modal === "resubmit") onResubmit?.(item.itemId, actionReason)
    if (modal === "renew") onRenew?.(item.itemId, actionReason)

    closeModal()
  }

  return (
    <article className="rounded-2xl border border-border/70 bg-background/90 p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs font-medium tracking-[0.16em] text-muted-foreground uppercase">
            Ticket Number
          </div>
          <div className="mt-1 text-sm font-semibold break-all">
            {item.ticketNumber}
          </div>
        </div>
        <span
          className={`rounded-full border px-3 py-1 text-xs font-semibold ${getStatusClass(
            item.status
          )}`}
        >
          {getStatusLabel(item.status)}
        </span>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <DetailRow label="Folder Path" value={item.folderPath} icon={Folder} />
        <DetailRow
          label="Access Type"
          value={getAccessTypeLabel(item.accessType)}
          icon={Shield}
        />
        <DetailRow
          label="Confirm Access"
          value={getAccessTypeLabel(item.confirmAccessType)}
          icon={Shield}
        />
        <DetailRow
          label="Valid Until"
          value={
            item.expiresAtUtc
              ? formatDate(item.expiresAtUtc)
              : "No expiry date set"
          }
          icon={Clock}
        />
      </div>

      <div className="mt-3 grid md:grid-cols-2 xl:grid-cols-4 gap-3">
        <DetailRow
          label="Reason"
          value={item.reason || "No reason provided"}
          icon={Mail}
        />
        <DetailRow
          label="Approved By (HOD)"
          value={item.approvedByHodName || "Not approved yet"}
          icon={Mail}
        />
        <DetailRow
          label="Approved By (IT)"
          value={item.approvedByITName || "Not approved yet"}
          icon={Mail}
        />
        <DetailRow
          label="Rejected By (HOD/IT)"
          value={item.rejectedByHodName || item.rejectedByITName || "Not rejected yet"}
          icon={Mail}
        />
      </div>

      {showActions && (
        <div className="mt-4 flex flex-wrap justify-end gap-2 border-t border-border/70 pt-4">
          {canHodReview && (
            <>
              <ActionButton
                label="Reject"
                icon={X}
                variant="danger"
                onClick={() => openModal("reject")}
              />
              <ActionButton
                label="Approve"
                icon={Check}
                variant="success"
                onClick={() => openModal("approve")}
              />
            </>
          )}

          {canOperatorReview && (
            <>
              <ActionButton
                label="Reject"
                icon={X}
                variant="danger"
                onClick={() => openModal("reject")}
              />
              <ActionButton
                label="Provision"
                icon={Check}
                variant="success"
                onClick={() => openModal("approve")}
              />
            </>
          )}

          {canRevoke && (
            <ActionButton
              label="Revoke"
              icon={Trash2}
              variant="warning"
              onClick={() => openModal("revoke")}
            />
          )}

          {canResubmit && (
            <ActionButton
              label="Resubmit"
              icon={RefreshCw}
              onClick={() => onOpenResubmit?.(item.itemId)}
            />
          )}

          {canRenew && (
            <ActionButton
              label="Renew"
              icon={RefreshCw}
              onClick={() => openModal("renew")}
            />
          )}
        </div>
      )}

      <ActionModal
        isOpen={modal !== null}
        title={
          modal === "approve"
            ? "Approve Access"
            : modal === "reject"
              ? "Reject Access"
              : modal === "revoke"
                ? "Revoke Access"
                : modal === "renew"
                  ? "Renew Access"
                  : "Resubmit Access"
        }
        reason={reason}
        onReasonChange={setReason}
        confirmAccessType={confirmAccessType}
        showConfirmAccessType={modal === "approve" && canHodReview}
        onConfirmAccessTypeChange={setConfirmAccessType}
        onCancel={closeModal}
        onSubmit={submitModal}
        submitLabel={modal === "approve" ? "Approve" : modal === "revoke" ? "Revoke" : modal === "reject" ? "Reject" : modal === "renew" ? "Renew" : "Resubmit"}
      />
    </article>
  )
}

function ActionButton({
  label,
  icon: Icon,
  variant = "default",
  onClick,
}: {
  label: string
  icon: React.ElementType
  variant?: "default" | "danger" | "success" | "warning"
  onClick?: () => void
}) {
  const variantClass =
    variant === "danger"
      ? "border-rose-500/30 bg-rose-500/10 text-rose-700 hover:bg-rose-500/15 dark:text-rose-300"
      : variant === "success"
        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/15 dark:text-emerald-300"
        : variant === "warning"
          ? "border-amber-500/30 bg-amber-500/10 text-amber-700 hover:bg-amber-500/15 dark:text-amber-300"
          : "border-border bg-card text-card-foreground hover:bg-accent"

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-9 items-center gap-2 rounded-xl border px-3 text-xs font-semibold shadow-sm transition-colors ${variantClass}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  )
}

function ActionModal({
  isOpen,
  title,
  reason,
  confirmAccessType,
  showConfirmAccessType,
  onReasonChange,
  onConfirmAccessTypeChange,
  onCancel,
  onSubmit,
  submitLabel,
}: {
  isOpen: boolean
  title: string
  reason: string
  confirmAccessType?: AccessTypes
  showConfirmAccessType?: boolean
  onReasonChange: (reason: string) => void
  onConfirmAccessTypeChange?: (value: AccessTypes) => void
  onCancel: () => void
  onSubmit: () => void
  submitLabel: string
}) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-xl">
        <h3 className="text-base font-semibold">{title}</h3>

        {showConfirmAccessType && (
          <div className="mt-4 space-y-2">
            <label className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Confirm Access Type
            </label>
            <Select
              value={confirmAccessType}
              onValueChange={(value) =>
                onConfirmAccessTypeChange?.(value as AccessTypes)
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select access type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NotApplicable">Not Applicable</SelectItem>
                <SelectItem value="ReadOnly">Read Only</SelectItem>
                <SelectItem value="ReadandWrite">Read & Write</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        

        <textarea
          rows={4}
          value={reason}
          onChange={(event) => onReasonChange(event.target.value)}
          placeholder="Enter reason or comments"
          className="mt-4 w-full rounded-xl border border-border bg-background p-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
        />
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="h-9 rounded-xl border border-border px-3 text-xs font-semibold hover:bg-accent"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSubmit}
            className="h-9 rounded-xl bg-primary px-3 text-xs font-semibold text-primary-foreground"
          >
            {submitLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

function DetailRow({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: string
  icon: React.ElementType
}) {
  return (
    <div className="min-w-0 rounded-xl border border-border/70 bg-background/90 p-3">
      <div className="mb-1 flex items-center gap-2 text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
        <Icon className="h-3.5 w-3.5 shrink-0" />
        <span>{label}</span>
      </div>
      <div className="text-sm font-medium break-all text-foreground">
        {value}
      </div>
    </div>
  )
}
