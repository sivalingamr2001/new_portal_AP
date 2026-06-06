import { folderMappingsApi } from "@/api/folderMappingsApi"
import type {
  FolderMappingDto,
  UpsertFolderMappingRequest
} from "@/api/types"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useEffect, useState } from "react"
import { HodSelect } from "../Hod/HodSelect"
import { toast } from "sonner"

export interface FolderResponseDto {
  id?: string | null
  name?: string
  path?: string
  [key: string]: any
}

interface FolderMappingModalProps {
  isOpen: boolean
  onClose: () => void
  initialData: FolderMappingDto | null
  onSuccess?: () => void
}

export const FolderMappingModal = ({
  isOpen,
  onClose,
  initialData,
  onSuccess,
}: FolderMappingModalProps) => {
  const [loading, setLoading] = useState(false)
  const [folders, setFolders] = useState<FolderResponseDto[]>([])

  const [folderPath, setFolderPath] = useState<string>("")
  const [primaryHod, setPrimaryHod] = useState<{
    id: string
    hodName?: string
    emailId?: string
  } | null>(null)
  const [secondaryHod, setSecondaryHod] = useState<{
    id: string
    hodName?: string
    emailId?: string
  } | null>(null)

  // 1. Data Lookups aligned with non-wrapped raw endpoints context
  useEffect(() => {
    if (!isOpen) return

    const loadDropdownData = async () => {
      try {
        const foldersRes = await folderMappingsApi.getParentFolders()

        if (foldersRes) {
          // Normalize Drive/Path structure if needed from FolderResponse
          const transformedFolders = (foldersRes as any[]).map((f, idx) => ({
            id: String(idx),
            name: f.name || "",
            path: f.driveName ? `${f.driveName}:\\${f.name}` : f.name || "",
          }))
          setFolders(transformedFolders)
        }
      } catch (err) {
        console.error("Failed to load modal dropdown data", err)
      }
    }

    loadDropdownData()
  }, [isOpen])

  // 2. Clear or set form parameters on lifecycle visibility change mutations
  useEffect(() => {
    if (isOpen && initialData) {
      setFolderPath(initialData.folderPath || "")

      setPrimaryHod({
        id: initialData.primaryHodId || "",
        hodName: initialData.primaryHodName || "",
        emailId: initialData.primaryHodEmail || "",
      })
      setSecondaryHod(
        initialData.secondaryHodId
          ? {
              id: initialData.secondaryHodId || "",
              hodName: initialData.secondaryHodName || "",
              emailId: initialData.secondaryHodEmail || "",
            }
          : null
      )
    } else if (!isOpen) {
      setFolderPath("")
      setPrimaryHod(null)
      setSecondaryHod(null)
    }
  }, [isOpen, initialData])

  // 3. Delegation pipeline hand-off execution routing
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const payload: UpsertFolderMappingRequest = {
      folderPath,
      primaryHodId: primaryHod?.id || null,
      primaryHodName: primaryHod?.hodName || null,
      primaryHodEmail: primaryHod?.emailId || null,
      secondaryHodId: secondaryHod?.id || null,
      secondaryHodName: secondaryHod?.hodName || null,
      secondaryHodEmail: secondaryHod?.emailId || null,
    }

    try {
      if (initialData?.id) {
        await folderMappingsApi.updateFolderMapping(initialData.id, payload)
      } else {
        await folderMappingsApi.createFolderMapping(payload)
      }

      toast.success(
        initialData
          ? "Folder mapping updated successfully"
          : "Folder mapping created successfully"
      )

      onSuccess?.()
      onClose()
    } catch (err) {
      console.error(
        "Failed to save folder mapping inside modular boundary:",
        err
      )
      toast.error("Failed to save folder mapping")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-106.25">
        <DialogHeader>
          <DialogTitle>
            {initialData ? "Update" : "Create"} Folder Mapping
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="folderPath">Folder Path</Label>
            <select
              id="folderPath"
              value={folderPath}
              onChange={(e) => setFolderPath(e.target.value)}
              className="w-full rounded-md border bg-background p-2 text-sm"
              required
            >
              <option value="">Select Folder</option>
              {folders.map((f, idx) => {
                const val = f.path || f.name || ""
                return (
                  <option key={f.id || idx} value={val}>
                    {val}
                  </option>
                )
              })}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="primaryHod">Primary HOD</Label>
            {/* HodSelect returns EmployeeId */}
            <HodSelect
              value={
                primaryHod
                  ? {
                      userId: Number(primaryHod.id || 0),
                      hodName: primaryHod.hodName || "",
                      emailId: primaryHod.emailId,
                    }
                  : null
              }
              onChange={(hod) => {
                setPrimaryHod({
                  id: String(hod.userId),
                  hodName: hod.hodName,
                  emailId: hod.emailId,
                })
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="secondaryHod">Secondary HOD</Label>
            {/* HodSelect returns EmployeeId */}
            <HodSelect
              value={
                secondaryHod
                  ? {
                      userId: Number(secondaryHod.id || 0),
                      hodName: secondaryHod.hodName || "",
                      emailId: secondaryHod.emailId,
                    }
                  : null
              }
              onChange={(hod) => {
                setSecondaryHod({
                  id: String(hod.userId),
                  hodName: hod.hodName,
                  emailId: hod.emailId,
                })
              }}
            />
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
