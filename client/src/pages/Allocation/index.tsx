import { useState, useMemo, useCallback, useRef, useEffect } from "react"
import { Loader } from "@/components/Loader"
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
  useItems
} from "@/hooks/useAllocationApi"
import type { CreateAllocationRequest, CreateLineRequest, Customer, CustomerAddress, OperatingUnit } from "@/api/allocationApi"
import { useAuth } from "@/context/AuthContext"

import { AllocationHeader } from "./AllocationHeader"
import { CustomerDetailsForm } from "./CustomerDetailsForm"
import { ItemLinesTable } from "./ItemLinesTable"

/* ─────────────── TYPES ─────────────── */

export interface LineItem {
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

function generateId() {
  return Math.random().toString(36).slice(2, 9)
}

/* ─────────────── COMPONENT ─────────────── */

export function AllocationScreen() {
  const { currentUser } = useAuth()

  /* ── UI State ── */
  const [regionSearch, setRegionSearch] = useState("")
  const [subRegionSearch, setSubRegionSearch] = useState("")
  const [operatingUnitSearch, setOperatingUnitSearch] = useState("")
  const [billToCustomerSearch, setBillToCustomerSearch] = useState("")
  const [shipToCustomerSearch, setShipToCustomerSearch] = useState("")
  const [billToLocationSearch, setBillToLocationSearch] = useState("")
  const [shipToLocationSearch, setShipToLocationSearch] = useState("")
  const [orgSearchByLine, setOrgSearchByLine] = useState<Record<string, string>>({})
  const [weekSearch, setWeekSearch] = useState("")
  const [itemSearchByLine, setItemSearchByLine] = useState<Record<string, string>>({})

  /* ── Form State ── */
  const [allocationBasis, setAllocationBasis] = useState<"customer" | "open">("customer")
  const [selectedRegion, setSelectedRegion] = useState("")
  const [selectedSubRegion, setSelectedSubRegion] = useState("")
  const [operatingUnit, setOperatingUnit] = useState<OperatingUnit | null>(null)
  const [billToCustomer, setBillToCustomer] = useState<Customer | null>(null)
  const [shipToCustomer, setShipToCustomer] = useState<Customer | null>(null)
  const [billToLocation, setBillToLocation] = useState<CustomerAddress | null>(null)
  const [shipToLocation, setShipToLocation] = useState<CustomerAddress | null>(null)
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

  const billToCustomersHook = useBillToCustomers(selectedRegion, selectedSubRegion)
  const shipToCustomersHook = useShipToCustomers(selectedRegion, selectedSubRegion)

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

  /* ── Derived Data ── */
  const regionNames = useMemo(
    () => [...new Set((regionsHook.data ?? []).map((r) => r.region))],
    [regionsHook.data]
  )

  const subRegionsForSelected = useMemo(
    () =>
      selectedRegion
        ? [...new Set(
          (regionsHook.data ?? [])
            .filter((r) => r.region === selectedRegion)
            .map((r) => r.subRegion)
        )]
        : [],
    [regionsHook.data, selectedRegion]
  )

  const filteredRegionNames = useMemo(
    () => regionNames.filter((r) => r.toLowerCase().includes(regionSearch.trim().toLowerCase())),
    [regionNames, regionSearch]
  )

  const filteredSubRegions = useMemo(
    () => subRegionsForSelected.filter((r) => r.toLowerCase().includes(subRegionSearch.trim().toLowerCase())),
    [subRegionsForSelected, subRegionSearch]
  )

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
        c.customerName.toLowerCase().includes(billToCustomerSearch.trim().toLowerCase())
      ),
    [billToCustomersHook.data, billToCustomerSearch]
  )

  const filteredShipToCustomers = useMemo(
    () =>
      (shipToCustomersHook.data ?? []).filter((c) =>
        c.customerName.toLowerCase().includes(shipToCustomerSearch.trim().toLowerCase())
      ),
    [shipToCustomersHook.data, shipToCustomerSearch]
  )

  const filteredBillToAddresses = useMemo(
    () =>
      (billToAddressesHook.data ?? []).filter((a) =>
        `${a.location} ${a.address1}`.toLowerCase().includes(billToLocationSearch.trim().toLowerCase())
      ),
    [billToAddressesHook.data, billToLocationSearch]
  )

  const filteredShipToAddresses = useMemo(
    () =>
      (shipToAddressesHook.data ?? []).filter((a) =>
        `${a.location} ${a.address1}`.toLowerCase().includes(shipToLocationSearch.trim().toLowerCase())
      ),
    [shipToAddressesHook.data, shipToLocationSearch]
  )

  const filteredWeeks = useMemo(
    () => (weeksHook.data ?? []).filter((w) => w.toLowerCase().includes(weekSearch.trim().toLowerCase())),
    [weeksHook.data, weekSearch]
  )

  /* ── Cascading Fetch Effects ── */
  const prevRegionRef = useRef("")
  const prevSubRegionRef = useRef("")
  useEffect(() => {
    if (selectedRegion && selectedSubRegion) {
      if (selectedRegion !== prevRegionRef.current || selectedSubRegion !== prevSubRegionRef.current) {
        void billToCustomersHook.execute(selectedRegion, selectedSubRegion)
        void shipToCustomersHook.execute(selectedRegion, selectedSubRegion)
        prevRegionRef.current = selectedRegion
        prevSubRegionRef.current = selectedSubRegion
      }
    }
  }, [selectedRegion, selectedSubRegion, billToCustomersHook, shipToCustomersHook])

  const prevBillToIdRef = useRef<number | null>(null)
  const prevShipToIdRef = useRef<number | null>(null)
  useEffect(() => {
    if (billToCustomer?.customerId && billToCustomer.customerId !== prevBillToIdRef.current) {
      void billToAddressesHook.execute(billToCustomer.customerId, "BILL_TO", operatingUnit?.organizationId)
      prevBillToIdRef.current = billToCustomer.customerId
    }
  }, [billToCustomer, operatingUnit, billToAddressesHook])

  useEffect(() => {
    if (shipToCustomer?.customerId && shipToCustomer.customerId !== prevShipToIdRef.current) {
      void shipToAddressesHook.execute(shipToCustomer.customerId, "SHIP_TO", operatingUnit?.organizationId)
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

  const updateLine = useCallback((lineId: string, updates: Partial<LineItem>) => {
    setLines((prev) => prev.map((l) => (l.id === lineId ? { ...l, ...updates } : l)))
  }, [])

  const setLineOrganization = useCallback(
    (lineId: string, orgCode: string) => {
      const org = (organizationsHook.data ?? []).find((o) => o.organizationCode === orgCode)
      updateLine(lineId, {
        organizationCode: orgCode,
        organizationId: org?.organizationId ?? null,
      })
    },
    [organizationsHook.data, updateLine]
  )

  const setLineItemCode = useCallback(
    (lineId: string, code: string) => {
      updateLine(lineId, { itemCode: code, itemError: null })
    },
    [updateLine]
  )

  const resolveItemForLine = useCallback(
    async (lineId: string, orgId: number, itemCode: string) => {
      updateLine(lineId, { loadingItem: true, itemError: null })

      try {
        const itemsResult = await itemsHook.execute(1, 10, itemCode)
        const matchedItem = itemsResult.data.find((i) => i.itemCode === itemCode)

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
          const rrsResult = await rrsCategoryHook.execute(orgId, matchedItem.inventoryItemId)
          isRunner = rrsResult.rrsCategory === "RUNNER"
        } catch {
          isRunner = false
        }

        let metrics = null
        if (billToCustomer?.customerId) {
          try {
            metrics = await demandMetricsHook.execute(
              billToCustomer.customerId,
              orgId,
              matchedItem.inventoryItemId
            )
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
          itemError: null,
        })
      } catch (err) {
        updateLine(lineId, {
          loadingItem: false,
          itemError: err instanceof Error ? err.message : "Failed to resolve item",
        })
      }
    },
    [itemsHook, rrsCategoryHook, demandMetricsHook, billToCustomer, updateLine]
  )

  const blurLineItemCode = useCallback(
    (lineId: string) => {
      const line = lines.find((l) => l.id === lineId)
      if (!line || !line.itemCode || !line.organizationId) return
      void resolveItemForLine(lineId, line.organizationId, line.itemCode)
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
  }, [allocationBasis, selectedRegion, selectedSubRegion, operatingUnit, billToCustomer, shipToCustomer, billToLocation, shipToLocation])

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
    () => headerComplete && validLines.length > 0 && !createAllocationHook.loading,
    [headerComplete, validLines.length, createAllocationHook.loading]
  )

  /* ── Submit ── */
  const submitForApproval = useCallback(async () => {
    if (!canSubmit) return

    const payload: CreateAllocationRequest = {
      transactionDate: new Date().toISOString(),
      customerOrItemSpecific: allocationBasis === "customer" ? 1 : 0,
      customerId: allocationBasis === "customer" ? billToCustomer?.customerId ?? null : null,
      territoryId: null,
      billToCustomer: allocationBasis === "customer" ? billToCustomer?.customerId ?? null : null,
      shipToCustomer: allocationBasis === "customer" ? shipToCustomer?.customerId ?? null : null,
      createdBy: currentUser?.username ?? "SYSTEM",
      remarks: remarks || null,
      lines: validLines.map((l): CreateLineRequest => ({
        organizationId: l.organizationId,
        inventoryItemId: l.inventoryItemId!,
        b3Quantity: Number(l.quantity),
        targetDate: l.targetDate || null,
      })),
    }

    try {
      await createAllocationHook.execute(payload)
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
    } catch (err) {
      throw err
    }
  }, [canSubmit, allocationBasis, billToCustomer, shipToCustomer, remarks, validLines, createAllocationHook, currentUser])

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

  return (
    <div className="space-y-6">
      <AllocationHeader
        canSubmit={canSubmit}
        loading={createAllocationHook.loading}
        error={createAllocationHook.error}
        submitForApproval={submitForApproval}
      />

      <CustomerDetailsForm
        allocationBasis={allocationBasis}
        setAllocationBasis={setAllocationBasis}
        selectedRegion={selectedRegion}
        setSelectedRegion={setSelectedRegion}
        selectedSubRegion={selectedSubRegion}
        setSelectedSubRegion={setSelectedSubRegion}
        operatingUnit={operatingUnit}
        setOperatingUnit={setOperatingUnit}
        billToCustomer={billToCustomer}
        setBillToCustomer={setBillToCustomer}
        shipToCustomer={shipToCustomer}
        setShipToCustomer={setShipToCustomer}
        billToLocation={billToLocation}
        setBillToLocation={setBillToLocation}
        shipToLocation={shipToLocation}
        setShipToLocation={setShipToLocation}
        remarks={remarks}
        setRemarks={setRemarks}
        regionSearch={regionSearch}
        setRegionSearch={setRegionSearch}
        subRegionSearch={subRegionSearch}
        setSubRegionSearch={setSubRegionSearch}
        operatingUnitSearch={operatingUnitSearch}
        setOperatingUnitSearch={setOperatingUnitSearch}
        billToCustomerSearch={billToCustomerSearch}
        setBillToCustomerSearch={setBillToCustomerSearch}
        shipToCustomerSearch={shipToCustomerSearch}
        setShipToCustomerSearch={setShipToCustomerSearch}
        billToLocationSearch={billToLocationSearch}
        setBillToLocationSearch={setBillToLocationSearch}
        shipToLocationSearch={shipToLocationSearch}
        setShipToLocationSearch={setShipToLocationSearch}
        regionNames={regionNames}
        filteredRegionNames={filteredRegionNames}
        subRegionsForSelected={subRegionsForSelected}
        filteredSubRegions={filteredSubRegions}
        filteredOperatingUnits={filteredOperatingUnits}
        filteredBillToCustomers={filteredBillToCustomers}
        filteredShipToCustomers={filteredShipToCustomers}
        filteredBillToAddresses={filteredBillToAddresses}
        filteredShipToAddresses={filteredShipToAddresses}
        billToCustomersLoading={billToCustomersHook.loading}
        shipToCustomersLoading={shipToCustomersHook.loading}
        billToAddressesLoading={billToAddressesHook.loading}
        shipToAddressesLoading={shipToAddressesHook.loading}
      />

      <ItemLinesTable
        lines={lines}
        addLine={addLine}
        removeLine={removeLine}
        setLineOrganization={setLineOrganization}
        setLineItemCode={setLineItemCode}
        resolveItemForLine={resolveItemForLine}
        blurLineItemCode={blurLineItemCode}
        updateLine={updateLine}
        organizations={organizationsHook.data ?? []}
        orgSearchByLine={orgSearchByLine}
        setOrgSearchByLine={setOrgSearchByLine}
        itemSearchByLine={itemSearchByLine}
        setItemSearchByLine={setItemSearchByLine}
        weekSearch={weekSearch}
        setWeekSearch={setWeekSearch}
        itemsHookLoading={itemsHook.loading}
        itemsHookData={itemsHook.data}
        itemsHookExecute={itemsHook.execute}
        filteredWeeks={filteredWeeks}
        headerComplete={headerComplete}
        allocationBasis={allocationBasis}
        validLinesLength={validLines.length}
      />
    </div>
  )
}
