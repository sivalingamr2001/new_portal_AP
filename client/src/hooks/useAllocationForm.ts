import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

import {
  getAllRegionsApi,
  getBillToCustomersApi,
  getCustomerAddressesApi,
  getDemandMetricsApi,
  getItemByCode,
  getItemOperatingUnits,
  getItemRrsCategory,
  getOperatingUnitsApi,
  getShipToCustomersApi,
  getWeeksDropdownApi,
} from "@/api/allocationApi"
import type {
  AddressDto,
  CreateAllocationRequest,
  CustomerDto,
  DemandMetricsDto,
  OperatingUnitDto,
  OrganizationDto,
  RegionDetailsDto,
} from "@/api/types/allocationDto"
import { useAuth } from "@/context/AuthContext"
import {
  ALLOCATION_SUBMIT_TO_CONSOLE,
  ALLOCATION_USE_MOCK_DATA,
  MOCK_BILL_TO_ADDRESSES,
  MOCK_BILL_TO_CUSTOMERS,
  MOCK_DEMAND_METRICS,
  MOCK_ITEM,
  MOCK_OPERATING_UNITS,
  MOCK_ORGANIZATIONS,
  MOCK_REGIONS,
  MOCK_SHIP_TO_ADDRESSES,
  MOCK_SHIP_TO_CUSTOMERS,
  MOCK_WEEKS,
} from "@/lib/config/allocation-mock-data"

export type AllocationBasis = "customer" | "open"

export interface AllocationFormLine {
  id: string
  organizationId: number | null
  organizationCode: string
  inventoryItemId: number | null
  itemCode: string
  description: string
  week: string
  quantity: number | ""
  targetDate: string
  metrics: DemandMetricsDto | null
  rrsCategory: string | null
  isRunnerItem: boolean
  itemError: string | null
  loadingItem: boolean
}

const emptyLine = (): AllocationFormLine => ({
  id: crypto.randomUUID(),
  organizationId: null,
  organizationCode: "",
  inventoryItemId: null,
  itemCode: "",
  description: "",
  week: "",
  quantity: "",
  targetDate: "",
  metrics: null,
  rrsCategory: null,
  isRunnerItem: false,
  itemError: null,
  loadingItem: false,
})

/** Runner items (e.g. "Rn") cannot be added to allocation. */
export function isRunnerRrsCategory(category: string): boolean {
  const normalized = category.trim().toUpperCase()
  return normalized.startsWith("RN")
}

function groupRegions(data: RegionDetailsDto[]) {
  const regionNames = [...new Set(data.map((r) => r.region))].sort()
  const subRegionsByRegion = regionNames.reduce<Record<string, string[]>>(
    (acc, region) => {
      acc[region] = [
        ...new Set(
          data.filter((r) => r.region === region).map((r) => r.subRegion)
        ),
      ].sort()
      return acc
    },
    {}
  )
  return { regionNames, subRegionsByRegion }
}

function applyMockDropdownData(
  setRegionData: (v: RegionDetailsDto[]) => void,
  setOperatingUnits: (v: OperatingUnitDto[]) => void,
  setOrganizations: (v: OrganizationDto[]) => void,
  setWeekOptions: (v: string[]) => void,
  setSelectedRegion: (v: string) => void,
  setSelectedSubRegion: (v: string) => void,
  setOperatingUnit: (v: OperatingUnitDto | null) => void,
  setBillToCustomers: (v: CustomerDto[]) => void,
  setShipToCustomers: (v: CustomerDto[]) => void,
  setBillToCustomer: (v: CustomerDto | null) => void,
  setShipToCustomer: (v: CustomerDto | null) => void,
  setBillToAddresses: (v: AddressDto[]) => void,
  setShipToAddresses: (v: AddressDto[]) => void,
  setBillToLocation: (v: AddressDto | null) => void,
  setShipToLocation: (v: AddressDto | null) => void,
  setRemarks: (v: string) => void,
  setLines: (v: AllocationFormLine[]) => void
) {
  setRegionData(MOCK_REGIONS)
  setOperatingUnits(MOCK_OPERATING_UNITS)
  setOrganizations(MOCK_ORGANIZATIONS)
  setWeekOptions(MOCK_WEEKS)
  setSelectedRegion("Maharashtra")
  setSelectedSubRegion("West")
  setOperatingUnit(MOCK_OPERATING_UNITS[0])
  setBillToCustomers(MOCK_BILL_TO_CUSTOMERS)
  setShipToCustomers(MOCK_SHIP_TO_CUSTOMERS)
  setBillToCustomer(MOCK_BILL_TO_CUSTOMERS[0])
  setShipToCustomer(MOCK_SHIP_TO_CUSTOMERS[0])
  setBillToAddresses(MOCK_BILL_TO_ADDRESSES)
  setShipToAddresses(MOCK_SHIP_TO_ADDRESSES)
  setBillToLocation(MOCK_BILL_TO_ADDRESSES[0])
  setShipToLocation(MOCK_SHIP_TO_ADDRESSES[0])
  setRemarks("Mock allocation for UI testing")

  setLines([
    {
      id: crypto.randomUUID(),
      organizationId: MOCK_ORGANIZATIONS[0].organizationId,
      organizationCode: MOCK_ORGANIZATIONS[0].organizationCode,
      inventoryItemId: MOCK_ITEM.inventoryItemId,
      itemCode: MOCK_ITEM.itemCode,
      description: MOCK_ITEM.description,
      week: MOCK_WEEKS[0],
      quantity: 500,
      targetDate: "2026-07-01",
      metrics: MOCK_DEMAND_METRICS,
      rrsCategory: MOCK_ITEM.rrsCategory,
      isRunnerItem: false,
      itemError: null,
      loadingItem: false,
    },
  ])
}

function buildSubmitPayload(
  allocationBasis: AllocationBasis,
  billToCustomer: CustomerDto | null,
  shipToCustomer: CustomerDto | null,
  remarks: string,
  currentUser: { username: string } | null,
  validLines: AllocationFormLine[],
  ui: {
    region: string
    subRegion: string
    operatingUnit: OperatingUnitDto | null
    billToLocation: AddressDto | null
    shipToLocation: AddressDto | null
    formatAddress: (a: AddressDto) => string
  }
): CreateAllocationRequest & { uiOnly: Record<string, unknown> } {
  const savePayload: CreateAllocationRequest = {
    header: {
      requestDate: new Date().toISOString().split("T")[0],
      allocationBasis: allocationBasis === "customer" ? 1 : 0,
      customerId: billToCustomer?.customerId ?? null,
      territoryId: 0,
      billToCustomerId: billToCustomer?.customerId ?? null,
      shipToCustomerId: shipToCustomer?.customerId ?? null,
      remarks,
      createdBy: currentUser?.username ?? "SYSTEM",
    },
    lines: validLines.map((line) => ({
      organizationId: line.organizationId!,
      inventoryItemId: line.inventoryItemId!,
      requestedQty: Number(line.quantity),
      targetDate: line.targetDate,
    })),
  }

  return {
    ...savePayload,
    uiOnly: {
      region: ui.region,
      subRegion: ui.subRegion,
      operatingUnit: ui.operatingUnit?.name ?? null,
      billToCustomerName: billToCustomer?.customerName ?? null,
      shipToCustomerName: shipToCustomer?.customerName ?? null,
      billToAddress: ui.billToLocation ? ui.formatAddress(ui.billToLocation) : null,
      shipToAddress: ui.shipToLocation ? ui.formatAddress(ui.shipToLocation) : null,
      lineDetails: validLines.map((line) => ({
        itemCode: line.itemCode,
        description: line.description,
        week: line.week,
        rrsCategory: line.rrsCategory,
        metrics: line.metrics,
      })),
    },
  }
}

function formatAddress(address: AddressDto): string {
  return [address.location, address.address1, address.address2, address.city, address.postalCode]
    .filter(Boolean)
    .join(", ")
}

export function useAllocationForm() {
  const { currentUser } = useAuth()

  const [loadingInitial, setLoadingInitial] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [allocationBasis, setAllocationBasis] = useState<AllocationBasis>("customer")
  const [regionData, setRegionData] = useState<RegionDetailsDto[]>([])
  const [operatingUnits, setOperatingUnits] = useState<OperatingUnitDto[]>([])
  const [organizations, setOrganizations] = useState<OrganizationDto[]>([])
  const [weekOptions, setWeekOptions] = useState<string[]>([])

  const [selectedRegion, setSelectedRegion] = useState("")
  const [selectedSubRegion, setSelectedSubRegion] = useState("")
  const [operatingUnit, setOperatingUnit] = useState<OperatingUnitDto | null>(null)
  const [billToCustomers, setBillToCustomers] = useState<CustomerDto[]>([])
  const [shipToCustomers, setShipToCustomers] = useState<CustomerDto[]>([])
  const [billToCustomer, setBillToCustomer] = useState<CustomerDto | null>(null)
  const [shipToCustomer, setShipToCustomer] = useState<CustomerDto | null>(null)
  const [billToAddresses, setBillToAddresses] = useState<AddressDto[]>([])
  const [shipToAddresses, setShipToAddresses] = useState<AddressDto[]>([])
  const [billToLocation, setBillToLocation] = useState<AddressDto | null>(null)
  const [shipToLocation, setShipToLocation] = useState<AddressDto | null>(null)
  const [remarks, setRemarks] = useState("")

  const [lines, setLines] = useState<AllocationFormLine[]>([emptyLine()])

  const { regionNames, subRegionsByRegion } = useMemo(
    () => groupRegions(regionData),
    [regionData]
  )

  const subRegionsForSelected = useMemo(
    () => (selectedRegion ? subRegionsByRegion[selectedRegion] ?? [] : []),
    [selectedRegion, subRegionsByRegion]
  )

  const subRegionDisplay =
    subRegionsForSelected.length > 1
      ? subRegionsForSelected.join(", ")
      : subRegionsForSelected[0] ?? ""

  /** When multiple sub-regions exist, show comma list and use first for API filters. */
  const effectiveSubRegion =
    subRegionsForSelected.length === 0
      ? selectedSubRegion
      : subRegionsForSelected.length === 1
        ? subRegionsForSelected[0]
        : subRegionsForSelected[0]

  useEffect(() => {
    let cancelled = false

    async function loadInitial() {
      setLoadingInitial(true)
      try {
        if (ALLOCATION_USE_MOCK_DATA) {
          applyMockDropdownData(
            setRegionData,
            setOperatingUnits,
            setOrganizations,
            setWeekOptions,
            setSelectedRegion,
            setSelectedSubRegion,
            setOperatingUnit,
            setBillToCustomers,
            setShipToCustomers,
            setBillToCustomer,
            setShipToCustomer,
            setBillToAddresses,
            setShipToAddresses,
            setBillToLocation,
            setShipToLocation,
            setRemarks,
            setLines
          )
          return
        }

        const [regions, units, orgs, weeks] = await Promise.all([
          getAllRegionsApi(),
          getOperatingUnitsApi(),
          getItemOperatingUnits(),
          getWeeksDropdownApi(),
        ])
        if (cancelled) return

        setRegionData(regions)
        setOperatingUnits(units)
        setOrganizations(orgs)
        setWeekOptions(weeks)

        if (units.length === 1) {
          setOperatingUnit(units[0])
        }

        const grouped = groupRegions(regions)
        if (grouped.regionNames.length === 1) {
          const region = grouped.regionNames[0]
          setSelectedRegion(region)
          const subs = grouped.subRegionsByRegion[region] ?? []
          if (subs.length === 1) {
            setSelectedSubRegion(subs[0])
          }
        }
      } catch {
        if (ALLOCATION_USE_MOCK_DATA) {
          applyMockDropdownData(
            setRegionData,
            setOperatingUnits,
            setOrganizations,
            setWeekOptions,
            setSelectedRegion,
            setSelectedSubRegion,
            setOperatingUnit,
            setBillToCustomers,
            setShipToCustomers,
            setBillToCustomer,
            setShipToCustomer,
            setBillToAddresses,
            setShipToAddresses,
            setBillToLocation,
            setShipToLocation,
            setRemarks,
            setLines
          )
        }
      } finally {
        if (!cancelled) setLoadingInitial(false)
      }
    }

    loadInitial()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!selectedRegion) return
    const subs = subRegionsByRegion[selectedRegion] ?? []
    if (subs.length === 1) {
      setSelectedSubRegion(subs[0])
    } else if (subs.length > 1) {
      setSelectedSubRegion("")
    }
  }, [selectedRegion, subRegionsByRegion])

  useEffect(() => {
    if (allocationBasis !== "customer" || !selectedRegion || !effectiveSubRegion) {
      setBillToCustomers([])
      setShipToCustomers([])
      return
    }

    let cancelled = false
    async function loadCustomers() {
      try {
        const [billTo, shipTo] = await Promise.all([
          getBillToCustomersApi(selectedRegion, effectiveSubRegion),
          getShipToCustomersApi(selectedRegion, effectiveSubRegion),
        ])
        if (!cancelled) {
          setBillToCustomers(billTo)
          setShipToCustomers(shipTo)
        }
      } catch {
        if (!cancelled) {
          setBillToCustomers([])
          setShipToCustomers([])
        }
      }
    }
    loadCustomers()
    return () => {
      cancelled = true
    }
  }, [allocationBasis, selectedRegion, effectiveSubRegion])

  useEffect(() => {
    setBillToCustomer(null)
    setBillToLocation(null)
    setBillToAddresses([])
  }, [selectedRegion, effectiveSubRegion, operatingUnit])

  useEffect(() => {
    setShipToCustomer(null)
    setShipToLocation(null)
    setShipToAddresses([])
  }, [selectedRegion, effectiveSubRegion, operatingUnit])

  useEffect(() => {
    if (!billToCustomer || !operatingUnit) {
      setBillToAddresses([])
      setBillToLocation(null)
      return
    }

    let cancelled = false
    getCustomerAddressesApi(billToCustomer.customerId, "BILL_TO", operatingUnit.organizationId)
      .then((addresses) => {
        if (!cancelled) {
          setBillToAddresses(addresses)
          setBillToLocation(addresses.length === 1 ? addresses[0] : null)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setBillToAddresses([])
          setBillToLocation(null)
        }
      })

    return () => {
      cancelled = true
    }
  }, [billToCustomer, operatingUnit])

  useEffect(() => {
    if (!shipToCustomer || !operatingUnit) {
      setShipToAddresses([])
      setShipToLocation(null)
      return
    }

    let cancelled = false
    getCustomerAddressesApi(shipToCustomer.customerId, "SHIP_TO", operatingUnit.organizationId)
      .then((addresses) => {
        if (!cancelled) {
          setShipToAddresses(addresses)
          setShipToLocation(addresses.length === 1 ? addresses[0] : null)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setShipToAddresses([])
          setShipToLocation(null)
        }
      })

    return () => {
      cancelled = true
    }
  }, [shipToCustomer, operatingUnit])

  const lineItemKeys = useMemo(
    () =>
      lines
        .filter((l) => l.organizationId && l.inventoryItemId && !l.isRunnerItem)
        .map((l) => `${l.id}:${l.organizationId}:${l.inventoryItemId}`)
        .join("|"),
    [lines]
  )

  useEffect(() => {
    if (allocationBasis !== "customer" || !billToCustomer || !lineItemKeys) return

    let cancelled = false

    async function refreshMetrics() {
      const eligible = lines.filter(
        (l) => l.organizationId && l.inventoryItemId && !l.isRunnerItem
      )

      const updates = await Promise.all(
        eligible.map(async (line) => {
          try {
            const metrics = await getDemandMetricsApi(
              billToCustomer!.customerId,
              line.organizationId!,
              line.inventoryItemId!
            )
            return { id: line.id, metrics }
          } catch {
            return null
          }
        })
      )

      if (cancelled) return

      setLines((prev) =>
        prev.map((row) => {
          const hit = updates.find((u) => u?.id === row.id)
          return hit ? { ...row, metrics: hit.metrics } : row
        })
      )
    }

    refreshMetrics()
    return () => {
      cancelled = true
    }
  }, [allocationBasis, billToCustomer, lineItemKeys])

  const resolveItemForLine = useCallback(
    async (lineId: string, organizationId: number, itemCode: string) => {
      const trimmed = itemCode.trim()
      if (!trimmed) return

      setLines((prev) =>
        prev.map((line) =>
          line.id === lineId
            ? {
                ...line,
                loadingItem: true,
                itemError: null,
                isRunnerItem: false,
                rrsCategory: null,
                metrics: null,
              }
            : line
        )
      )

      try {
        const item = await getItemByCode(trimmed)
        const rrs = await getItemRrsCategory(organizationId, item.inventoryItemId)

        if (isRunnerRrsCategory(rrs.rrsCategory)) {
          setLines((prev) =>
            prev.map((line) =>
              line.id === lineId
                ? {
                    ...line,
                    inventoryItemId: item.inventoryItemId,
                    itemCode: item.itemCode,
                    description: item.description,
                    rrsCategory: rrs.rrsCategory,
                    isRunnerItem: true,
                    itemError: `Runner item (${rrs.rrsCategory}) — cannot add to allocation`,
                    metrics: null,
                    loadingItem: false,
                  }
                : line
            )
          )
          return
        }

        let metrics: DemandMetricsDto | null = null
        if (allocationBasis === "customer" && billToCustomer) {
          metrics = await getDemandMetricsApi(
            billToCustomer.customerId,
            organizationId,
            item.inventoryItemId
          )
        }

        setLines((prev) =>
          prev.map((line) =>
            line.id === lineId
              ? {
                  ...line,
                  inventoryItemId: item.inventoryItemId,
                  itemCode: item.itemCode,
                  description: item.description,
                  rrsCategory: rrs.rrsCategory,
                  isRunnerItem: false,
                  itemError: null,
                  metrics,
                  loadingItem: false,
                }
              : line
          )
        )
      } catch {
        setLines((prev) =>
          prev.map((line) =>
            line.id === lineId
              ? {
                  ...line,
                  inventoryItemId: null,
                  description: "",
                  loadingItem: false,
                  itemError: "Item not found or failed to load",
                }
              : line
          )
        )
      }
    },
    [allocationBasis, billToCustomer]
  )

  const updateLine = useCallback(
    (lineId: string, patch: Partial<AllocationFormLine>) => {
      setLines((prev) =>
        prev.map((line) => (line.id === lineId ? { ...line, ...patch } : line))
      )
    },
    []
  )

  const setLineOrganization = useCallback(
    (lineId: string, orgId: string) => {
      const org = organizations.find((o) => String(o.organizationId) === orgId)
      setLines((prev) =>
        prev.map((line) =>
          line.id === lineId
            ? {
                ...line,
                organizationId: org?.organizationId ?? null,
                organizationCode: org?.organizationCode ?? "",
                inventoryItemId: null,
                itemCode: "",
                description: "",
                metrics: null,
                rrsCategory: null,
                isRunnerItem: false,
                itemError: null,
              }
            : line
        )
      )
    },
    [organizations]
  )

  const setLineItemCode = useCallback(
    (lineId: string, itemCode: string) => {
      updateLine(lineId, { itemCode: itemCode.toUpperCase() })
    },
    [updateLine]
  )

  const blurLineItemCode = useCallback(
    (lineId: string) => {
      const line = lines.find((l) => l.id === lineId)
      if (!line?.organizationId || !line.itemCode.trim()) return
      resolveItemForLine(lineId, line.organizationId, line.itemCode)
    },
    [lines, resolveItemForLine]
  )

  const addLine = useCallback(() => {
    setLines((prev) => [...prev, emptyLine()])
  }, [])

  const removeLine = useCallback((lineId: string) => {
    setLines((prev) => (prev.length <= 1 ? prev : prev.filter((l) => l.id !== lineId)))
  }, [])

  const headerComplete = useMemo(() => {
    if (allocationBasis === "open") {
      return true
    }
    return (
      !!selectedRegion &&
      !!effectiveSubRegion &&
      !!operatingUnit &&
      !!billToCustomer &&
      !!billToLocation &&
      !!shipToCustomer &&
      !!shipToLocation
    )
  }, [
    allocationBasis,
    selectedRegion,
    subRegionsForSelected.length,
    effectiveSubRegion,
    operatingUnit,
    billToCustomer,
    billToLocation,
    shipToCustomer,
    shipToLocation,
  ])

  const validLines = useMemo(
    () =>
      lines.filter(
        (line) =>
          line.organizationId &&
          line.inventoryItemId &&
          !line.isRunnerItem &&
          !line.itemError &&
          !line.loadingItem &&
          line.quantity !== "" &&
          Number(line.quantity) > 0 &&
          !!line.targetDate &&
          !!line.week
      ),
    [lines]
  )

  const canSubmit = headerComplete && validLines.length > 0 && !submitting && !loadingInitial

  const resetForm = useCallback(() => {
    setBillToCustomer(null)
    setShipToCustomer(null)
    setBillToLocation(null)
    setShipToLocation(null)
    setOperatingUnit(null)
    setRemarks("")
    setLines([emptyLine()])
  }, [])

  const submitForApproval = useCallback(async () => {
    if (!canSubmit) return

    setSubmitting(true)
    try {
      const payload = buildSubmitPayload(
        allocationBasis,
        billToCustomer,
        shipToCustomer,
        remarks,
        currentUser,
        validLines,
        {
          region: selectedRegion,
          subRegion: subRegionDisplay,
          operatingUnit,
          billToLocation,
          shipToLocation,
          formatAddress,
        }
      )

      if (ALLOCATION_SUBMIT_TO_CONSOLE) {
        console.log("Allocation submit payload:", JSON.stringify(payload, null, 2))
        toast.success("Allocation payload logged to console (DevTools)")
        resetForm()
        if (ALLOCATION_USE_MOCK_DATA) {
          applyMockDropdownData(
            setRegionData,
            setOperatingUnits,
            setOrganizations,
            setWeekOptions,
            setSelectedRegion,
            setSelectedSubRegion,
            setOperatingUnit,
            setBillToCustomers,
            setShipToCustomers,
            setBillToCustomer,
            setShipToCustomer,
            setBillToAddresses,
            setShipToAddresses,
            setBillToLocation,
            setShipToLocation,
            setRemarks,
            setLines
          )
        }
        return
      }

      const { uiOnly: _uiOnly, ...savePayload } = payload
      void _uiOnly
      const { createAllocationApi } = await import("@/api/allocationApi")
      await createAllocationApi(savePayload)
      toast.success("Allocation submitted for approval")
      resetForm()
    } catch {
      /* axios interceptor handles toast */
    } finally {
      setSubmitting(false)
    }
  }, [
    canSubmit,
    allocationBasis,
    billToCustomer,
    shipToCustomer,
    remarks,
    currentUser,
    validLines,
    resetForm,
    selectedRegion,
    subRegionDisplay,
    operatingUnit,
    billToLocation,
    shipToLocation,
  ])

  return {
    loadingInitial,
    submitting,
    allocationBasis,
    setAllocationBasis,
    regionNames,
    subRegionsForSelected,
    subRegionDisplay,
    selectedRegion,
    setSelectedRegion,
    selectedSubRegion,
    setSelectedSubRegion,
    effectiveSubRegion,
    operatingUnits,
    operatingUnit,
    setOperatingUnit,
    billToCustomers,
    shipToCustomers,
    billToCustomer,
    setBillToCustomer,
    shipToCustomer,
    setShipToCustomer,
    billToAddresses,
    shipToAddresses,
    billToLocation,
    setBillToLocation,
    shipToLocation,
    setShipToLocation,
    formatAddress,
    remarks,
    setRemarks,
    organizations,
    weekOptions,
    lines,
    updateLine,
    setLineOrganization,
    setLineItemCode,
    blurLineItemCode,
    addLine,
    removeLine,
    headerComplete,
    validLines,
    canSubmit,
    submitForApproval,
  }
}
