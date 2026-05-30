import { useEffect, useState } from "react"
import { Controller, useForm } from "react-hook-form"

import accessRequestApi from "@/api/accessRequestApi"
import folderMappingApi from "@/api/folderMappingApi"
import type {
  AccessRequestDto,
  AccessRequestItemDto,
  AccessType,
  ApiLoginResponseDto,
  FolderResponseDto,
  SubmitAccessRequestItemDto,
} from "@/api/types"
import userApi from "@/api/userApi"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useAuth } from "@/context/AuthContext"
import { AccessDetailsSection, type AccessRequestItemPayload, type AccessRequestPayload } from "./AccessDetailsSection"
import { EmployeeSection } from "./EmployeeSection"
import { type FolderNode } from "./FolderNavigator"

type RequestModalMode = "create" | "resubmit" | "renew"

type CreateRequestModalProps = {
  isOpen: boolean
  mode?: RequestModalMode
  request?: AccessRequestDto | null
  item?: AccessRequestItemDto | null
  onClose: () => void
  onSuccess: () => void | Promise<void>
}

const DEFAULT_ACCESS_ITEM: AccessRequestItemPayload = {
  folderPath: "",
  accessType: 1,
  confirmAccessType: 1,
  reason: "",
}

const readUserId = (user: unknown): number => {
  const candidate = user as any
  return (
    Number(candidate?.user?.userId) ||
    Number(candidate?.cmplUser?.cmplUserId) ||
    Number(candidate?.userId) ||
    0
  )
}

const readUserName = (user: unknown): string => {
  const candidate = user as any
  return candidate?.cmplUser?.cmplUserName ?? candidate?.userName ?? ""
}

const readUserEmail = (user: unknown): string => {
  const candidate = user as any
  return candidate?.cmplUser?.mailId ?? candidate?.userEmail ?? ""
}

const readDepartmentName = (user: unknown): string => {
  const candidate = user as any
  return candidate?.department?.deptName ?? candidate?.department?.deptId ?? "N/A"
}

const readHodName = (user: unknown): string => {
  const candidate = user as any
  return candidate?.hod?.hodName ?? ""
}

function normalizeAccessType(value: AccessType | undefined | null): AccessType {
  if (value === "ReadandWrite") return 2
  if (value === "ReadOnly") return 1
  if (value === "NotApplicable") return 0
  return (value ?? 1) as AccessType
}

function mapFolderHierarchy(
  nodes: FolderResponseDto[],
  parentPath = "",
  inheritedDriveName = ""
): FolderNode[] {
  return nodes.map((node) => {
    const driveName = node.DriveName || inheritedDriveName || ""
    const path = parentPath
      ? `${parentPath}\\${node.Name}`
      : driveName
      ? `${driveName}\\${node.Name}`
      : node.Name

    return {
      id: path,
      name: node.Name,
      path,
      driveName,
      children: node.Children ? mapFolderHierarchy(node.Children, path, driveName) : [],
    }
  })
}

function getResultError(error: unknown) {
  const candidate = error as any
  return (
    candidate?.response?.data?.error?.message ??
    candidate?.response?.data?.message ??
    candidate?.message ??
    "Request could not be completed."
  )
}

function CreateRequestModal({
  isOpen,
  mode = "create",
  request,
  item,
  onClose,
  onSuccess,
}: CreateRequestModalProps) {
  const { currentUser } = useAuth()
  const [folderTree, setFolderTree] = useState<FolderNode[]>([])
  const [folderTreeError, setFolderTreeError] = useState("")
  const [selectedUser, setSelectedUser] = useState<ApiLoginResponseDto | null>(null)
  const [isPending, setIsPending] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  const form = useForm<AccessRequestPayload>({
    defaultValues: {
      userId: readUserId(currentUser),
      isAgreed: true,
      itsrNo: "",
      items: [DEFAULT_ACCESS_ITEM],
    },
  })

  const { handleSubmit, watch, reset, setValue, control } = form
  const targetUserId = watch("userId")

  const isEditingItem = mode !== "create" && request && item
  const title =
    mode === "resubmit"
      ? "Resubmit Access Request"
      : mode === "renew"
      ? "Renew Access Request"
      : "Create Access Request"

  const submitLabel =
    mode === "resubmit" ? "Resubmit" : mode === "renew" ? "Renew" : "Create Request"

  const loadFolderHierarchy = async () => {
    setFolderTreeError("")

    try {
      const result = await folderMappingApi.getFolderHierarchy()
      if (result.isSuccess && result.value) {
        setFolderTree(mapFolderHierarchy(result.value))
      } else {
        throw new Error(result.error?.message ?? "Failed to load folder hierarchy")
      }
    } catch (error) {
      setFolderTreeError(getResultError(error))
    }
  }

  useEffect(() => {
    if (!isOpen) return

    const currentUserId = readUserId(currentUser)
    setErrorMessage("")
    setSelectedUser(null)

    reset({
      userId: request?.userId ?? currentUserId,
      isAgreed: true,
      itsrNo: request?.itsrNo ?? "",
      items:
        isEditingItem && item
          ? [
              {
                folderPath: item.folderPath,
                accessType: normalizeAccessType(item.accessType),
                confirmAccessType: normalizeAccessType(item.confirmAccessType),
                reason: item.reason,
              },
            ]
          : [DEFAULT_ACCESS_ITEM],
    })
  }, [currentUser, isEditingItem, isOpen, item, request, reset])

  useEffect(() => {
    if (!isOpen || folderTree.length > 0) return
    loadFolderHierarchy()
  }, [isOpen, folderTree.length])

  useEffect(() => {
    if (!isOpen || !targetUserId) return

    const currentUserId = readUserId(currentUser)
    if (targetUserId === currentUserId) {
      setSelectedUser(currentUser as ApiLoginResponseDto)
      return
    }

    userApi
      .getById(targetUserId)
      .then((result) => {
        setSelectedUser(result.isSuccess && result.value ? result.value : null)
      })
      .catch(() => setSelectedUser(null))
  }, [currentUser, isOpen, targetUserId])

  const buildEmployeeName = () =>
    readUserName(selectedUser ?? currentUser)

  const buildEmployeeEmail = () =>
    readUserEmail(selectedUser ?? currentUser)

  const buildDepartmentName = () =>
    readDepartmentName(selectedUser ?? currentUser)

  const buildHodName = () =>
    readHodName(selectedUser ?? currentUser)

  const validate = (values: AccessRequestPayload) => {
    if (!values.userId) return "Select a valid employee."
    if (!values.isAgreed) return "Agreement is required before submitting."

    const invalidItem = values.items.find(
      (entry) => !entry.folderPath.trim() || !entry.reason.trim()
    )
    if (invalidItem) return "Each access item needs a folder path and reason."

    return ""
  }

  const onSubmit = async (values: AccessRequestPayload) => {
    const validationMessage = validate(values)
    if (validationMessage) {
      setErrorMessage(validationMessage)
      return
    }

    setIsPending(true)
    setErrorMessage("")

    try {
      if (mode === "create") {
        const payloadItems: SubmitAccessRequestItemDto[] = values.items.map(
          (entry) => ({
            folderPath: entry.folderPath,
            accessType: entry.accessType as AccessType,
            confirmAccessType: entry.confirmAccessType as AccessType,
            reason: entry.reason.trim(),
          })
        )

        const result = await accessRequestApi.submit({
          userId: values.userId,
          isAgreed: values.isAgreed,
          itsrNo: values.itsrNo.trim() || null,
          items: payloadItems,
        })

        if (!result.isSuccess) {
          throw new Error(result.error?.message)
        }
      } else if (request && item) {
        const editedItem = values.items[0]
        const payload = {
          userId: request.userId,
          folderPath: editedItem.folderPath,
          accessType: editedItem.accessType as AccessType,
          confirmAccessType: editedItem.confirmAccessType as AccessType,
          reason: editedItem.reason.trim(),
        }

        const result =
          mode === "renew"
            ? await accessRequestApi.renew(
                request.accessReqId,
                item.accessItemId,
                payload
              )
            : await accessRequestApi.resubmit(
                request.accessReqId,
                item.accessItemId,
                payload
              )

        if (!result.isSuccess) {
          throw new Error(result.error?.message)
        }
      }

      await onSuccess()
      onClose()
    } catch (error) {
      setErrorMessage(getResultError(error))
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-h-[90vh] w-[92vw]! max-w-5xl! overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-3xl text-primary">{title}</DialogTitle>
          <DialogDescription>
            {isEditingItem
              ? `Update ticket ${item?.ticketNumber} and send it back for approval.`
              : "Create folder access for yourself or another employee."}
          </DialogDescription>
        </DialogHeader>

        {errorMessage ? (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {errorMessage}
          </div>
        ) : null}

        {folderTreeError ? (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {folderTreeError}
          </div>
        ) : null}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 py-2">
          <EmployeeSection
            userId={targetUserId}
            name={buildEmployeeName()}
            email={buildEmployeeEmail()}
            departmentName={buildDepartmentName()}
            hodName={buildHodName()}
            onUserIdChange={(value) => setValue("userId", value)}
          />

          <AccessDetailsSection
            form={form}
            folders={folderTree}
            canManageItems={mode === "create"}
          />

          <label className="flex items-start gap-3 rounded-md border border-border bg-card p-4 text-sm">
            <Controller
              control={control}
              name="isAgreed"
              render={({ field }) => (
                <Checkbox
                  checked={field.value}
                  onCheckedChange={(checked) => field.onChange(!!checked)}
                />
              )}
            />
            <span>
              I agree that this access is for authorized business use and will be
              reviewed through the approval workflow.
            </span>
          </label>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Submitting..." : submitLabel}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default CreateRequestModal
