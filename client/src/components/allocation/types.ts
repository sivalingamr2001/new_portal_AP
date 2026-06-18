import type { CustomerAddress } from "@/api/allocationApi"

export interface FormLineItem {
  _key: string
  inventoryItemId: number | null
  itemCode: string
  description: string
  organizationId: number | null
  b3Quantity: number | string
  targetDate: string
  searchState: "idle" | "searching"
  searchQuery: string
}

export type AllocationType = "customer" | "open"

export interface AllocationFormState {
  allocationType: AllocationType
  region: string
  /** Sub-region string */
  subRegion: string
  billToCustomerId: number | null
  shipToCustomerId: number | null
  preparedBy: string
  remarks: string
  billToLocation: CustomerAddress | null
  shipToLocation: CustomerAddress | null
  lines: FormLineItem[]
}

export interface SubmitStatus {
  type: "idle" | "loading" | "success" | "error"
  message?: string
}
