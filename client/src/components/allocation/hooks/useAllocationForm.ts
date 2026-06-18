import { useCallback, useState } from "react"
import {
  useRegions,
  useBillToCustomers,
  useShipToCustomers,
  usePreparedByEmployees,
  useOrganizations,
  useAllocationSummary,
  useCreateAllocation,
} from "@/hooks/useAllocationApi"
import type { CreateAllocationRequest } from "@/api/allocationApi"
import type {
  AllocationFormState,
  AllocationType,
  FormLineItem,
  SubmitStatus,
} from "../types"
import { useAuth } from "@/context/AuthContext"

// ─── Helpers ────────────────────────────────────────────────

function makeKey() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function emptyLine(): FormLineItem {
  return {
    _key: makeKey(),
    inventoryItemId: null,
    itemCode: "",
    description: "",
    organizationId: null,
    b3Quantity: "",
    targetDate: "",
    searchState: "idle",
    searchQuery: "",
  }
}

const INITIAL_STATE: AllocationFormState = {
  allocationType: "customer",
  region: "",
  subRegion: "",
  billToCustomerId: null,
  shipToCustomerId: null,
  preparedBy: "",
  remarks: "",
  billToLocation: null,
  shipToLocation: null,
  lines: [emptyLine()],
}

// ─── Hook ────────────────────────────────────────────────────

export function useAllocationForm() {
  const [form, setForm] = useState<AllocationFormState>(INITIAL_STATE)
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>({ type: "idle" })
  const { currentUser } = useAuth()

  // ── Reference data ──────────────────────────────────────────
  const { data: regions, loading: regionsLoading } = useRegions()

  //Add operation unit get api here to load OperatingUnit[]

  const { data: billToCustomers, loading: billToLoading } =
    useBillToCustomers(form.region, form.subRegion)

  const { data: shipToCustomers, loading: shipToLoading } =
    useShipToCustomers(form.region, form.subRegion)

  const { data: employees, loading: employeesLoading } =
    usePreparedByEmployees(form.region)

  // getCustomerAddresses() call address api to load location first after selected location address both bill to and ship to

  //for Items
  const { data: organizations, loading: orgsLoading } = useOrganizations()

  //getItems() to load item this dropdown needs a api seach optin to load data
  //after select this call metrics api to autopoulte the metric qty
  //call rrs-categroy pass respective params and it retrun Rn shoe error
  //call weeks api to load weeks

  const { data: summary, loading: summaryLoading, execute: refreshSummary } =
    useAllocationSummary()

  const { execute: createAllocation, loading: submitting } = useCreateAllocation()

  // ── Unique region names for the first dropdown ──────────────
  const regionOptions = Array.from(
    new Map((regions ?? []).map((r) => [r.region, r])).values()
  )

  // Sub-regions for selected region
  const subRegionOptions = (regions ?? []).filter(
    (r) => r.region === form.region
  )

  // ── Header field setters ─────────────────────────────────────

  const setAllocationType = useCallback((type: AllocationType) => {
    setForm((prev) => ({
      ...prev,
      allocationType: type,
      // reset customer-specific fields when switching to open
      ...(type === "open"
        ? { region: "", subRegion: "", billToCustomerId: null, shipToCustomerId: null, preparedBy: "" }
        : {}),
    }))
  }, [])

  const setRegion = useCallback((region: string) => {
    setForm((prev) => ({
      ...prev,
      region,
      subRegion: "",
      billToCustomerId: null,
      shipToCustomerId: null,
      preparedBy: "",
      billToLocation: null,
      shipToLocation: null,
    }))
  }, [])

  const setSubRegion = useCallback((subRegion: string) => {
    setForm((prev) => ({
      ...prev,
      subRegion,
      billToCustomerId: null,
      shipToCustomerId: null,
    }))
  }, [])

  const setField = useCallback(
    <K extends keyof AllocationFormState>(key: K, value: AllocationFormState[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }))
    },
    []
  )

  // ── Line item mutators ───────────────────────────────────────

  const addLine = useCallback(() => {
    setForm((prev) => ({ ...prev, lines: [...prev.lines, emptyLine()] }))
  }, [])

  const removeLine = useCallback((key: string) => {
    setForm((prev) => ({
      ...prev,
      lines: prev.lines.length > 1 ? prev.lines.filter((l) => l._key !== key) : prev.lines,
    }))
  }, [])

  const updateLine = useCallback(
    (key: string, patch: Partial<FormLineItem>) => {
      setForm((prev) => ({
        ...prev,
        lines: prev.lines.map((l) => (l._key === key ? { ...l, ...patch } : l)),
      }))
    },
    []
  )

  /** Called when user picks an item from the search dropdown */
  const selectItem = useCallback(
    (
      key: string,
      item: { inventoryItemId: number; itemCode: string; description: string }
    ) => {
      updateLine(key, {
        inventoryItemId: item.inventoryItemId,
        itemCode: item.itemCode,
        description: item.description,
        searchState: "idle",
        searchQuery: "",
      })
    },
    [updateLine]
  )

  // ── Validation ───────────────────────────────────────────────

  function validate(): string | null {
    if (form.allocationType === "customer") {
      if (!form.region) return "Please select a region."
      if (!form.subRegion) return "Please select a sub-region."
      if (!form.billToCustomerId) return "Please select a Bill-To customer."
      if (!form.preparedBy) return "Please select a Prepared-By employee."
    }
    const validLines = form.lines.filter(
      (l) => l.inventoryItemId && Number(l.b3Quantity) > 0
    )
    if (validLines.length === 0)
      return "Add at least one item line with a valid quantity."
    return null
  }

  // ── Submit ───────────────────────────────────────────────────

  const handleSubmit = useCallback(async () => {
    const err = validate()
    if (err) {
      setSubmitStatus({ type: "error", message: err })
      return
    }
    setSubmitStatus({ type: "loading" })

    const validLines = form.lines.filter(
      (l) => l.inventoryItemId && Number(l.b3Quantity) > 0
    )

    const payload: CreateAllocationRequest = {
      transactionDate: new Date().toISOString(),
      createdBy: currentUser?.username ?? "unknown",
      remarks: form.remarks || null,
      ...(form.allocationType === "customer"
        ? {
            customerOrItemSpecific: 1,
            billToCustomer: form.billToCustomerId,
            shipToCustomer: form.shipToCustomerId,
          }
        : { customerOrItemSpecific: 0 }),
      lines: validLines.map((l) => ({
        inventoryItemId: l.inventoryItemId!,
        b3Quantity: Number(l.b3Quantity),
        organizationId: l.organizationId ?? undefined,
        targetDate: l.targetDate || undefined,
      })),
    }

    try {
      await createAllocation(payload)
      setSubmitStatus({ type: "success", message: "Allocation submitted for approval." })
      setForm({ ...INITIAL_STATE, lines: [emptyLine()] })
      refreshSummary()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Submission failed."
      setSubmitStatus({ type: "error", message: msg })
    }
  }, [form, createAllocation, refreshSummary])

  const dismissStatus = useCallback(() => {
    setSubmitStatus({ type: "idle" })
  }, [])

  // ── Reset ────────────────────────────────────────────────────
  const resetForm = useCallback(() => {
    setForm({ ...INITIAL_STATE, lines: [emptyLine()] })
    setSubmitStatus({ type: "idle" })
  }, [])

  return {
    // Form state
    form,

    // Derived dropdowns
    regionOptions,
    subRegionOptions,
    billToCustomers: billToCustomers ?? [],
    shipToCustomers: shipToCustomers ?? [],
    employees: employees ?? [],
    organizations: organizations ?? [],

    // Summary for sidebar
    summary: summary ?? [],

    // Loading flags
    loading: {
      regions: regionsLoading,
      billTo: billToLoading,
      shipTo: shipToLoading,
      employees: employeesLoading,
      orgs: orgsLoading,
      summary: summaryLoading,
      submitting,
    },

    // Status
    submitStatus,
    dismissStatus,

    // Actions
    setAllocationType,
    setRegion,
    setSubRegion,
    setField,
    addLine,
    removeLine,
    updateLine,
    selectItem,
    handleSubmit,
    resetForm,
  }
}
