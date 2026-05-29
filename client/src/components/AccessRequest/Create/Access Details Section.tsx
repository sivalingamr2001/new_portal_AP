import type { AccessType } from "@/api/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Trash2 } from "lucide-react"

export type AccessDetailsItem = {
  folderPath: string
  accessType: AccessType
  confirmAccessType: AccessType
  reason: string
}

type AccessDetailsSectionProps = {
  items: AccessDetailsItem[]
  canAddItems?: boolean
  onAddItem: () => void
  onRemoveItem: (index: number) => void
  onChangeItem: (index: number, item: AccessDetailsItem) => void
}

export function AccessDetailsSection({
  items,
  canAddItems = true,
  onAddItem,
  onRemoveItem,
  onChangeItem,
}: AccessDetailsSectionProps) {
  return (
    <section className="space-y-3 rounded-md border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold">Access Details</h3>
        {canAddItems ? (
          <Button type="button" size="sm" onClick={onAddItem}>
            <Plus className="mr-2 h-4 w-4" />
            Add Item
          </Button>
        ) : null}
      </div>

      {items.map((item, index) => (
        <div key={index} className="space-y-3 rounded-md border border-border p-3">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-semibold text-muted-foreground">
              Item {index + 1}
            </span>
            {canAddItems && items.length > 1 ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => onRemoveItem(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            ) : null}
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-xs font-semibold">Folder Path</Label>
              <Input
                value={item.folderPath}
                onChange={(event) =>
                  onChangeItem(index, { ...item, folderPath: event.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold">Reason</Label>
              <Textarea
                value={item.reason}
                onChange={(event) =>
                  onChangeItem(index, { ...item, reason: event.target.value })
                }
              />
            </div>
          </div>
        </div>
      ))}
    </section>
  )
}
