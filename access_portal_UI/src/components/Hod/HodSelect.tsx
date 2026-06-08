import { usersApi } from "@/api/usersApi"
import { Input } from "@/components/ui/input"
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll"
import { useEffect, useState } from "react"

// 1. Updated interface contract to strictly pass string keys to parent
export interface SelectedHod {
    employeeId: string // Unique identifier used by Department entity (hod_id)
    email: string      // Assigned email identifier (email_id)
    hodName: string    // Clean display name
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
    // Initialize search text using the incoming structural HOD display name
    const [search, setSearch] = useState(value?.hodName || "")
    const [openDropdown, setOpenDropdown] = useState(false)

    // Using your existing infinite scroll hook, feeding search params to your API
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

    // Debounced layout search logic
    useEffect(() => {
        const timer = setTimeout(() => {
            loadData(1)
        }, 300)

        return () => clearTimeout(timer)
    }, [search])

    // Global document click event handling to automatically clear dropdown overlay focus
    useEffect(() => {
        const close = () => setOpenDropdown(false)
        document.addEventListener("click", close)
        return () => {
            document.removeEventListener("click", close)
        }
    }, [])

    // 2. Synchronize search text input overlay when parent values update dynamically
    useEffect(() => {
        if (value && value.hodName) {
            setSearch(value.hodName)
        } else if (value && value.employeeId) {
            setSearch(value.employeeId)
        } else {
            setSearch("")
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

    // 3. Selection handler returning string objects matching backend entities
    const handleSelect = (
        employeeId: string,
        email: string,
        hodName: string
    ) => {
        onChange({
            employeeId: String(employeeId).trim(),
            email: String(email).trim(),
            hodName: hodName.trim(),
        })
        setSearch(hodName)
        setOpenDropdown(false)
    }

    const normalizedSearch = search.trim().toLowerCase()

    // Evaluates records locally to maximize UX responsivity
    const filteredHodList = hodList.filter((hod: any) => {
        const empIdStr = String(hod.employeeId || hod.id || "").trim().toLowerCase()
        const nameStr = String(hod.hodName || hod.name || "").trim().toLowerCase()
        const emailStr = String(hod.emailId || hod.email || "").trim().toLowerCase()

        if (!normalizedSearch) {
            return true
        }

        // Avoid filtering out items locally if the search text strictly matches the currently active selection
        if (value && value.hodName?.toLowerCase() === normalizedSearch) {
            return true
        }

        return [empIdStr, nameStr, emailStr].some(val =>
            val.includes(normalizedSearch)
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
                <div
                    className="absolute top-full z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-md border bg-popover shadow-md"
                    onClick={(e) => e.stopPropagation()}
                    onScroll={handleDropdownScroll}
                >
                    {filteredHodList.length === 0 && !loadingHods && (
                        <div className="p-3 text-center text-sm text-muted-foreground">
                            No matching HOD records found
                        </div>
                    )}

                    {filteredHodList.map((hod: any) => {
                        // Extracting parameters dynamically according to varying backend property casing
                        const currentEmpId = String(hod.employeeId || hod.id || "")
                        const currentEmail = String(hod.emailId || hod.email || "")
                        const displayName = String(hod.hodName || hod.name || "N/A")

                        const isNoEmail =
                            !currentEmail ||
                            currentEmail.trim().toLowerCase() === "no email"

                        // 4. Match values via string tracking expressions instead of integers
                        const isSelected =
                            value?.employeeId?.toLowerCase() === currentEmpId.toLowerCase() ||
                            (!!value?.email && value.email.toLowerCase() === currentEmail.toLowerCase())

                        return (
                            <button
                                type="button"
                                key={`${currentEmpId}-${currentEmail}`}
                                className={`w-full px-3 py-2 text-left hover:bg-accent text-sm ${isSelected ? "bg-accent font-medium text-accent-foreground" : ""
                                    }`}
                                onClick={() => handleSelect(currentEmpId, currentEmail, displayName)}
                            >
                                <div className="font-medium">{displayName}</div>
                                <div className="flex justify-between text-xs mt-0.5">
                                    <span>Code: {currentEmpId || "N/A"}</span>
                                </div>
                                <div className="flex justify-between text-xs mt-0.5">
                                    <span className={isNoEmail ? "text-destructive" : ""}>
                                        Email: {currentEmail ? currentEmail : "No Email"}
                                    </span>
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
