import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import { useAuth } from "@/context/AuthContext"

import { AgreementCheckbox } from "./AgreementsSection"
import AccessDetailsSection, { type RequestItem } from "./AccessDetailsSection"
import { UserSection, type UserSectionValue } from "./UserSection"
import { toast } from "sonner"
import type { AccessTypes, SubmitAccessRequestDto } from "@/api/types"
import { accessRequestsApi } from "@/api/accessRequestsApi"
import { notificationsApi } from "@/api/notificationsApi"
import { usersApi } from "@/api/usersApi"

type CreateRequestModalProps = {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export const CreateRequestModal = ({
  isOpen,
  onOpenChange,
  onSuccess,
}: CreateRequestModalProps) => {
  const { currentUser } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [requestItems, setRequestItems] = useState<RequestItem[]>([
    {
      id: 1,
      accessType: "not-applicable",
      folderPath: "",
      reason: "",
    },
  ])

  const handleUserChange = async (
    field: keyof UserSectionValue,
    fieldValue: string | number
  ) => {
    updateValue(field, fieldValue)

    if (field !== "userId" || !fieldValue) return

    const userId = Number(fieldValue)
    if (!userId) return

    const response = await usersApi.getPortalUser(userId)

    if (!response?.user) return

    const user = response

    setValue((prev) => ({
      ...prev,
      userId: user.user?.id ?? 0,
      employeeId: user.user?.employeeId ?? "",
      name: user.user?.name ?? "",
      email: user.user?.email ?? "",
      departmentName: user.department?.name ?? "",
      hodName: user.headOfDepartment?.name ?? "",
    }))
  }

  const [value, setValue] = useState({
    userId: currentUser?.user?.id ?? 0,
    employeeId: currentUser?.user?.employeeId ?? "",
    name: currentUser?.user?.name ?? "",
    email: currentUser?.user?.email ?? "",
    itsrNumber: "",
    departmentName: currentUser?.department?.name ?? "",
    hodId: Number(currentUser?.headOfDepartment?.id ?? 0),
    hodName: currentUser?.headOfDepartment?.name ?? "",
    location: currentUser?.user?.location ?? "",
    mobile: currentUser?.user?.mobileNumber ?? "",
    agreementAccepted: false,
  })

  const updateValue = (
    field: keyof typeof value,
    fieldValue: string | number | boolean
  ) => {
    setValue((prev) => ({
      ...prev,
      [field]: fieldValue,
    }))
  }

  const normalizeAccessType = (value: string): AccessTypes => {
    switch (value) {
      case "read-only":
        return "ReadOnly"
      case "read-write":
        return "ReadandWrite"
      default:
        return "NotApplicable"
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const payload: SubmitAccessRequestDto = {
        reqTo: value.hodId,
        isAgreed: value.agreementAccepted,
        itsrNo: value.itsrNumber || null,
        items: requestItems.map((item) => ({
          folderPath: item.folderPath,
          accessType: normalizeAccessType(item.accessType),
          confirmAccessType: normalizeAccessType(
            item.confirmAccessType ?? item.accessType
          ),
          reason: item.reason,
        })),
      }

      const requestId = await accessRequestsApi.submitRequest(payload)

      if (requestId > 0) {
        await notificationsApi.getNotifications().catch(() => undefined)
        window.dispatchEvent(new CustomEvent("notifications:refresh"))
        onSuccess?.()

        toast.success("Access request submitted successfully!")
        setRequestItems([
          {
            id: 1,
            accessType: "not-applicable",
            folderPath: "",
            reason: "",
          },
        ])
        setValue((prev) => ({
          ...prev,
          itsrNumber: "",
          agreementAccepted: false,
        }))
        onOpenChange(false)
      }
    } catch (error) {
      console.error("Submission failed:", error)
      toast.error("Failed to create request. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-6xl">
        <DialogHeader>
          <DialogTitle className="text-3xl font-semibold text-primary">
            Create New Request
          </DialogTitle>
          <DialogDescription>
            Enter the details for your new access request.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleCreate} className="space-y-6">
          <UserSection value={value} onChange={handleUserChange} />

          <AccessDetailsSection
            items={requestItems}
            onItemsChange={setRequestItems}
          />

          <AgreementCheckbox
            checked={value.agreementAccepted}
            onCheckedChange={(checked) =>
              updateValue("agreementAccepted", !!checked)
            }
          />

          <DialogFooter>
            <Button
              type="submit"
              disabled={!value.agreementAccepted || isLoading}
            >
              {isLoading ? "Submitting..." : "Create Request"}
            </Button>
            <Button
              variant="outline"
              type="button"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Close
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
