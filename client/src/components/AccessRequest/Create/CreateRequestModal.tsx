import { useEffect, useMemo, useState, type FormEvent } from "react"
import { Plus, Trash2 } from "lucide-react"

import accessRequestApi from "@/api/accessRequestApi"
import folderMappingApi from "@/api/folderMappingApi"
import userApi from "@/api/userApi"
import type {
  AccessRequestDto,
  AccessRequestItemDto,
  AccessType,
  ApiLoginResponseDto,
  FolderMappingDto,
  FolderResponseDto,
  SubmitAccessRequestItemDto,
} from "@/api/types"
import { Button } from "@/components/ui/button"
import { FolderNavigator, type FolderNode } from "@/components/AccessRequest/Create/FolderNavigator"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/context/AuthContext"

type RequestModalMode = "create" | "resubmit" | "renew"

type EditableItem = {
  folderPath: string
  accessType: AccessType
  confirmAccessType: AccessType
  reason: string
}

type CreateRequestModalProps = {
  isOpen: boolean
  mode?: RequestModalMode
  request?: AccessRequestDto | null
  item?: AccessRequestItemDto | null
  onClose: () => void
  onSuccess: () => void | Promise<void>
}

const ACCESS_TYPES = [
  { value: 0, label: "Not Applicable" },
  { value: 1, label: "Read Only" },
  { value: 2, label: "Read and Write" },
]

const emptyItem = (): EditableItem => ({
  folderPath: "",
  accessType: 1,
  confirmAccessType: 1,
  reason: "",
})

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
  return candidate?.department?.deptName ?? ""
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

function buildFolderOptions(mappings: FolderMappingDto[]) {
  return mappings
    .map((mapping) => mapping.folderPath)
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b))
}

function normalizeFolderPath(rawPath: string) {
  return rawPath
    .replace(/\//g, "\\")
    .replace(/\\+/g, "\\")
    .trim()
}

function mapFolderHierarchy(
  nodes: FolderResponseDto[],
  parentPath = ""
): FolderNode[] {
  return nodes.map((node) => {
    const path = parentPath
      ? `${parentPath}\\${node.Name}`
      : `${node.DriveName}\\${node.Name}`

    return {
      id: path,
      name: node.Name,
      path,
      driveName: node.DriveName,
      children: node.Children ? mapFolderHierarchy(node.Children, path) : [],
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
  const [folderMappings, setFolderMappings] = useState<FolderMappingDto[]>([])
  const [folderTree, setFolderTree] = useState<FolderNode[]>([])
  const [folderTreeLoading, setFolderTreeLoading] = useState(false)
  const [folderTreeError, setFolderTreeError] = useState("")
  const [isFolderNavigatorOpen, setIsFolderNavigatorOpen] = useState(false)
  const [navigatorItemIndex, setNavigatorItemIndex] = useState<number | null>(null)
  const [activeItemIndex, setActiveItemIndex] = useState(0)
  const [selectedUser, setSelectedUser] = useState<ApiLoginResponseDto | null>(null)
  const [targetUserId, setTargetUserId] = useState(readUserId(currentUser))
  const [itsrNo, setItsrNo] = useState("")
  const [isAgreed, setIsAgreed] = useState(true)
  const [items, setItems] = useState<EditableItem[]>([emptyItem()])
  const [isPending, setIsPending] = useState(false)
  const [isFetchingUser, setIsFetchingUser] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  const isEditingItem = mode !== "create" && request && item
  const title =
    mode === "resubmit"
      ? "Resubmit Access Request"
      : mode === "renew"
        ? "Renew Access Request"
        : "Create Access Request"

  const submitLabel =
    mode === "resubmit" ? "Resubmit" : mode === "renew" ? "Renew" : "Create Request"

  const folderOptions = useMemo(
    () => buildFolderOptions(folderMappings),
    [folderMappings]
  )

  const loadFolderHierarchy = async () => {
    setFolderTreeError("")
    setFolderTreeLoading(true)

    try {
      const result = await folderMappingApi.getFolderHierarchy()
      if (result.isSuccess && result.value) {
        setFolderTree(mapFolderHierarchy(result.value))
      } else {
        throw new Error(result.error?.message ?? "Failed to load folder hierarchy")
      }
    } catch (error) {
      setFolderTreeError(getResultError(error))
    } finally {
      setFolderTreeLoading(false)
    }
  }

  const openFolderNavigator = async (index: number) => {
    setNavigatorItemIndex(index)
    setActiveItemIndex(index)
    setIsFolderNavigatorOpen(true)

    if (folderTree.length === 0) {
      await loadFolderHierarchy()
    }
  }

  const closeFolderNavigator = () => {
    setIsFolderNavigatorOpen(false)
    setNavigatorItemIndex(null)
  }

  const handleFolderSelection = (path: string) => {
    if (navigatorItemIndex === null) return

    updateItem(navigatorItemIndex, { folderPath: normalizeFolderPath(path) })
    closeFolderNavigator()
  }

  const toggleItem = (index: number) => {
    setActiveItemIndex((current) => (current === index ? -1 : index))
  }

  useEffect(() => {
    if (!isOpen) return

    const currentUserId = readUserId(currentUser)
    setErrorMessage("")
    setTargetUserId(request?.userId ?? currentUserId)
    setItsrNo(request?.itsrNo ?? "")
    setIsAgreed(true)
    setSelectedUser(null)
    setActiveItemIndex(0)

    if (isEditingItem && item) {
      setItems([
        {
          folderPath: item.folderPath,
          accessType: normalizeAccessType(item.accessType),
          confirmAccessType: normalizeAccessType(item.confirmAccessType),
          reason: item.reason,
        },
      ])
    } else {
      setItems([emptyItem()])
    }
  }, [currentUser, isEditingItem, isOpen, item, request])

  useEffect(() => {
    if (!isOpen) return

    folderMappingApi
      .getAll({ page: 1, pageSize: 100 })
      .then((result) => {
        if (result.isSuccess && result.value) {
          setFolderMappings(result.value.data)
        }
      })
      .catch((error) => setErrorMessage(getResultError(error)))
  }, [isOpen])

  useEffect(() => {
    if (!isOpen || !targetUserId) return

    const currentUserId = readUserId(currentUser)
    if (targetUserId === currentUserId) {
      setSelectedUser(currentUser as ApiLoginResponseDto)
      return
    }

    setIsFetchingUser(true)
    userApi
      .getById(targetUserId)
      .then((result) => {
        setSelectedUser(result.isSuccess && result.value ? result.value : null)
      })
      .catch(() => setSelectedUser(null))
      .finally(() => setIsFetchingUser(false))
  }, [currentUser, isOpen, targetUserId])

  const updateItem = (index: number, patch: Partial<EditableItem>) => {
    setItems((previous) =>
      previous.map((entry, entryIndex) =>
        entryIndex === index ? { ...entry, ...patch } : entry
      )
    )
  }

  const addItem = () => {
    setItems((previous) => {
      const next = [...previous, emptyItem()]
      setActiveItemIndex(next.length - 1)
      return next
    })
  }

  const removeItem = (index: number) => {
    setItems((previous) => {
      const next = previous.filter((_, entryIndex) => entryIndex !== index)

      setActiveItemIndex((current) => {
        if (current === index) {
          return next.length > 0 ? Math.min(index, next.length - 1) : -1
        }
        return current > index ? current - 1 : current
      })

      return next
    })
  }

  const validate = () => {
    if (!targetUserId) return "Select a valid employee."
    if (!isAgreed) return "Agreement is required before submitting."

    const invalidItem = items.find(
      (entry) => !entry.folderPath.trim() || !entry.reason.trim()
    )
    if (invalidItem) return "Each access item needs a folder path and reason."

    return ""
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const validationMessage = validate()
    if (validationMessage) {
      setErrorMessage(validationMessage)
      return
    }

    setIsPending(true)
    setErrorMessage("")

    try {
      if (mode === "create") {
        const payloadItems: SubmitAccessRequestItemDto[] = items.map((entry) => ({
          folderPath: entry.folderPath,
          accessType: entry.accessType,
          confirmAccessType: entry.confirmAccessType,
          reason: entry.reason.trim(),
        }))

        const result = await accessRequestApi.submit({
          userId: targetUserId,
          isAgreed,
          itsrNo: itsrNo.trim() || null,
          items: payloadItems,
        })

        if (!result.isSuccess) {
          throw new Error(result.error?.message)
        }
      } else if (request && item) {
        const editedItem = items[0]
        const payload = {
          userId: request.userId,
          folderPath: editedItem.folderPath,
          accessType: editedItem.accessType,
          confirmAccessType: editedItem.confirmAccessType,
          reason: editedItem.reason.trim(),
        }

        const result =
          mode === "renew"
            ? await accessRequestApi.renew(request.accessReqId, item.accessItemId, payload)
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

        <form onSubmit={handleSubmit} className="space-y-5 py-2">
          <section className="space-y-4 rounded-md border border-border bg-card p-4">
            <h3 className="text-sm font-semibold">Employee Information</h3>
            <div className="grid gap-4 md:grid-cols-3">
              <Field label="Employee ID">
                <Input
                  type="number"
                  value={targetUserId || ""}
                  disabled={mode !== "create"}
                  onChange={(event) => setTargetUserId(Number(event.target.value))}
                />
              </Field>
              <Field label="Employee Name">
                <Input
                  readOnly
                  value={
                    isFetchingUser
                      ? "Loading..."
                      : readUserName(selectedUser ?? currentUser)
                  }
                />
              </Field>
              <Field label="Email">
                <Input readOnly value={readUserEmail(selectedUser ?? currentUser)} />
              </Field>
              <Field label="Department">
                <Input readOnly value={readDepartmentName(selectedUser ?? currentUser)} />
              </Field>
              <Field label="Department HOD">
                <Input readOnly value={readHodName(selectedUser ?? currentUser)} />
              </Field>
              <Field label="ITSR Number">
                <Input
                  value={itsrNo}
                  disabled={mode !== "create"}
                  onChange={(event) => setItsrNo(event.target.value)}
                  placeholder="ITSR-001"
                />
              </Field>
            </div>
          </section>

          <section className="space-y-3 rounded-md border border-border bg-card p-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold">Access Items</h3>
              {mode === "create" ? (
                <Button type="button" size="sm" onClick={addItem}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Item
                </Button>
              ) : null}
            </div>

            <div className="space-y-3">
              {items.map((entry, index) => {
                const isExpanded = activeItemIndex === index

                return (
                  <div
                    key={index}
                    className="rounded-md border border-border p-3"
                  >
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <button
                        type="button"
                        className="min-w-0 flex-1 text-left"
                        onClick={() => toggleItem(index)}
                      >
                        <div className="text-xs font-semibold text-muted-foreground">
                          Item {index + 1}
                        </div>
                        <div className="truncate text-sm text-foreground">
                          {entry.folderPath || "No folder selected"}
                          {entry.folderPath ? (
                            <span className="text-muted-foreground"> · {ACCESS_TYPES.find((option) => option.value === entry.accessType)?.label ?? "Not Applicable"}</span>
                          ) : null}
                        </div>
                      </button>

                      <div className="flex items-center gap-2">
                        {mode === "create" && items.length > 1 ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeItem(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        ) : null}
                      </div>
                    </div>

                    {isExpanded && (
                      <>
                        <div className="grid gap-4 md:grid-cols-2">
                          <Field label="Folder Path">
                            <div className="flex items-center gap-2">
                              <Select
                                value={entry.folderPath}
                                onValueChange={(value) =>
                                  updateItem(index, { folderPath: value })
                                }
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Select folder" />
                                </SelectTrigger>
                                <SelectContent>
                                  {folderOptions.map((path) => (
                                    <SelectItem key={path} value={path}>
                                      {path}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>

                              <Button
                                type="button"
                                size="sm"
                                onClick={() => openFolderNavigator(index)}
                              >
                                Browse
                              </Button>
                            </div>
                          </Field>

                          <Field label="Access Type">
                            <Select
                              value={String(entry.accessType)}
                              onValueChange={(value) =>
                                updateItem(index, {
                                  accessType: Number(value) as AccessType,
                                  confirmAccessType: Number(value) as AccessType,
                                })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {ACCESS_TYPES.map((option) => (
                                  <SelectItem
                                    key={option.value}
                                    value={String(option.value)}
                                  >
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </Field>
                        </div>

                        <div className="mt-4">
                          <Field label="Reason">
                            <Textarea
                              value={entry.reason}
                              onChange={(event) =>
                                updateItem(index, { reason: event.target.value })
                              }
                              className="min-h-24"
                              placeholder="Why is this access required?"
                            />
                          </Field>
                        </div>

                        {isFolderNavigatorOpen && navigatorItemIndex === index && (
                          <div className="mt-4 rounded-3xl border border-border bg-background p-4">
                            {folderTreeLoading ? (
                              <div className="rounded-md border border-border/30 bg-card p-4 text-sm text-muted-foreground">
                                Loading folder hierarchy...
                              </div>
                            ) : folderTreeError ? (
                              <div className="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
                                {folderTreeError}
                              </div>
                            ) : (
                              <FolderNavigator
                                folders={folderTree}
                                onPathSelect={handleFolderSelection}
                                initialPath={entry.folderPath}
                              />
                            )}

                            <div className="mt-4 flex justify-end">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={closeFolderNavigator}
                              >
                                Close
                              </Button>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          </section>

          <label className="flex items-start gap-3 rounded-md border border-border bg-card p-4 text-sm">
            <Checkbox checked={isAgreed} onCheckedChange={(checked) => setIsAgreed(!!checked)} />
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

function Field({
  children,
  label,
}: {
  children: React.ReactNode
  label: string
}) {
  return (
    <div className="space-y-2">
      <Label className="text-xs font-semibold text-muted-foreground">{label}</Label>
      {children}
    </div>
  )
}

export default CreateRequestModal
