import { useEffect, useState, type ChangeEvent, type ReactNode } from "react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import type { AccessRequestDto } from "@/api/types"

type AccessRequestDetails = AccessRequestDto & {
  empId?: string | number | null
  requesterName?: string
  departmentName?: string
}

type ApprovalReviewModalProps = {
  actionType: "approve" | "reject" | null
  details: AccessRequestDetails | null
  isOpen: boolean
  isPending: boolean
  selectedItemId?: number
  onClose: () => void
  onSubmit: (comments: string, confirmAccessType: number) => void
  role: "Hod" | "Admin"
}

function ApprovalReviewModal({
  actionType,
  details,
  isOpen,
  isPending,
  selectedItemId,
  onClose,
  onSubmit,
  role,
}: ApprovalReviewModalProps) {
  const [comments, setComments] = useState("")
  const [confirmAccessType, setConfirmAccessType] = useState<number>(1)

  // Filter to show only selected item, or all items if none selected
  const itemsToShow = selectedItemId
    ? details?.items.filter((entry) => entry.accessItemId === selectedItemId) ||
      []
    : details?.items || []

  useEffect(() => {
    if (!details) return
    setComments("")

    // Get the confirm access type for the selected item
    const selectedItem = selectedItemId
      ? details.items.find((entry) => entry.accessItemId === selectedItemId)
      : details.items[0]

    if (selectedItem) {
      const accessTypeValue =
        selectedItem.accessType === "ReadandWrite" || selectedItem.accessType === 2
          ? 2
          : selectedItem.accessType === "ReadOnly" || selectedItem.accessType === 1
            ? 1
            : 0
      setConfirmAccessType(accessTypeValue)
    }
  }, [details?.accessReqId, selectedItemId, actionType, isOpen])

  if (!details || !actionType) return null

  const handleSubmit = () => {
    onSubmit(comments, confirmAccessType)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl! sm:max-w-4xl!">
        <DialogHeader>
          <DialogTitle>
            {role === "Hod" ? "HOD Review & Approval" : "Operator / IT Review & Approval"} 
            • Request #{details.accessReqId}
          </DialogTitle>
          <DialogDescription>
            {actionType === "approve"
              ? `Click approve to ${role === "Hod" ? "verify access types and" : "authorize"} this request.`
              : `Click reject to deny this access request.`}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Employee ID">
            <Input disabled value={details.empId ?? details.userId} />
          </Field>
          <Field label="Requester">
            <Input disabled value={details.requesterName ?? details.userName} />
          </Field>
          <Field label="Department">
            <Input disabled value={details.departmentName ?? ""} />
          </Field>
          <Field label="ITSR Number">
            <Input disabled value={details.itsrNo || ""} />
          </Field>
        </div>

        {/* Access Items Section */}
        <div className="space-y-3 border-t pt-4">
          <h3 className="font-semibold">Access Items</h3>
          <div className="max-h-[40vh] space-y-3 overflow-y-auto">
            {/* Here selected access item details are shown for review and approval. */}
            {itemsToShow.map((item) => (
              <div
                key={item.accessItemId}
                className="rounded-lg border border-border bg-muted/50 p-4"
              >
                <div className="mb-3 grid gap-3 md:grid-cols-2">
                  <Field label="Folder Path">
                    <Input disabled value={item.folderPath} />
                  </Field>
                  <Field label="Reason for Access">
                    <Input disabled value={item.reason} />
                  </Field>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <Field label="Requested Access Type">
                    <Input disabled value={item.accessType} />
                  </Field>

                  <Field
                    label={`Confirm Access Type${role === "Hod" ? " (HOD)" : ""}`}
                  >
                    <Select
                      // Disable the dropdown if the user is NOT a Hod
                      disabled={role !== "Hod"}
                      value={String(confirmAccessType)}
                      onValueChange={(value) =>
                        setConfirmAccessType(Number(value))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Read Only</SelectItem>
                        <SelectItem value="2">Read & Write</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Comments Section */}
        <div className="space-y-3 border-t pt-4">
          <Field
            label={`${role === "Hod" ? "HOD" : "IT"} Comments & Verification`}
          >
            <Textarea
              className="min-h-32"
              placeholder={`Add your ${role === "Hod" ? "verification" : "review"} comments...`}
              value={comments}
              onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                setComments(event.target.value)
              }
            />
          </Field>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 border-t pt-4">
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button
            disabled={isPending}
            variant={actionType === "reject" ? "destructive" : "default"}
            onClick={handleSubmit}
          >
            {isPending
              ? "Processing..."
              : actionType === "reject"
                ? "Reject Request"
                : "Approve & Confirm"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function Field({
  children,
  label,
}: {
  children: ReactNode
  label: string
}) {
  return (
    <div className="space-y-2">
      <Label className="text-xs font-semibold">{label}</Label>
      {children}
    </div>
  )
}

export default ApprovalReviewModal
