import {
  AlertTriangle,
  ChevronRight,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react"
import { useState, useMemo, useCallback, useRef, useEffect } from "react"

import { Loader } from "@/components/Loader"
import { Button } from "@/components/ui/button"
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  useRegions,
  useBillToCustomers,
  useShipToCustomers,
  useOperatingUnits,
  useCustomerAddresses,
  useWeeksDropdown,
  useOrganizations,
  useDemandMetrics,
  useRrsCategory,
  useCreateAllocation,
  useItems,
} from "@/hooks/useAllocationApi"
import type {
  CreateAllocationRequest,
  CreateLineRequest,
  Customer,
  CustomerAddress,
  OperatingUnit,
  InventoryItem,
} from "@/api/allocationApi"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"

/* ─────────────── TYPES ─────────────── */

interface LineItem {
  id: string
  organizationId: number | null
  organizationCode: string
  inventoryItemId: number | null
  itemCode: string
  description: string
  week: string
  quantity: number | ""
  targetDate: string
  metrics: {
    oaPendingQuantity: number
    oaRsvQty: number
    oaPickedQty: number
    binQty: number
    binRsvQty: number
  } | null
  isRunnerItem: boolean
  itemError: string | null
  loadingItem: boolean
}

/* ─────────────── HELPERS ─────────────── */

const fieldClass =
  "w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"

const labelClass = "text-xs font-medium text-muted-foreground block mb-1.5"

function generateId() {
  return Math.random().toString(36).slice(2, 9)
}

function MetricsCell({ value }: { value: number | undefined }) {
  return (
    <span className="font-mono text-[11px] font-medium text-muted-foreground">
      {value?.toLocaleString() ?? "—"}
    </span>
  )
}

function formatAddress(addr: CustomerAddress | null): string {
  if (!addr) return ""
  const parts = [
    addr.address1,
    addr.address2,
    addr.address3,
    addr.city,
    addr.postalCode,
  ].filter(Boolean)
  return parts.join("\n")
}

/* ─────────────── COMPONENT ─────────────── */

export function AllocationScreen() {
  /* ── UI State ── */
  const [customerDetailsOpen, setCustomerDetailsOpen] = useState(true)
  const [regionSearch, setRegionSearch] = useState("")
  const [subRegionSearch, setSubRegionSearch] = useState("")
  const [operatingUnitSearch, setOperatingUnitSearch] = useState("")
  const [billToCustomerSearch, setBillToCustomerSearch] = useState("")
  const [shipToCustomerSearch, setShipToCustomerSearch] = useState("")
  const [billToLocationSearch, setBillToLocationSearch] = useState("")
  const [shipToLocationSearch, setShipToLocationSearch] = useState("")
  const [orgSearchByLine, setOrgSearchByLine] = useState<
    Record<string, string>
  >({})
  const [itemSearchByLine, setItemSearchByLine] = useState<
    Record<string, string>
  >({})
  const [weekSearch, setWeekSearch] = useState("")

  /* ── Form State ── */
  const [allocationBasis, setAllocationBasis] = useState<"customer" | "open">(
    "customer"
  )
  const [selectedRegion, setSelectedRegion] = useState("")
  const [selectedSubRegion, setSelectedSubRegion] = useState("")
  const [operatingUnit, setOperatingUnit] = useState<OperatingUnit | null>(null)
  const [billToCustomer, setBillToCustomer] = useState<Customer | null>(null)
  const [shipToCustomer, setShipToCustomer] = useState<Customer | null>(null)
  const [billToLocation, setBillToLocation] = useState<CustomerAddress | null>(
    null
  )
  const [shipToLocation, setShipToLocation] = useState<CustomerAddress | null>(
    null
  )
  const [remarks, setRemarks] = useState("")
  const [lines, setLines] = useState<LineItem[]>([
    {
      id: generateId(),
      organizationId: null,
      organizationCode: "",
      inventoryItemId: null,
      itemCode: "",
      description: "",
      week: "",
      quantity: "",
      targetDate: "",
      metrics: null,
      isRunnerItem: false,
      itemError: null,
      loadingItem: false,
    },
  ])

  /* ── API Hooks ── */
  const regionsHook = useRegions()
  const operatingUnitsHook = useOperatingUnits()
  const weeksHook = useWeeksDropdown()
  const organizationsHook = useOrganizations()

  const navigate = useNavigate()

  const billToCustomersHook = useBillToCustomers(
    selectedRegion,
    selectedSubRegion
  )
  const shipToCustomersHook = useShipToCustomers(
    selectedRegion,
    selectedSubRegion
  )

  const billToAddressesHook = useCustomerAddresses(
    billToCustomer?.customerId ?? 0,
    "BILL_TO",
    operatingUnit?.organizationId
  )
  const shipToAddressesHook = useCustomerAddresses(
    shipToCustomer?.customerId ?? 0,
    "SHIP_TO",
    operatingUnit?.organizationId
  )

  const itemsHook = useItems()
  const demandMetricsHook = useDemandMetrics(0, 0, 0)
  const rrsCategoryHook = useRrsCategory(0, 0)
  const createAllocationHook = useCreateAllocation()
  const { currentRegion } = useAuth()

  useEffect(() => {
    if (currentRegion?.region) {
      setSelectedRegion(currentRegion.region);
    }
  }, [currentRegion]);

  useEffect(() => {
    itemsHook.execute(1, 10).catch(() => { })
  }, [itemsHook])

  /* ── Derived Data ── */
  const regionNames = useMemo(
    () => [...new Set((regionsHook.data ?? []).map((r) => r.region))],
    [regionsHook.data]
  )

  const subRegionsForSelected = useMemo(
    () =>
      selectedRegion
        ? [
          ...new Set(
            (regionsHook.data ?? [])
              .filter((r) => r.region === selectedRegion)
              .map((r) => r.subRegion)
          ),
        ]
        : [],
    [regionsHook.data, selectedRegion]
  )

  const filteredRegionNames = useMemo(
    () =>
      regionNames.filter((r) =>
        r.toLowerCase().includes(regionSearch.trim().toLowerCase())
      ),
    [regionNames, regionSearch]
  )

  const filteredSubRegions = useMemo(() => {
    // 1. Split any comma-separated strings into individual array items, trim spaces, and remove duplicates
    const individualSubRegions = Array.from(
      new Set(
        subRegionsForSelected
          .flatMap((r) => (r ? r.split(",") : []))
          .map((item) => item.trim())
          .filter(Boolean)
      )
    )

    // 2. Filter the clean list based on your search input
    const searchNormalized = subRegionSearch.trim().toLowerCase()
    return individualSubRegions.filter((r) =>
      r.toLowerCase().includes(searchNormalized)
    )
  }, [subRegionsForSelected, subRegionSearch])

  const filteredOperatingUnits = useMemo(
    () =>
      (operatingUnitsHook.data ?? []).filter((u) =>
        u.name.toLowerCase().includes(operatingUnitSearch.trim().toLowerCase())
      ),
    [operatingUnitsHook.data, operatingUnitSearch]
  )

  const filteredBillToCustomers = useMemo(
    () =>
      (billToCustomersHook.data ?? []).filter((c) =>
        c.customerName
          .toLowerCase()
          .includes(billToCustomerSearch.trim().toLowerCase())
      ),
    [billToCustomersHook.data, billToCustomerSearch]
  )

  const filteredShipToCustomers = useMemo(
    () =>
      (shipToCustomersHook.data ?? []).filter((c) =>
        c.customerName
          .toLowerCase()
          .includes(shipToCustomerSearch.trim().toLowerCase())
      ),
    [shipToCustomersHook.data, shipToCustomerSearch]
  )

  const filteredBillToAddresses = useMemo(
    () =>
      (billToAddressesHook.data ?? []).filter((a) =>
        `${a.location} ${a.address1}`
          .toLowerCase()
          .includes(billToLocationSearch.trim().toLowerCase())
      ),
    [billToAddressesHook.data, billToLocationSearch]
  )

  const filteredShipToAddresses = useMemo(
    () =>
      (shipToAddressesHook.data ?? []).filter((a) =>
        `${a.location} ${a.address1}`
          .toLowerCase()
          .includes(shipToLocationSearch.trim().toLowerCase())
      ),
    [shipToAddressesHook.data, shipToLocationSearch]
  )

  const filteredWeeks = useMemo(
    () =>
      (weeksHook.data ?? []).filter((w) =>
        w.toLowerCase().includes(weekSearch.trim().toLowerCase())
      ),
    [weeksHook.data, weekSearch]
  )

  /* ── Cascading Fetch Effects ── */
  const prevRegionRef = useRef("")
  const prevSubRegionRef = useRef("")
  useEffect(() => {
    if (selectedRegion && selectedSubRegion) {
      if (
        selectedRegion !== prevRegionRef.current ||
        selectedSubRegion !== prevSubRegionRef.current
      ) {
        billToCustomersHook.execute(selectedRegion, selectedSubRegion)
        shipToCustomersHook.execute(selectedRegion, selectedSubRegion)
        prevRegionRef.current = selectedRegion
        prevSubRegionRef.current = selectedSubRegion
      }
    }
  }, [
    selectedRegion,
    selectedSubRegion,
    billToCustomersHook,
    shipToCustomersHook,
  ])

  const prevBillToIdRef = useRef<number | null>(null)
  const prevShipToIdRef = useRef<number | null>(null)
  useEffect(() => {
    if (
      billToCustomer?.customerId &&
      billToCustomer.customerId !== prevBillToIdRef.current
    ) {
      billToAddressesHook.execute(
        billToCustomer.customerId,
        "BILL_TO",
        operatingUnit?.organizationId
      )
      prevBillToIdRef.current = billToCustomer.customerId
    }
  }, [billToCustomer, operatingUnit, billToAddressesHook])

  useEffect(() => {
    if (
      shipToCustomer?.customerId &&
      shipToCustomer.customerId !== prevShipToIdRef.current
    ) {
      shipToAddressesHook.execute(
        shipToCustomer.customerId,
        "SHIP_TO",
        operatingUnit?.organizationId
      )
      prevShipToIdRef.current = shipToCustomer.customerId
    }
  }, [shipToCustomer, operatingUnit, shipToAddressesHook])

  /* ── Line Operations ── */
  const addLine = useCallback(() => {
    setLines((prev) => [
      ...prev,
      {
        id: generateId(),
        organizationId: null,
        organizationCode: "",
        inventoryItemId: null,
        itemCode: "",
        description: "",
        week: "",
        quantity: "",
        targetDate: "",
        metrics: null,
        isRunnerItem: false,
        itemError: null,
        loadingItem: false,
      },
    ])
  }, [])

  const removeLine = useCallback((lineId: string) => {
    setLines((prev) => prev.filter((l) => l.id !== lineId))
    setOrgSearchByLine((prev) => {
      const next = { ...prev }
      delete next[lineId]
      return next
    })
    setItemSearchByLine((prev) => {
      const next = { ...prev }
      delete next[lineId]
      return next
    })
  }, [])

  const updateLine = useCallback(
    (lineId: string, updates: Partial<LineItem>) => {
      setLines((prev) =>
        prev.map((l) => (l.id === lineId ? { ...l, ...updates } : l))
      )
    },
    []
  )

  const setLineOrganization = useCallback(
    (lineId: string, orgCode: string) => {
      const org = organizationsHook.data?.find(
        (o) => o.organizationCode === orgCode
      )
      updateLine(lineId, {
        organizationCode: orgCode,
        organizationId: org?.organizationId ?? null,
      })
    },
    [organizationsHook.data, updateLine]
  )

  const setLineItemCode = useCallback(
    (lineId: string, code: string) => {
      updateLine(lineId, {
        itemCode: code,
        itemError: null,
        inventoryItemId: null,
        description: "",
        metrics: null,
        isRunnerItem: false,
      })
    },
    [updateLine]
  )

  const searchItemsForLine = useCallback(
    (lineId: string, searchQuery: string) => {
      const normalized = searchQuery.toUpperCase()
      setLineItemCode(lineId, normalized)
      setItemSearchByLine((prev) => ({ ...prev, [lineId]: normalized }))

      if (normalized.length > 3) {
        itemsHook.execute(1, 10, normalized).catch(() => { })
      } else if (normalized.length === 0) {
        itemsHook.execute(1, 10).catch(() => { })
      }
    },
    [itemsHook, setLineItemCode]
  )

  const resolveItemForLine = useCallback(
    async (
      lineId: string,
      orgId: number,
      itemCode: string,
      selectedItem?: InventoryItem
    ) => {
      updateLine(lineId, { loadingItem: true, itemError: null })

      try {
        const matchedItem =
          selectedItem ??
          (await itemsHook.execute(1, 10, itemCode)).data.find(
            (i) => i.itemCode === itemCode
          )

        if (!matchedItem) {
          updateLine(lineId, {
            loadingItem: false,
            itemError: `Item "${itemCode}" not found`,
            inventoryItemId: null,
            description: "",
            isRunnerItem: false,
            metrics: null,
          })
          return
        }

        let isRunner = false
        try {
          const rrsResult = await rrsCategoryHook.execute(
            orgId,
            matchedItem.inventoryItemId
          )
          isRunner = rrsResult.rrsCategory === "RUNNER"
        } catch {
          isRunner = false
        }

        let metrics = null
        if (billToCustomer?.customerId) {
          try {
            const metricsResult = await demandMetricsHook.execute(
              billToCustomer.customerId,
              orgId,
              matchedItem.inventoryItemId
            )
            metrics = metricsResult
          } catch {
            metrics = null
          }
        }

        updateLine(lineId, {
          inventoryItemId: matchedItem.inventoryItemId,
          description: matchedItem.description,
          isRunnerItem: isRunner,
          metrics,
          loadingItem: false,
          itemError: isRunner
            ? "Selected item is a RUNNER and cannot be allocated"
            : null,
        })
      } catch (err) {
        updateLine(lineId, {
          loadingItem: false,
          itemError:
            err instanceof Error ? err.message : "Failed to resolve item",
        })
      }
    },
    [itemsHook, rrsCategoryHook, demandMetricsHook, billToCustomer, updateLine]
  )

  const blurLineItemCode = useCallback(
    (lineId: string) => {
      const line = lines.find((l) => l.id === lineId)
      if (!line || !line.itemCode || !line.organizationId) return
      resolveItemForLine(lineId, line.organizationId, line.itemCode)
    },
    [lines, resolveItemForLine]
  )

  /* ── Validation ── */
  const headerComplete = useMemo(() => {
    if (allocationBasis === "open") return true
    return !!(
      selectedRegion &&
      selectedSubRegion &&
      operatingUnit &&
      billToCustomer &&
      shipToCustomer &&
      billToLocation &&
      shipToLocation
    )
  }, [
    allocationBasis,
    selectedRegion,
    selectedSubRegion,
    operatingUnit,
    billToCustomer,
    shipToCustomer,
    billToLocation,
    shipToLocation,
  ])

  const validLines = useMemo(
    () =>
      lines.filter(
        (l) =>
          l.organizationId &&
          l.inventoryItemId &&
          l.week &&
          l.quantity !== "" &&
          Number(l.quantity) > 0 &&
          l.targetDate &&
          !l.isRunnerItem
      ),
    [lines]
  )

  const canSubmit = useMemo(
    () =>
      headerComplete && validLines.length > 0 && !createAllocationHook.loading,
    [headerComplete, validLines.length, createAllocationHook.loading]
  )

  /* ── Submit ── */
  const submitForApproval = useCallback(async () => {
    if (!canSubmit) return

    const payload: CreateAllocationRequest = {
      transactionDate: new Date().toISOString(),
      customerOrItemSpecific: allocationBasis === "customer" ? 1 : 0,
      customerId:
        allocationBasis === "customer"
          ? (billToCustomer?.customerId ?? null)
          : null,
      territoryId: null,
      billToCustomer:
        allocationBasis === "customer"
          ? (billToCustomer?.customerId ?? null)
          : null,
      shipToCustomer:
        allocationBasis === "customer"
          ? (shipToCustomer?.customerId ?? null)
          : null,
      createdBy: "current-user",
      remarks: remarks || null,
      lines: validLines.map(
        (l): CreateLineRequest => ({
          organizationId: l.organizationId,
          inventoryItemId: l.inventoryItemId!,
          b3Quantity: Number(l.quantity),
          targetDate: l.targetDate || null,
        })
      ),
    }

    try {
      const result = await createAllocationHook.execute(payload)
      setLines([
        {
          id: generateId(),
          organizationId: null,
          organizationCode: "",
          inventoryItemId: null,
          itemCode: "",
          description: "",
          week: "",
          quantity: "",
          targetDate: "",
          metrics: null,
          isRunnerItem: false,
          itemError: null,
          loadingItem: false,
        },
      ])
      setRemarks("")
      navigate(`/fulfillment`)
      return result
    } catch (err) {
      throw err
    }
  }, [
    canSubmit,
    allocationBasis,
    billToCustomer,
    shipToCustomer,
    remarks,
    validLines,
    createAllocationHook,
  ])

  /* ── Loading State ── */
  const loadingInitial =
    regionsHook.loading ||
    operatingUnitsHook.loading ||
    weeksHook.loading ||
    organizationsHook.loading

  if (loadingInitial) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader />
      </div>
    )
  }

  /* ── RENDER ── */
  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex items-center justify-between rounded-xl border border-border bg-card px-6 py-2 shadow-sm">
        <div>
          <h2 className="text-md font-bold text-foreground">
            New BIN Allocation
          </h2>
          <p className="text-xs text-muted-foreground">
            Customer header details and item lines — only B3 header/line fields
            are saved on submit.
          </p>
        </div>
        <Button
          onClick={submitForApproval}
          disabled={!canSubmit}
          size="sm"
          className="text-xs font-semibold disabled:opacity-40"
        >
          {createAllocationHook.loading ? (
            <>
              <Loader2 className="mr-2 size-3.5 animate-spin" />
              Submitting...
            </>
          ) : (
            "Submit for Approval"
          )}
        </Button>
      </div>

      {/* Submit Error */}
      {createAllocationHook.error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-xs text-destructive">
          <div className="flex items-center gap-2">
            <AlertTriangle size={14} />
            <span className="font-medium">Submit failed:</span>
            {createAllocationHook.error.message}
          </div>
        </div>
      )}

      {/* Customer Details */}
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div
          onClick={() => setCustomerDetailsOpen((prev) => !prev)}
          className="flex cursor-pointer items-center justify-between border-b border-border px-6 py-4 transition-colors hover:bg-muted/40"
        >
          <div>
            <h3 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              Customer Details
            </h3>
            {!customerDetailsOpen && (
              <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
                {selectedRegion && (
                  <span className="rounded-md border border-border bg-muted px-2 py-1 text-muted-foreground">
                    Region: {selectedRegion}
                  </span>
                )}
                {operatingUnit && (
                  <span className="rounded-md border border-border bg-muted px-2 py-1 text-muted-foreground">
                    OU: {operatingUnit.name}
                  </span>
                )}
                {billToCustomer && (
                  <span className="rounded-md border border-border bg-muted px-2 py-1 text-muted-foreground">
                    Bill To: {billToCustomer.customerName}
                  </span>
                )}
                {shipToCustomer && (
                  <span className="rounded-md border border-border bg-muted px-2 py-1 text-muted-foreground">
                    Ship To: {shipToCustomer.customerName}
                  </span>
                )}
                <span className="rounded-md border border-blue-500/20 bg-blue-500/10 px-2 py-1 font-medium text-blue-600 dark:text-blue-400">
                  {allocationBasis === "customer"
                    ? "Customer Specific"
                    : "Open Pool"}
                </span>
              </div>
            )}
          </div>
          <ChevronRight
            className={`h-5 w-5 text-muted-foreground transition-transform duration-200 ${customerDetailsOpen ? "rotate-90" : ""
              }`}
          />
        </div>

        {customerDetailsOpen && (
          <div className="p-6">
            {/* Allocation Type Toggle */}
            <div className="mb-4">
              <Label className={labelClass}>Allocation Type</Label>
              <div className="flex w-fit gap-2 rounded-lg border border-border bg-muted p-1">
                <button
                  type="button"
                  onClick={() => setAllocationBasis("customer")}
                  className={`cursor-pointer rounded-md px-4 py-1.5 text-xs font-medium transition-all ${allocationBasis === "customer"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                  Customer Specific
                </button>
                <button
                  type="button"
                  onClick={() => setAllocationBasis("open")}
                  className={`cursor-pointer rounded-md px-4 py-1.5 text-xs font-medium transition-all ${allocationBasis === "open"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                  Open Pool
                </button>
              </div>
            </div>

            {allocationBasis === "customer" && (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
                {/* Region */}
                <div className="md:col-span-2">
                  <Label className={labelClass}>Region *</Label>
                  <Combobox
                    value={selectedRegion}
                    onValueChange={(value) => {
                      setSelectedRegion(value ?? "")
                      setSelectedSubRegion("")
                      setBillToCustomer(null)
                      setShipToCustomer(null)
                      setBillToLocation(null)
                      setShipToLocation(null)
                    }}
                    disabled
                  >
                    <ComboboxInput
                      className={fieldClass}
                      placeholder="Select region..."
                      onChange={(e) => setRegionSearch(e.currentTarget.value)}
                      disabled
                    />
                    <ComboboxContent>
                      <ComboboxList>
                        {filteredRegionNames.length === 0 ? (
                          <ComboboxItem value="" disabled>
                            No regions found
                          </ComboboxItem>
                        ) : (
                          filteredRegionNames.map((region) => (
                            <ComboboxItem key={region} value={region}>
                              <span className="whitespace-nowrap">
                                {region}
                              </span>
                            </ComboboxItem>
                          ))
                        )}
                      </ComboboxList>
                    </ComboboxContent>
                  </Combobox>
                </div>

                {/* Sub Region */}
                <div className="md:col-span-2">
                  <Label className={labelClass}>Sub Region *</Label>
                  <Combobox
                    value={selectedSubRegion}
                    onValueChange={(value) => {
                      setSelectedSubRegion(value ?? "")
                      setBillToCustomer(null)
                      setShipToCustomer(null)
                      setBillToLocation(null)
                      setShipToLocation(null)
                    }}
                    disabled={
                      !selectedRegion || subRegionsForSelected.length === 0
                    }
                  >
                    <ComboboxInput
                      className={fieldClass}
                      placeholder={
                        !selectedRegion
                          ? "Select region first..."
                          : "Select sub-region..."
                      }
                      onChange={(e) =>
                        setSubRegionSearch(e.currentTarget.value)
                      }
                    />
                    <ComboboxContent>
                      <ComboboxList>
                        {filteredSubRegions.length === 0 ? (
                          <ComboboxItem value="" disabled>
                            No sub-regions found
                          </ComboboxItem>
                        ) : (
                          filteredSubRegions.map((sub) => (
                            <ComboboxItem key={sub} value={sub}>
                              <span className="whitespace-nowrap">{sub}</span>
                            </ComboboxItem>
                          ))
                        )}
                      </ComboboxList>
                    </ComboboxContent>
                  </Combobox>
                </div>

                {/* Operating Unit */}
                <div className="md:col-span-2">
                  <Label className={labelClass}>Operating Unit *</Label>
                  <Combobox
                    value={operatingUnit?.name ?? ""}
                    onValueChange={(value) => {
                      const unit = (operatingUnitsHook.data ?? []).find(
                        (u) => u.name === value
                      )
                      setOperatingUnit(unit ?? null)
                      setBillToCustomer(null)
                      setShipToCustomer(null)
                      setBillToLocation(null)
                      setShipToLocation(null)
                    }}
                    disabled={!selectedRegion}
                  >
                    <ComboboxInput
                      className={fieldClass}
                      placeholder="Select operating unit..."
                      onChange={(e) =>
                        setOperatingUnitSearch(e.currentTarget.value)
                      }
                    />
                    <ComboboxContent>
                      <ComboboxList>
                        {filteredOperatingUnits.length === 0 ? (
                          <ComboboxItem value="" disabled>
                            No operating units found
                          </ComboboxItem>
                        ) : (
                          filteredOperatingUnits.map((unit) => (
                            <ComboboxItem
                              key={unit.organizationId}
                              value={unit.name}
                            >
                              <span className="whitespace-nowrap">
                                {unit.name}
                              </span>
                            </ComboboxItem>
                          ))
                        )}
                      </ComboboxList>
                    </ComboboxContent>
                  </Combobox>
                </div>

                {/* Bill To Customer */}
                <div className="md:col-span-3">
                  <Label className={labelClass}>Bill To Customer *</Label>
                  <Combobox
                    value={billToCustomer?.customerName ?? ""}
                    onValueChange={(value) => {
                      const customer = (billToCustomersHook.data ?? []).find(
                        (c) => c.customerName === value
                      )
                      setBillToCustomer(customer ?? null)
                      setBillToLocation(null)
                    }}
                    disabled={!operatingUnit || billToCustomersHook.loading}
                  >
                    <ComboboxInput
                      className={fieldClass}
                      placeholder="Select bill-to customer..."
                      onChange={(e) =>
                        setBillToCustomerSearch(e.currentTarget.value)
                      }
                    />
                    <ComboboxContent>
                      <ComboboxList>
                        {billToCustomersHook.loading ? (
                          <ComboboxItem value="" disabled>
                            Loading...
                          </ComboboxItem>
                        ) : filteredBillToCustomers.length === 0 ? (
                          <ComboboxItem value="" disabled>
                            No customers found
                          </ComboboxItem>
                        ) : (
                          filteredBillToCustomers.map((customer) => (
                            <ComboboxItem
                              key={customer.customerId}
                              value={customer.customerName}
                            >
                              <span className="whitespace-nowrap">
                                {customer.customerName}
                              </span>
                            </ComboboxItem>
                          ))
                        )}
                      </ComboboxList>
                    </ComboboxContent>
                  </Combobox>
                </div>

                {/* Ship To Customer */}
                <div className="md:col-span-3">
                  <Label className={labelClass}>Ship To Customer *</Label>
                  <Combobox
                    value={shipToCustomer?.customerName ?? ""}
                    onValueChange={(value) => {
                      const customer = (shipToCustomersHook.data ?? []).find(
                        (c) => c.customerName === value
                      )
                      setShipToCustomer(customer ?? null)
                      setShipToLocation(null)
                    }}
                    disabled={!operatingUnit || shipToCustomersHook.loading}
                  >
                    <ComboboxInput
                      className={fieldClass}
                      placeholder="Select ship-to customer..."
                      onChange={(e) =>
                        setShipToCustomerSearch(e.currentTarget.value)
                      }
                    />
                    <ComboboxContent>
                      <ComboboxList>
                        {shipToCustomersHook.loading ? (
                          <ComboboxItem value="" disabled>
                            Loading...
                          </ComboboxItem>
                        ) : filteredShipToCustomers.length === 0 ? (
                          <ComboboxItem value="" disabled>
                            No customers found
                          </ComboboxItem>
                        ) : (
                          filteredShipToCustomers.map((customer) => (
                            <ComboboxItem
                              key={customer.customerId}
                              value={customer.customerName}
                            >
                              <span className="whitespace-nowrap">
                                {customer.customerName}
                              </span>
                            </ComboboxItem>
                          ))
                        )}
                      </ComboboxList>
                    </ComboboxContent>
                  </Combobox>
                </div>

                {/* Bill To Location */}
                <div className="md:col-span-3">
                  <Label className={labelClass}>Bill To Location *</Label>
                  <Combobox
                    value={
                      billToLocation
                        ? `${billToLocation.location}-${billToLocation.address1}`
                        : ""
                    }
                    onValueChange={(value) => {
                      const address = (billToAddressesHook.data ?? []).find(
                        (a) => `${a.location}-${a.address1}` === value
                      )
                      setBillToLocation(address ?? null)
                    }}
                    disabled={!billToCustomer || billToAddressesHook.loading}
                  >
                    <ComboboxInput
                      className={fieldClass}
                      placeholder="Select location..."
                      onChange={(e) =>
                        setBillToLocationSearch(e.currentTarget.value)
                      }
                    />
                    <ComboboxContent>
                      <ComboboxList>
                        {billToAddressesHook.loading ? (
                          <ComboboxItem value="" disabled>
                            Loading...
                          </ComboboxItem>
                        ) : filteredBillToAddresses.length === 0 ? (
                          <ComboboxItem value="" disabled>
                            No locations found
                          </ComboboxItem>
                        ) : (
                          filteredBillToAddresses.map((address) => (
                            <ComboboxItem
                              key={`${address.location}-${address.address1}`}
                              value={`${address.location}-${address.address1}`}
                            >
                              <div className="flex flex-col text-left">
                                <span>{address.location}</span>
                                <span className="text-[11px] text-muted-foreground">
                                  {address.address1}
                                </span>
                              </div>
                            </ComboboxItem>
                          ))
                        )}
                      </ComboboxList>
                    </ComboboxContent>
                  </Combobox>
                </div>

                {/* Ship To Location */}
                <div className="md:col-span-3">
                  <Label className={labelClass}>Ship To Location *</Label>
                  <Combobox
                    value={
                      shipToLocation
                        ? `${shipToLocation.location}-${shipToLocation.address1}`
                        : ""
                    }
                    onValueChange={(value) => {
                      const address = (shipToAddressesHook.data ?? []).find(
                        (a) => `${a.location}-${a.address1}` === value
                      )
                      setShipToLocation(address ?? null)
                    }}
                    disabled={!shipToCustomer || shipToAddressesHook.loading}
                  >
                    <ComboboxInput
                      className={fieldClass}
                      placeholder="Select location..."
                      onChange={(e) =>
                        setShipToLocationSearch(e.currentTarget.value)
                      }
                    />
                    <ComboboxContent>
                      <ComboboxList>
                        {shipToAddressesHook.loading ? (
                          <ComboboxItem value="" disabled>
                            Loading...
                          </ComboboxItem>
                        ) : filteredShipToAddresses.length === 0 ? (
                          <ComboboxItem value="" disabled>
                            No locations found
                          </ComboboxItem>
                        ) : (
                          filteredShipToAddresses.map((address) => (
                            <ComboboxItem
                              key={`${address.location}-${address.address1}`}
                              value={`${address.location}-${address.address1}`}
                            >
                              <div className="flex flex-col text-left">
                                <span>{address.location}</span>
                                <span className="text-[11px] text-muted-foreground">
                                  {address.address1}
                                </span>
                              </div>
                            </ComboboxItem>
                          ))
                        )}
                      </ComboboxList>
                    </ComboboxContent>
                  </Combobox>
                </div>

                {/* Address Displays */}
                <div className="md:col-span-3">
                  <Label className={labelClass}>Bill To Address</Label>
                  <div className="min-h-[72px] rounded-lg border border-border bg-background px-3 py-2 text-sm leading-relaxed break-words whitespace-pre-wrap text-muted-foreground">
                    {billToLocation
                      ? formatAddress(billToLocation)
                      : "Select a Bill To location"}
                  </div>
                </div>

                <div className="md:col-span-3">
                  <Label className={labelClass}>Ship To Address</Label>
                  <div className="min-h-[72px] rounded-lg border border-border bg-background px-3 py-2 text-sm leading-relaxed break-words whitespace-pre-wrap text-muted-foreground">
                    {shipToLocation
                      ? formatAddress(shipToLocation)
                      : "Select a Ship To location"}
                  </div>
                </div>

                {/* Remarks */}
                <div className="md:col-span-6">
                  <Label className={labelClass}>Remarks</Label>
                  <Textarea
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    className={`${fieldClass} min-h-20 resize-none`}
                    maxLength={250}
                  />
                </div>
              </div>
            )}

            {allocationBasis === "open" && (
              <div>
                <Label className={labelClass}>Remarks</Label>
                <Textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Enter remarks for Open Pool allocation"
                  className={`${fieldClass} min-h-24 resize-none`}
                  maxLength={250}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Item Lines */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              Item Lines
            </h3>
            <p className="mt-1 text-[11px] text-muted-foreground/80">
              Metrics and week are UI-only. Saved: organization, item, quantity,
              target date.
            </p>
          </div>
          <button
            type="button"
            onClick={addLine}
            className="flex cursor-pointer items-center gap-1 text-xs font-medium text-primary hover:text-primary/80"
          >
            <Plus size={14} /> Add Row
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-left text-xs">
            <thead>
              <tr className="border-b border-border text-[10px] tracking-wider text-muted-foreground uppercase">
                <th className="w-8 p-2">#</th>
                <th className="w-28 p-2">ORG *</th>
                <th className="p-2">Item Code *</th>
                <th className="min-w-36 p-2">Description</th>
                <th className="w-32 p-2">Week *</th>
                <th className="p-2">OA Pend</th>
                <th className="p-2">OA Rsv</th>
                <th className="p-2">OA Picked</th>
                <th className="p-2">BIN Qty</th>
                <th className="p-2">BIN Rsv</th>
                <th className="w-20 p-2">Qty *</th>
                <th className="p-2">Target Date *</th>
                <th className="w-10 p-2"></th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line, idx) => (
                <tr
                  key={line.id}
                  className={`border-b border-border/60 ${line.isRunnerItem ? "bg-destructive/10" : ""}`}
                >
                  <td className="p-2 text-center font-mono text-muted-foreground">
                    {idx + 1}
                  </td>

                  {/* Org */}
                  <td className="p-2">
                    <Combobox
                      value={line.organizationCode}
                      onValueChange={(value) => {
                        if (value === null) return
                        setLineOrganization(line.id, value)
                      }}
                    >
                      <ComboboxInput
                        className="h-8 w-full border-border bg-background text-xs"
                        placeholder="Org..."
                        onChange={(e) =>
                          setOrgSearchByLine((prev) => ({
                            ...prev,
                            [line.id]: e.currentTarget.value,
                          }))
                        }
                      />
                      <ComboboxContent>
                        <ComboboxList>
                          {(organizationsHook.data ?? [])
                            .filter((org) =>
                              org.organizationCode
                                .toLowerCase()
                                .includes(
                                  (orgSearchByLine[line.id] ?? "")
                                    .trim()
                                    .toLowerCase()
                                )
                            )
                            .map((org) => (
                              <ComboboxItem
                                key={org.organizationId}
                                value={org.organizationCode}
                              >
                                {org.organizationCode}
                              </ComboboxItem>
                            ))}
                          {(organizationsHook.data ?? []).filter((org) =>
                            org.organizationCode
                              .toLowerCase()
                              .includes(
                                (orgSearchByLine[line.id] ?? "")
                                  .trim()
                                  .toLowerCase()
                              )
                          ).length === 0 && (
                              <ComboboxItem value="" disabled>
                                No organizations found
                              </ComboboxItem>
                            )}
                        </ComboboxList>
                      </ComboboxContent>
                    </Combobox>
                  </td>

                  {/* Item Code */}
                  <td className="p-2">
                    <Combobox
                      value={line.itemCode}
                      onValueChange={(value) => {
                        if (!value) {
                          setLineItemCode(line.id, "")
                          return
                        }
                        setLineItemCode(line.id, value)
                        if (line.organizationId) {
                          const selectedItem = (
                            itemsHook.data?.data ?? []
                          ).find((i) => i.itemCode === value)
                          resolveItemForLine(
                            line.id,
                            line.organizationId,
                            value,
                            selectedItem
                          )
                        }
                      }}
                    >
                      <ComboboxInput
                        className="h-8 w-40 border-border bg-background font-mono text-xs uppercase"
                        placeholder="Item code"
                        onChange={(e) => {
                          const value = e.currentTarget.value.toUpperCase()
                          searchItemsForLine(line.id, value)
                        }}
                        onBlur={() => blurLineItemCode(line.id)}
                        disabled={
                          !line.organizationId ||
                          line.loadingItem ||
                          ((itemSearchByLine[line.id] ?? "").length > 3 &&
                            itemsHook.loading)
                        }
                      />
                      <ComboboxContent>
                        <ComboboxList>
                          {itemsHook.loading ? (
                            <ComboboxItem value="" disabled>
                              Loading...
                            </ComboboxItem>
                          ) : (itemsHook.data?.data ?? []).length === 0 ? (
                            <ComboboxEmpty>No items found</ComboboxEmpty>
                          ) : (
                            (itemsHook.data?.data ?? []).map((item) => (
                              <ComboboxItem
                                key={item.inventoryItemId}
                                value={item.itemCode}
                              >
                                <div className="flex flex-col text-left">
                                  <span className="font-medium">
                                    {item.itemCode.trim()}
                                  </span>
                                  <span className="text-[11px] text-muted-foreground">
                                    {item.description}
                                  </span>
                                </div>
                              </ComboboxItem>
                            ))
                          )}
                        </ComboboxList>
                      </ComboboxContent>
                    </Combobox>
                    {line.loadingItem && (
                      <Loader2 className="mt-1 size-3 animate-spin text-primary" />
                    )}
                  </td>

                  {/* Description */}
                  <td className="max-w-[16rem] p-2 break-words whitespace-normal text-muted-foreground">
                    {line.description || "—"}
                  </td>

                  {/* Week */}
                  <td className="p-2">
                    <Combobox
                      value={line.week}
                      onValueChange={(value) => {
                        if (value === null) return
                        updateLine(line.id, { week: value })
                      }}
                    >
                      <ComboboxInput
                        className="h-8 w-full border-border bg-background text-xs"
                        placeholder="Week"
                        onChange={(e) => setWeekSearch(e.currentTarget.value)}
                      />
                      <ComboboxContent>
                        <ComboboxList>
                          {filteredWeeks.length === 0 ? (
                            <ComboboxItem value="" disabled>
                              No weeks found
                            </ComboboxItem>
                          ) : (
                            filteredWeeks.map((week) => (
                              <ComboboxItem key={week} value={week}>
                                {week}
                              </ComboboxItem>
                            ))
                          )}
                        </ComboboxList>
                      </ComboboxContent>
                    </Combobox>
                  </td>

                  {/* Metrics */}
                  <td className="p-2">
                    <MetricsCell value={line.metrics?.oaPendingQuantity} />
                  </td>
                  <td className="p-2">
                    <MetricsCell value={line.metrics?.oaRsvQty} />
                  </td>
                  <td className="p-2">
                    <MetricsCell value={line.metrics?.oaPickedQty} />
                  </td>
                  <td className="p-2">
                    <MetricsCell value={line.metrics?.binQty} />
                  </td>
                  <td className="p-2">
                    <MetricsCell value={line.metrics?.binRsvQty} />
                  </td>

                  {/* Qty */}
                  <td className="p-2">
                    <Input
                      type="number"
                      min={1}
                      value={line.quantity}
                      onChange={(e) =>
                        updateLine(line.id, {
                          quantity:
                            e.target.value === "" ? "" : Number(e.target.value),
                        })
                      }
                      disabled={line.isRunnerItem}
                      className="h-8 border-border bg-background font-mono text-xs"
                      placeholder="Qty"
                    />
                  </td>

                  {/* Target Date */}
                  <td className="p-2">
                    <Input
                      type="date"
                      value={line.targetDate}
                      onChange={(e) =>
                        updateLine(line.id, { targetDate: e.target.value })
                      }
                      disabled={line.isRunnerItem}
                      className="h-8 border-border bg-background text-xs"
                    />
                  </td>

                  {/* Delete */}
                  <td className="p-2">
                    <button
                      type="button"
                      onClick={() => removeLine(line.id)}
                      className="cursor-pointer p-1.5 text-muted-foreground/60 transition-colors hover:text-destructive"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Line Errors */}
        {lines.some((l) => l.itemError) && (
          <div className="mt-3 space-y-1">
            {lines
              .filter((l) => l.itemError)
              .map((l) => (
                <p
                  key={l.id}
                  className="flex items-center gap-1.5 text-[11px] text-destructive"
                >
                  <AlertTriangle size={12} />
                  Row {lines.indexOf(l) + 1}: {l.itemError}
                </p>
              ))}
          </div>
        )}

        {/* Validation Messages */}
        {!headerComplete && allocationBasis === "customer" && (
          <p className="mt-3 text-[11px] font-medium text-amber-600 dark:text-amber-400">
            Complete all required customer header fields before submitting.
          </p>
        )}
        {headerComplete && validLines.length === 0 && (
          <p className="mt-3 text-[11px] font-medium text-amber-600 dark:text-amber-400">
            Add at least one valid item line (non-runner, with org, item, week,
            qty, and target date).
          </p>
        )}
      </div>
    </div>
  )
}
