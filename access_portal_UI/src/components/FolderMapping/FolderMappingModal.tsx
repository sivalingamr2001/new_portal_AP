import { userApi } from "@/api"
import folderMappingApi from "@/api/folderMappingApi"
import type { FolderMappingDto } from "@/api/types"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useEffect, useState } from "react"

export interface HodDto {
  idRow?: number
  hodName: string
  id?: string | null
  emailId?: string | null
  mobNo?: string | null
}

export interface FolderResponseDto {
  id?: string | null
  name?: string
  path?: string
  [key: string]: any 
}

interface FolderMappingModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  initialData: FolderMappingDto | null
}

export const FolderMappingModal = ({ isOpen, onClose, onSuccess, initialData }: FolderMappingModalProps) => {
  const [loading, setLoading] = useState(false)
  const [folders, setFolders] = useState<FolderResponseDto[]>([])
  const [hods, setHods] = useState<HodDto[]>([])

  // Form States - Guaranteed strict strings
  const [folderPath, setFolderPath] = useState<string>("")
  const [primaryHod, setPrimaryHod] = useState<HodDto | null>(null)
  const [secondaryHod, setSecondaryHod] = useState<HodDto | null>(null)

  useEffect(() => {
    if (!isOpen) return

    const loadDropdownData = async () => {
      try {
        const [foldersRes, hodsRes] = await Promise.all([
          folderMappingApi.getFolderParents(),
          userApi.getHods()
        ])
        
        if (foldersRes.isSuccess && foldersRes.value) {
          setFolders(foldersRes.value)
        }
        
        if (hodsRes.isSuccess && hodsRes.value) {
          setHods(hodsRes.value)
        }
      } catch (err) {
        console.error("Failed to load modal dropdown data", err)
      }
    }

    loadDropdownData()
  }, [isOpen])

  useEffect(() => {
    if (isOpen && initialData) {
      // Fallback with '|| ""' prevents string | null | undefined errors
      setFolderPath(initialData.folderPath || "")
      
      setPrimaryHod({
        id: initialData.primaryHodId || "",
        hodName: initialData.primaryHodName || "",
        emailId: initialData.primaryHodEmail || ""
      })
      setSecondaryHod({
        id: initialData.secondaryHodId || "",
        hodName: initialData.secondaryHodName || "",
        emailId: initialData.secondaryHodEmail || ""
      })
    } else if (isOpen) {
      setFolderPath("")
      setPrimaryHod(null)
      setSecondaryHod(null)
    }
  }, [isOpen, initialData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const payload = {
      folderPath,
      primaryHodId: primaryHod?.id || "",
      primaryHodName: primaryHod?.hodName || "",
      primaryHodEmail: primaryHod?.emailId || "",
      secondaryHodId: secondaryHod?.id || "",
      secondaryHodName: secondaryHod?.hodName || "",
      secondaryHodEmail: secondaryHod?.emailId || ""
    }

    try {
      if (initialData?.id) {
        await folderMappingApi.update(initialData.id, payload)
      } else {
        await folderMappingApi.create(payload)
      }
      onSuccess()
      onClose()
    } catch (err) {
      console.error("Failed to save folder mapping", err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{initialData ? "Update" : "Create"} Folder Mapping</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          
          <div className="space-y-2">
            <Label htmlFor="folderPath">Folder Path</Label>
            <select
              id="folderPath"
              value={folderPath}
              onChange={(e) => setFolderPath(e.target.value)}
              className="w-full p-2 border rounded-md bg-background text-sm"
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
            <select
              id="primaryHod"
              value={primaryHod?.id || ""}
              onChange={(e) => {
                const selected = hods.find(h => h.id === e.target.value)
                setPrimaryHod(selected || null)
              }}
              className="w-full p-2 border rounded-md bg-background text-sm"
              required
            >
              <option value="">Select Primary HOD</option>
              {hods.map((h, idx) => (
                <option key={h.id || idx} value={h.id || ""}>
                  {h.hodName} {h.emailId ? `(${h.emailId})` : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="secondaryHod">Secondary HOD</Label>
            <select
              id="secondaryHod"
              value={secondaryHod?.id || ""}
              onChange={(e) => {
                const selected = hods.find(h => h.id === e.target.value)
                setSecondaryHod(selected || null)
              }}
              className="w-full p-2 border rounded-md bg-background text-sm"
            >
              <option value="">Select Secondary HOD (Optional)</option>
              {hods.map((h, idx) => (
                <option key={h.id || idx} value={h.id || ""}>
                  {h.hodName} {h.emailId ? `(${h.emailId})` : ""}
                </option>
              ))}
            </select>
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
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
