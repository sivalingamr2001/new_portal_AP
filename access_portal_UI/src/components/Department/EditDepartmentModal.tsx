import { usersApi } from "@/api/usersApi"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useEffect, useState } from "react"
import { Controller, useForm } from "react-hook-form"

export interface UpdateDepartmentRequest {
  deptName?: string | null
  hodId?: string | null
}

interface EditDepartmentModalProps {
  isOpen: boolean
  onClose: () => void
  departmentData: any | null
  onSave: (payload: UpdateDepartmentRequest) => Promise<void>
}

export const EditDepartmentModal = ({
  isOpen,
  onClose,
  departmentData,
  onSave,
}: EditDepartmentModalProps) => {
  const [hodList, setHodList] = useState<any[]>([])
  const [loadingHods, setLoadingHods] = useState(false)

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { isSubmitting, errors },
  } = useForm<UpdateDepartmentRequest>({
    defaultValues: {
      deptName: "",
      hodId: null,
    },
  })

  useEffect(() => {
    const fetchHods = async () => {
      if (!isOpen) return
      try {
        setLoadingHods(true)
        const result: any = await usersApi.getHods()

        if (result) {
          const extractedArray = Array.isArray(result)
            ? result
            : result.data || result.value || []
          setHodList(extractedArray)
        }
      } catch (error) {
        console.error("Failed to fetch HOD list:", error)
        setHodList([])
      } finally {
        setLoadingHods(false)
      }
    }
    fetchHods()
  }, [isOpen])

  useEffect(() => {
    if (isOpen && departmentData) {
      reset({
        deptName: departmentData.name || "",
        hodId: departmentData.hodId ? String(departmentData.hodId) : null,
      })
    } else if (!isOpen) {
      reset({ deptName: "", hodId: null })
    }
  }, [departmentData, isOpen, reset])

  const onSubmit = async (data: UpdateDepartmentRequest) => {
    const payload: UpdateDepartmentRequest = {
      deptName: data.deptName?.trim() || null,
      hodId: data.hodId ? data.hodId.toString() : null,
    }
    await onSave(payload)
  }

  return (
    <Dialog open={isOpen} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-h-[90vh] w-[30vw]! max-w-5xl! overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-3xl text-primary">
            Edit Department
          </DialogTitle>
          <DialogDescription>
            Update the department details for {""}
            <span className="font-semibold text-foreground">
              {departmentData?.name || departmentData?.id}
            </span>
            .
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 py-2">
          <div className="grid grid-cols-1 gap-5 rounded-md border border-border bg-card p-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Department Name
              </label>
              <Input
                type="text"
                placeholder="Enter department name"
                {...register("deptName", {
                  required: "Department name is required",
                })}
              />
              {errors.deptName && (
                <p className="text-xs text-destructive">
                  {errors.deptName.message}
                </p>
              )}
            </div>

            {/* HOD Dropdown Selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Assigned HOD
              </label>
              <Controller
                control={control}
                name="hodId"
                rules={{ required: "Please select an HOD" }}
                render={({ field }) => (
                  <Select
                    onValueChange={(val) => field.onChange(val)}
                    value={field.value ? String(field.value) : ""}
                    disabled={loadingHods}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue
                        placeholder={
                          loadingHods ? "Loading HODs..." : "Select HOD"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {hodList.map((hod: any) => {
                        const uniqueId = hod.hodId || hod.userId || hod.id

                        return (
                          <SelectItem key={uniqueId} value={String(uniqueId)}>
                            {hod.hodName || hod.name || "N/A"} (
                            {hod.emailId || hod.email || "No Email"})
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.hodId && (
                <p className="text-xs text-destructive">
                  {errors.hodId.message}
                </p>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving changes..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
