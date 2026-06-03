import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

import { useAuth } from "@/context/AuthContext"

import { AgreementCheckbox } from "./AgreementsSection"
import AccessDetailsSection, { type RequestItem } from "./AccessDetailsSection"
import { UserSection, type UserSectionValue } from "./UserSection"
import userApi from "@/api/userApi"
import { toast } from "sonner"
import accessRequestApi from "@/api/accessRequestApi"
import type { SubmitAccessRequestDto } from "@/api/types"

type CreateRequestModalProps = {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
}

export const CreateRequestModal = ({
    isOpen,
    onOpenChange,
}: CreateRequestModalProps) => {
    const { currentUser } = useAuth()
    const [isLoading, setIsLoading] = useState(false)
    const [requestItems, setRequestItems] = useState<RequestItem[]>([
        {
            id: 1,
            accessType: "not-applicable",
            folderPath: "",
            reason: "",
        },
    ])

    const handleUserChange = async (
        field: keyof UserSectionValue,
        fieldValue: string | number
    ) => {
        updateValue(field, fieldValue)

        if (!fieldValue) return

        const response = await userApi.getById(
            field === "userId"
                ? Number(fieldValue)
                : undefined,
            field === "employeeId"
                ? String(fieldValue)
                : undefined,
            field === "email"
                ? String(fieldValue)
                : undefined
        )

        if (!response.value) return

        const user = response.value

        setValue((prev) => ({
            ...prev,
            userId: user.user.userId,
            employeeId: user.cmplUser.empId ?? "",
            name: user.cmplUser.cmplUserName ?? "",
            email: user.cmplUser.mailId ?? "",
            departmentName:
                user.department?.deptName ?? "",
            hodName: user.hod?.hodName ?? "",
        }))
    }

    const [value, setValue] = useState({
        userId: currentUser?.user?.userId ?? 0,
        employeeId: currentUser?.cmplUser?.empId ?? "",
        name: currentUser?.cmplUser?.cmplUserName ?? "",
        email: currentUser?.cmplUser?.mailId ?? "",
        itsrNumber: "",
        departmentName: currentUser?.department?.deptName ?? "",
        hodName: currentUser?.hod?.hodName ?? "",
        location: currentUser?.user?.location ?? "",
        mobile: currentUser?.cmplUser?.mobNo ?? "",
        agreementAccepted: false,
    })

    const updateValue = (
        field: keyof typeof value,
        fieldValue: string | number | boolean
    ) => {
        setValue((prev) => ({
            ...prev,
            [field]: fieldValue,
        }))
    }

    const normalizeAccessType = (value: string): 0 | 1 | 2 => {
        switch (value) {
            case "read-only":
                return 1
            case "read-write":
                return 2
            default:
                return 0
        }
    }

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            const payload: SubmitAccessRequestDto = {
                userId: value.userId,
                isAgreed: value.agreementAccepted,
                itsrNo: value.itsrNumber || null,
                items: requestItems.map((item) => ({
                    folderPath: item.folderPath,
                    accessType: normalizeAccessType(item.accessType),
                    confirmAccessType: normalizeAccessType(item.confirmAccessType ?? item.accessType),
                    reason: item.reason,
                })),
            }

            const response = await accessRequestApi.submit(payload)

            if (response) {
                toast.success("Access request submitted successfully!")
                onOpenChange(false)
            }
        } catch (error) {
            console.error("Submission failed:", error)
            toast.error("Failed to create request. Please try again.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-6xl">
                <DialogHeader>
                    <DialogTitle className="text-3xl font-semibold text-primary">
                        Create New Request
                    </DialogTitle>
                    <DialogDescription>
                        Enter the details for your new access request.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleCreate} className="space-y-6">
                    <UserSection
                        value={value}
                        onChange={handleUserChange}
                    />

                    <AccessDetailsSection
                        items={requestItems}
                        onItemsChange={setRequestItems}
                    />

                    <AgreementCheckbox
                        checked={value.agreementAccepted}
                        onCheckedChange={(checked) =>
                            updateValue("agreementAccepted", !!checked)
                        }
                    />

                    <DialogFooter>
                        <Button type="submit" disabled={!value.agreementAccepted || isLoading}>
                            {isLoading ? "Submitting..." : "Create Request"}
                        </Button>
                        <Button variant="outline" type="button" onClick={() => onOpenChange(false)} disabled={isLoading}>
                            Close
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
