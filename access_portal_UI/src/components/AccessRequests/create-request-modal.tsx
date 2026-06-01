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
import RequestDetailsSection from "./RequestDetailsSection"
import { UserSection, type UserSectionValue } from "./UserSection"
import userApi from "@/api/userApi"

type CreateRequestModalProps = {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
}

export const CreateRequestModal = ({
    isOpen,
    onOpenChange,
}: CreateRequestModalProps) => {
    const { currentUser } = useAuth()

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
        hodName: currentUser?.hod?.cmplUserName ?? "",
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

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault()

        console.log("Creating request:", value)

        onOpenChange(false)
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

                    <RequestDetailsSection />

                    <AgreementCheckbox
                        checked={value.agreementAccepted}
                        onCheckedChange={(checked) =>
                            updateValue("agreementAccepted", !!checked)
                        }
                    />

                    <DialogFooter>
                        <Button type="submit" disabled={!value.agreementAccepted}>
                            Create Request
                        </Button>
                        <Button variant="outline" onClick={() => onOpenChange(false)}>
                            Close
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
