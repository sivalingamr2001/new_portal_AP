import { usersApi } from "@/api/usersApi"
import { Input } from "@/components/ui/input"
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll"
import { useEffect, useState } from "react"

export interface SelectedHod {
    userId: number
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
    // 1. Initialize search text cleanly from incoming parent state values
    const [search, setSearch] = useState(value?.hodName || "")
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

    // Debounced network search triggered when typing
    useEffect(() => {
        const timer = setTimeout(() => {
            loadData(1)
        }, 300)

        return () => clearTimeout(timer)
    }, [search])

    // Global document click listener handles window close events
    useEffect(() => {
        const close = () => setOpenDropdown(false)
        document.addEventListener("click", close)
        return () => {
            document.removeEventListener("click", close)
        }
    }, [])

    // 2. FIX: Synchronize the search box display text when the parent value changes or initializes
    useEffect(() => {
        if (value && value.hodName) {
            setSearch(value.hodName)
        } else if (value && value.userId > 0) {
            setSearch(String(value.userId))
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

    const handleSelect = (
        userId: number,
        hodName: string,
        emailId?: string
    ) => {
        // 3. FIX: Send structural integer objects back to parent hook validations
        onChange({
            userId: Number(userId),
            hodName,
            emailId,
        })
        setSearch(hodName)
        setOpenDropdown(false)
    }

    const normalizedSearch = search.trim().toLowerCase()

    const filteredHodList = hodList.filter((hod: any) => {
        const userIdStr = String(hod.userId || hod.id || "")
        const hodName = String(hod.hodName || hod.name || "").trim().toLowerCase()
        const email = String(hod.emailId || hod.email || "").trim().toLowerCase()

        if (!normalizedSearch) {
            return true
        }

        // Avoid filtering out items locally if the search text strictly matches the currently active selection
        if (value && value.hodName?.toLowerCase() === normalizedSearch) {
            return true
        }

        return [userIdStr, hodName, email].some(val =>
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
                        const uniqueId = Number(hod.userId || hod.id || 0)
                        const displayName = hod.hodName || hod.name || "N/A"
                        const email = hod.emailId || hod.email || "No Email"

                        const isNoEmail =
                            !email ||
                            email.trim().toLowerCase() === "no email"

                        // 4. FIX: Use matching numeric type checks to identify if active element is selected
                        const isSelected = Number(value?.userId) === uniqueId

                        return (
                            <button
                                type="button"
                                key={uniqueId}
                                className={`w-full px-3 py-2 text-left hover:bg-accent text-sm ${
                                    isSelected ? "bg-accent font-medium text-accent-foreground" : ""
                                }`}
                                onClick={() => handleSelect(uniqueId, displayName, email)}
                            >
                                <div>{displayName}</div>
                                <div
                                    className={`text-xs ${
                                        isNoEmail
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
