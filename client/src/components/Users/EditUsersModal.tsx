import React, { useEffect } from "react";
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

// UserRole mapping definition matching string values
export const UserRole = {
    Admin: "Admin",
    Operator: "Operator",
    Hod: "Hod",
    User: "User",
} as const;

export type UserRoleType = typeof UserRole[keyof typeof UserRole];

interface FormValues {
    role: string;
    location: string;
}

interface EditUsersModalProps {
    isOpen: boolean;
    onClose: () => void;
    userData: any | null;
    onSave: (updatedData: FormValues) => void;
}

export const EditUsersModal = ({
    isOpen,
    onClose,
    userData,
    onSave,
}: EditUsersModalProps) => {
    const {
        register,
        handleSubmit,
        control,
        reset,
        formState: { isSubmitting, errors },
    } = useForm<FormValues>({
        defaultValues: {
            role: "",
            location: "",
        },
    });

    // Automatically maps and resets values into form fields when userData shifts or loads
    useEffect(() => {
        if (isOpen && userData?.user) {
            reset({
                role: userData.user.role || "",
                location: userData.user.location || "",
            });
        } else if (!isOpen) {
            reset({ role: "", location: "" });
        }
    }, [userData, isOpen, reset]);

    return (
        <Dialog open={isOpen} onOpenChange={(next) => !next && onClose()}>
            <DialogContent className="max-h-[90vh] w-[30vw]! max-w-5xl! overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-3xl text-primary">Edit User</DialogTitle>
                    <DialogDescription>
                        <span className="font-semibold text-foreground">
                            {userData?.cmplUser?.cmplUserName || "Employee"}
                        </span>{" "}
                        ({userData?.cmplUser?.mailId || "No email"}).
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSave)} className="space-y-5 py-2">
                    {/* Main Form Fields wrapper */}
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-1 rounded-md border border-border bg-card p-4">

                        {/* Role Dropdown Selector */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">Assigned Role</label>
                            <Controller
                                control={control}
                                name="role"
                                rules={{ required: "Please select a role" }}
                                render={({ field }) => (
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select functional role" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value={UserRole.Admin}>Admin</SelectItem>
                                            <SelectItem value={UserRole.Operator}>Operator</SelectItem>
                                            <SelectItem value={UserRole.Hod}>Hod</SelectItem>
                                            <SelectItem value={UserRole.User}>User</SelectItem>
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                            {errors.role && (
                                <p className="text-xs text-destructive">{errors.role.message}</p>
                            )}
                        </div>

                        {/* Location Form Input Field */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">Work Location</label>
                            <Input
                                type="text"
                                placeholder="Enter workspace location or branch"
                                {...register("location", { required: "Please enter an office location" })}
                            />
                            {errors.location && (
                                <p className="text-xs text-destructive">{errors.location.message}</p>
                            )}
                        </div>

                    </div>

                    {/* Dialog Action Buttons */}
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
