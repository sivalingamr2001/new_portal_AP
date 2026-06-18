// ─────────────────────────────────────────────────────────────
// ALLOCATION FORM — Local Types
// These are the form-layer types used by the Allocation screen
// components. They are intentionally separate from API types.
// ─────────────────────────────────────────────────────────────

export interface FormLineItem {
  /** Unique key for React reconciliation */
  _key: string
  inventoryItemId: number | null
  itemCode: string
  description: string
  organizationId: number | null
  b3Quantity: number | string
  targetDate: string
  /** "searching" | "idle" — drives per-row item search dropdown */
  searchState: "idle" | "searching"
  searchQuery: string
}

export type AllocationType = "customer" | "open"

export interface AllocationFormState {
  allocationType: AllocationType
  /** Region string, e.g. "Maharashtra" */
  region: string
  /** Sub-region string */
  subRegion: string
  billToCustomerId: number | null
  shipToCustomerId: number | null
  preparedBy: string
  remarks: string
  lines: FormLineItem[]
}

export interface SubmitStatus {
  type: "idle" | "loading" | "success" | "error"
  message?: string
}
