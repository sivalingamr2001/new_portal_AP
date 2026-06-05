import type { FolderMappingDto, UpsertFolderMappingRequest, FolderResponse } from "@/api/types"
import { folderMappingsApi } from "@/api/folderMappingsApi"
import { usersApi } from "@/api/usersApi"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useEffect, useState, startTransition } from "react"

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
  initialData: FolderMappingDto | null
  onSave: (payload: UpsertFolderMappingRequest) => Promise<void> // Fully matches DynamicGridPage contract
}

export const FolderMappingModal = ({ isOpen, onClose, initialData, onSave }: FolderMappingModalProps) => {
  const [loading, setLoading] = useState(false)
  const [folders, setFolders] = useState<FolderResponseDto[]>([])
  const [hods, setHods] = useState<HodDto[]>([])

  const [folderPath, setFolderPath] = useState<string>("")
  const [primaryHod, setPrimaryHod] = useState<HodDto | null>(null)
  const [secondaryHod, setSecondaryHod] = useState<HodDto | null>(null)

  // 1. Data Lookups aligned with non-wrapped raw endpoints context
  useEffect(() => {
    if (!isOpen) return

    const loadDropdownData = async () => {
      try {
        const [foldersRes, hodsRes] = await Promise.all([
          folderMappingsApi.getParentFolders(),
          usersApi.getHods()
        ])
        
        if (foldersRes) {
          // Normalize Drive/Path structure if needed from FolderResponse
          const transformedFolders = (foldersRes as any[]).map((f, idx) => ({
            id: String(idx),
            name: f.name || "",
            path: f.driveName ? `${f.driveName}:\\${f.name}` : f.name || ""
          }))
          setFolders(transformedFolders)
        }
        
        if (hodsRes) {
          const extractedHods = Array.isArray(hodsRes) 
            ? hodsRes 
            : ((hodsRes as any).data || (hodsRes as any).value || [])
          
          // Map backend attributes cleanly onto client UI dropdown models
          const normalizedHods = extractedHods.map((h: any) => ({
            id: String(h.employeeId || h.hodId || h.userId || h.id || ""),
            hodName: h.hodName || h.name || "N/A",
            emailId: h.emailId || h.email || ""
          }))
          setHods(normalizedHods)
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
        emailId: initialData.primaryHodEmail || ""
      })
      setSecondaryHod(initialData.secondaryHodId ? {
        id: initialData.secondaryHodId || "",
        hodName: initialData.secondaryHodName || "",
        emailId: initialData.secondaryHodEmail || ""
      } : null)
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
      secondaryHodEmail: secondaryHod?.emailId || null
    }

    try {
      await onSave(payload) // Orchestrated directly by the shared parent component
    } catch (err) {
      console.error("Failed to save folder mapping inside modular boundary:", err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(next) => !next && onClose()}>
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
                startTransition(() => setSecondaryHod(selected || null))
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
