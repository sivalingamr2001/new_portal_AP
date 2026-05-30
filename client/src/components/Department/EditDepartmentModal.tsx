import React, { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import userApi from "@/api/userApi"; // Adjust this import based on where your getHods api is located

export interface UpdateDepartmentRequest {
    deptName?: string | null;
    hodId?: number | null;
}

interface EditDepartmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    departmentData: any | null;
    onSave: (payload: UpdateDepartmentRequest) => Promise<void>;
}

export const EditDepartmentModal = ({
    isOpen,
    onClose,
    departmentData,
    onSave,
}: EditDepartmentModalProps) => {
    const [hodList, setHodList] = useState<any[]>([]);
    const [loadingHods, setLoadingHods] = useState(false);

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
    });

    // Fetch HOD dropdown options
    useEffect(() => {
        const fetchHods = async () => {
            if (!isOpen) return;
            try {
                setLoadingHods(true);
                const result = await userApi.getHods();
                if (result.isSuccess && result.value) {
                    setHodList(result.value);
                }
            } catch (error) {
                console.error("Failed to fetch HOD list:", error);
            } finally {
                setLoadingHods(false);
            }
        };
        fetchHods();
    }, [isOpen]);

    // Handle form dynamic initialization on open
    useEffect(() => {
        if (isOpen && departmentData) {
            reset({
                deptName: departmentData.department?.deptName || "",
                hodId: departmentData.hod?.hodId ? departmentData.hod.hodId : null,
            });
        } else if (!isOpen) {
            reset({ deptName: "", hodId: null });
        }
    }, [departmentData, isOpen, reset]);

    const onSubmit = async (data: UpdateDepartmentRequest) => {
        // Form states keep inputs as strings; safely cast back to a number or null for API
        const payload: UpdateDepartmentRequest = {
            deptName: data.deptName?.trim() || null,
            hodId: data.hodId ? Number(data.hodId) : null,
        };
        await onSave(payload);
    };

    return (
        <Dialog open={isOpen} onOpenChange={(next) => !next && onClose()}>
            <DialogContent className="max-h-[90vh] w-[30vw]! max-w-5xl! overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-3xl text-primary">Edit Department</DialogTitle>
                    <DialogDescription>
                        Update the department details for{" "}
                        <span className="font-semibold text-foreground">
                            {departmentData?.department?.deptName || "Department"}
                        </span>.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 py-2">
                    <div className="grid grid-cols-1 gap-5 rounded-md border border-border bg-card p-4">

                        {/* Department Name Input Field */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">Department Name</label>
                            <Input
                                type="text"
                                placeholder="Enter department name"
                                {...register("deptName", { required: "Department name is required" })}
                            />
                            {errors.deptName && (
                                <p className="text-xs text-destructive">{errors.deptName.message}</p>
                            )}
                        </div>

                        {/* HOD Dropdown Selector */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">Assigned HOD</label>
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
                                            <SelectValue placeholder={loadingHods ? "Loading HODs..." : "Select HOD"} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {hodList.map((hod: any) => {
                                                // Fallback chain to find the actual unique ID property from your API response
                                                const uniqueId = hod.hodId || hod.userId || hod.id;

                                                return (
                                                    <SelectItem key={uniqueId} value={String(uniqueId)}>
                                                        {hod.hodName || hod.name} ({hod.emailId || hod.email})
                                                    </SelectItem>
                                                );
                                            })}
                                        </SelectContent>

                                    </Select>
                                )}
                            />
                            {errors.hodId && (
                                <p className="text-xs text-destructive">{errors.hodId.message}</p>
                            )}
                        </div>

                    </div>

                    {/* Form Actions */}
                    <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                        <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? "Saving changes..." : "Save Changes"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};
