'use client'

import { useState } from "react"
import { Controller, useFieldArray, type UseFormReturn } from "react-hook-form"
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { Plus, Settings, Trash } from 'lucide-react'
import { FolderNavigator, type FolderNode } from './FolderNavigator'
import { useAuth } from '@/context/AuthContext'
import type { AccessType } from '@/api/types'

export type AccessRequestItemPayload = {
  folderPath: string
  accessType: AccessType
  confirmAccessType: AccessType
  reason: string
}

export type AccessRequestPayload = {
  userId: number
  isAgreed: boolean
  itsrNo: string
  items: AccessRequestItemPayload[]
}

interface AccessDetailsSectionProps {
  form: UseFormReturn<AccessRequestPayload>
  folders: FolderNode[]
  canManageItems?: boolean
}

export type AppRole = "User" | "Hod" | "Admin" | "Operator"

export const ACCESS_TYPES = {
  NotApplicable: 0,
  ReadOnly: 1,
  ReadAndWrite: 2,
} as const

const ACCESS_TYPE_OPTIONS = [
  { id: ACCESS_TYPES.NotApplicable, label: "Not Applicable" },
  { id: ACCESS_TYPES.ReadOnly, label: 'Read Only' },
  { id: ACCESS_TYPES.ReadAndWrite, label: 'Read & Write' },
]

const DEFAULT_ITEM: AccessRequestItemPayload = {
  folderPath: '',
  accessType: ACCESS_TYPES.NotApplicable,
  confirmAccessType: 0,
  reason: '',
}

export function AccessDetailsSection({
  form,
  folders,
  canManageItems = true,
}: AccessDetailsSectionProps) {
  const { control, watch, setValue } = form
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  })
  const [activeModalIndex, setActiveModalIndex] = useState<number | null>(null)
  const { currentUserRole } = useAuth()
  const isHod = currentUserRole === 'Hod'

  const watchedItems = watch('items')

  const handlePathSelect = (index: number, path: string) => {
    setValue(`items.${index}.folderPath`, path, {
      shouldDirty: true,
      shouldTouch: true,
    })
  }

  const addAccessItem = () => {
    append(DEFAULT_ITEM)
    setActiveModalIndex(fields.length)
  }

  const removeAccessItem = (index: number) => {
    remove(index)

    if (activeModalIndex === index) {
      setActiveModalIndex(null)
    } else if (activeModalIndex !== null && activeModalIndex > index) {
      setActiveModalIndex(activeModalIndex - 1)
    }
  }

  const activeIndex = activeModalIndex ?? -1
  const activeValues = watchedItems?.[activeIndex]

  return (
    <div className="space-y-4 rounded-lg border border-border bg-card p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-primary">
            <h3 className="text-base font-semibold">Access Details</h3>
            <span className="h-1 w-1 rounded-full bg-primary/40 shrink-0" />
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary/10 px-1.5 text-xs font-bold text-primary">
              {fields.length}
            </span>
          </div>
        </div>

        {canManageItems ? (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Button type="button" size="sm" onClick={addAccessItem} className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" /> Add Access Item
            </Button>
          </div>
        ) : null}
      </div>

      <div className="w-full max-h-87.5 overflow-y-auto pr-1 scrollbar-thin space-y-2">
        {fields.map((field, index) => {
          const item = watchedItems?.[index] ?? { folderPath: '', accessType: 0 }
          const folderPath = item.folderPath
          const itemAccessType = item.accessType

          return (
            <div key={field.id} className="flex items-center gap-2 w-full group">
              <button
                type="button"
                onClick={() => setActiveModalIndex(index)}
                className="flex-1 flex items-center justify-between gap-4 text-left rounded-lg border border-border bg-background px-4 py-3.5 text-sm font-medium text-foreground transition-all hover:bg-muted/40 data-[state=open]:border-primary/30"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center rounded-md bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                    Item {index + 1}
                  </div>

                  <Separator orientation="vertical" className="h-4 bg-border/60" />

                  <div className="flex flex-wrap items-center gap-2.5 text-xs font-normal text-muted-foreground">
                    <span
                      className={`font-medium max-w-60 truncate ${
                        folderPath
                          ? 'text-foreground/80'
                          : 'text-muted-foreground/60 italic'
                      }`}
                    >
                      {folderPath || 'Click to select folder path...'}
                    </span>

                    <span
                      className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                        folderPath ? 'bg-primary animate-pulse' : 'bg-muted-foreground/30'
                      }`}
                    />

                    <span
                      className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                        itemAccessType === ACCESS_TYPES.NotApplicable
                          ? 'bg-muted-foreground/30 text-muted-foreground'
                          : itemAccessType === ACCESS_TYPES.ReadOnly
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {ACCESS_TYPE_OPTIONS.find((option) => option.id === itemAccessType)
                        ?.label ?? 'Unknown Access'}
                    </span>
                  </div>
                </div>

                <Settings className="h-4 w-4 text-muted-foreground/60 group-hover:text-primary transition-colors" />
              </button>

              {canManageItems && fields.length > 1 ? (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="shrink-0 text-muted-foreground hover:text-destructive hover:border-destructive"
                  onClick={(event) => {
                    event.stopPropagation()
                    removeAccessItem(index)
                  }}
                >
                  <Trash className="h-4 w-4" />
                </Button>
              ) : null}
            </div>
          )
        })}
      </div>

      <Dialog
        open={activeModalIndex !== null}
        onOpenChange={(isOpen) => {
          if (!isOpen) setActiveModalIndex(null)
        }}
      >
        <DialogContent className="sm:max-w-137.5 gap-6">
          {activeModalIndex !== null && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <span>Item Access</span>
                  <span className="rounded bg-primary/10 px-2 py-0.5 text-xs text-primary font-bold">
                    Item {activeModalIndex + 1}
                  </span>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4 py-1">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground">
                      Access Type
                    </Label>
                    <Controller
                      control={control}
                      name={`items.${activeModalIndex}.accessType` as const}
                      render={({ field }) => (
                        <Select
                          value={String(field.value ?? ACCESS_TYPES.NotApplicable)}
                          onValueChange={(value) => field.onChange(Number(value))}
                        >
                          <SelectTrigger className="text-sm">
                            <SelectValue placeholder="Select access type" />
                          </SelectTrigger>
                          <SelectContent>
                            {ACCESS_TYPE_OPTIONS.map((type) => (
                              <SelectItem key={type.id} value={type.id.toString()}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>

                  {isHod ? (
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-muted-foreground">
                        HOD Confirmation
                      </Label>
                      <Controller
                        control={control}
                        name={`items.${activeModalIndex}.confirmAccessType` as const}
                        render={({ field }) => (
                          <Select
                            value={String(field.value ?? 0)}
                            onValueChange={(value) => field.onChange(Number(value))}
                          >
                            <SelectTrigger className="text-sm">
                              <SelectValue placeholder="Not confirmed" />
                            </SelectTrigger>
                            <SelectContent>
                              {ACCESS_TYPE_OPTIONS.map((type) => (
                                <SelectItem key={type.id} value={type.id.toString()}>
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                  ) : null}
                </div>

                <div className="border rounded-lg p-3 bg-muted/30">
                  <FolderNavigator
                    folders={folders}
                    onPathSelect={(path) => handlePathSelect(activeModalIndex, path)}
                    initialPath={activeValues?.folderPath ?? ''}
                    maxDepth={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground">
                    Reason for Access
                  </Label>
                  <Controller
                    control={control}
                    name={`items.${activeModalIndex}.reason` as const}
                    render={({ field }) => (
                      <Textarea
                        {...field}
                        placeholder="Please explain why you need access to this folder..."
                        className="min-h-24 resize-none text-sm"
                        maxLength={500}
                      />
                    )}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  className="w-full sm:w-auto"
                  onClick={() => setActiveModalIndex(null)}
                >
                  Save & Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
