import { usersApi } from "@/api/usersApi"
import { Input } from "@/components/ui/input"
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll"
import { useEffect, useState } from "react"

export interface SelectedHod {
    employeeId: string
    hodName: string
    emailId?: string
}

interface HodSelectProps {
    value?: SelectedHod | null
    onChange: (hod: SelectedHod) => void
    placeholder?: string
}

export const HodSelect = ({
    value,
    onChange,
    placeholder = "Search and select HOD...",
}: HodSelectProps) => {
    const [search, setSearch] = useState(
        value?.hodName || value?.employeeId || ""
    )
    const [openDropdown, setOpenDropdown] = useState(false)

    const {
        rowData: hodList,
        page,
        totalPages,
        loading: loadingHods,
        loadData,
        loadMore,
    } = useInfiniteScroll({
        pageSize: 20,
        fetchRequest: (page, pageSize) =>
            usersApi.getHods({
                page,
                pageSize,
                search: search.trim().toLowerCase(),
            }),
        onError: (error) => {
            console.error("Failed to fetch HOD list:", error)
        },
    })

    useEffect(() => {
        loadData(1)
    }, [])

    useEffect(() => {
        const timer = setTimeout(() => {
            loadData(1)
        }, 300)

        return () => clearTimeout(timer)
    }, [search])

    useEffect(() => {
        const close = () => setOpenDropdown(false)

        document.addEventListener("click", close)

        return () => {
            document.removeEventListener("click", close)
        }
    }, [])

    useEffect(() => {
        if (value) {
            setSearch(value.hodName || value.employeeId || "")
        }
    }, [value])

    const handleDropdownScroll = async (
        e: React.UIEvent<HTMLDivElement>
    ) => {
        const target = e.currentTarget

        const reachedBottom =
            target.scrollTop + target.clientHeight >=
            target.scrollHeight - 50

        if (!loadingHods && page < totalPages && reachedBottom) {
            await loadMore(page + 1)
        }
    }

    const handleSelect = (
        employeeId: string,
        hodName: string,
        emailId?: string
    ) => {
        onChange({
            employeeId,
            hodName,
            emailId,
        })

        setSearch(hodName)
        setOpenDropdown(false)
    }

    const normalizedSearch = search.trim().toLowerCase()

    const filteredHodList = hodList.filter((hod: any) => {
        const employeeId = String(hod.employeeId ?? "")
            .trim()
            .toLowerCase()

        const hodName = String(hod.hodName ?? hod.name ?? "")
            .trim()
            .toLowerCase()

        const email = String(hod.emailId ?? hod.email ?? "")
            .trim()
            .toLowerCase()

        if (!normalizedSearch) {
            return true
        }

        return [employeeId, hodName, email].some(value =>
            value.includes(normalizedSearch)
        )
    })

    return (
        <div className="relative">
            <Input
                placeholder={placeholder}
                value={search}
                onClick={(e) => {
                    e.stopPropagation()
                    setOpenDropdown(true)
                }}
                onChange={(e) => {
                    setSearch(e.target.value)
                    setOpenDropdown(true)
                }}
            />

            {openDropdown && (
                // Final client-side filter to prevent stale records from previous searches.
                <div
                    className="absolute top-full z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-md border bg-popover shadow-md"
                    onClick={(e) => e.stopPropagation()}
                    onScroll={handleDropdownScroll}
                >
                    {filteredHodList.map((hod: any) => {
                        const uniqueId =
                            hod.employeeId || "N/A"

                        const displayName =
                            hod.hodName || hod.name || "N/A"

                        const email =
                            hod.emailId || hod.email || "No Email"

                        const isNoEmail =
                            !email ||
                            email.trim().toLowerCase() === "no email"

                        const isSelected =
                            value?.employeeId === String(uniqueId)

                        return (
                            <button
                                type="button"
                                key={uniqueId}
                                className={`w-full px-3 py-2 text-left hover:bg-accent ${isSelected ? "bg-accent" : ""
                                    }`}
                                onClick={() =>
                                    handleSelect(
                                        String(uniqueId),
                                        displayName,
                                        email
                                    )
                                }
                            >
                                <div>{displayName}</div>

                                <div
                                    className={`text-xs ${isNoEmail
                                        ? "text-destructive"
                                        : "text-muted-foreground"
                                        }`}
                                >
                                    {email}
                                </div>
                            </button>
                        )
                    })}

                    {loadingHods && (
                        <div className="p-2 text-center text-sm text-muted-foreground">
                            Loading more records...
                        </div>
                    )}

                    {!loadingHods &&
                        page >= totalPages &&
                        hodList.length > 0 && (
                            <div className="p-2 text-center text-xs text-muted-foreground">
                                End of results
                            </div>
                        )}
                </div>
            )}
        </div>
    )
}