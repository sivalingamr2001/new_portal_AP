import { ArrowLeft, ChevronRight, Folder, Search } from "lucide-react"
import { useMemo, useState } from "react"

import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "../ui/sheet"

export type FolderNode = {
  driveName: string
  name: string
  children?: FolderNode[]
}

type FolderPathSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  folders: FolderNode[]
  onSelect: (path: string) => void
}

export function FolderPathSheet({
  open,
  onOpenChange,
  folders,
  onSelect,
}: FolderPathSheetProps) {
  const [stack, setStack] = useState<FolderNode[]>([])
  const [search, setSearch] = useState("")

  const currentFolders = useMemo(() => {
    if (!stack.length) return folders
    return stack[stack.length - 1].children ?? []
  }, [folders, stack])

  const filteredFolders = useMemo(() => {
    if (!search.trim()) return currentFolders

    return currentFolders.filter((folder) =>
      folder.name.toLowerCase().includes(search.toLowerCase())
    )
  }, [currentFolders, search])

  const fullPath = useMemo(() => {
    if (!stack.length) return ""

    return `${stack[0].driveName}\\${stack.map((x) => x.name).join("\\")}`
  }, [stack])

  const handleFolderClick = (folder: FolderNode) => {
    if (folder.children?.length) {
      setStack((prev) => [...prev, folder])
      setSearch("")
      return
    }

    const selectedPath = `${folder.driveName}\\${[
      ...stack.map((x) => x.name),
      folder.name,
    ].join("\\")}`

    onSelect(selectedPath)
    onOpenChange(false)
    setStack([])
    setSearch("")
  }

  const handleBack = () => {
    setStack((prev) => prev.slice(0, -1))
    setSearch("")
  }

  const handleSelectCurrent = () => {
    if (!stack.length) return

    onSelect(fullPath)
    onOpenChange(false)
    setStack([])
    setSearch("")
  }

  const handleClose = (value: boolean) => {
    onOpenChange(value)

    if (!value) {
      setStack([])
      setSearch("")
    }
  }

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent className="w-130 p-0 sm:max-w-130">
        <SheetHeader className="border-b px-6 py-4">
          <SheetTitle>Select Folder Path</SheetTitle>

          {stack.length > 0 && (
            <div className="mt-2 text-xs break-all text-muted-foreground">
              {fullPath}
            </div>
          )}
        </SheetHeader>

        <div className="flex h-full flex-col">
          <div className="space-y-3 border-b p-4">
            {stack.length > 0 && (
              <Button variant="ghost" size="sm" onClick={handleBack}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            )}

            <div className="relative">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search folders..."
                className="pl-9"
              />
            </div>
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto p-4">
            {filteredFolders.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No folders found
              </div>
            ) : (
              filteredFolders.map((folder) => (
                <button
                  key={`${folder.driveName}-${folder.name}`}
                  type="button"
                  onClick={() => handleFolderClick(folder)}
                  className="flex w-full items-center justify-between rounded-md border px-4 py-3 text-left transition hover:bg-muted"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <Folder className="h-4 w-4 shrink-0 text-primary" />

                    <span className="truncate text-sm">{folder.name}</span>
                  </div>

                  {!!folder.children?.length && (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
              ))
            )}
          </div>

          {stack.length > 0 && (
            <div className="border-t p-4">
              <Button className="w-full" onClick={handleSelectCurrent}>
                Select This Folder
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
