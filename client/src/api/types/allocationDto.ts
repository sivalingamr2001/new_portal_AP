export interface RegionDetailsDto {
  region: string
  subRegion: string
}

export interface CustomerDto {
  customerId: number
  customerName: string
  region: string
}

export interface EmployeeDto {
  lastName: string
  employeeNumber: string
}

export interface AddressDto {
  address1: string
  address2: string
  address3: string
  city: string
  postalCode: string
  orgId: number
  location: string
}

export interface OperatingUnitDto {
  organizationId: number
  name: string
}

export interface OrganizationDto {
  organizationId: number
  organizationCode: string
}

export interface RrsCategoryResponseDto {
  rrsCategory: string
}

export interface InventoryItemDto {
  inventoryItemId: number
  itemCode: string
  description: string
}

/** Resolved item detail when searching by item code. */
export interface ItemByCodeDto {
  inventoryItemId: number
  itemCode: string
  description: string
  organizationId?: number
}

/** JAN_B3_HEADER fields persisted on save. */
export interface AllocationHeaderDto {
  /** TRANSACTION_DATE */
  requestDate: string
  /** CUSTOMER_OR_ITEM_SPECIFIC — 1 = customer specific, 0 = open pool */
  allocationBasis: number
  /** CUSTOMER_ID (bill-to context) */
  customerId: number | null
  /** TERRITORY_ID */
  territoryId: number
  /** BILL_TO_CUSTOMER */
  billToCustomerId: number | null
  /** SHIP_TO_CUSTOMER */
  shipToCustomerId: number | null
  /** REMARKS */
  remarks: string
  /** CREATED_BY */
  createdBy: string
}

/** JAN_B3_LINES fields persisted on save. */
export interface AllocationLineSaveDto {
  /** ORGANIZATION_ID */
  organizationId: number
  /** INVENTORY_ITEM_ID */
  inventoryItemId: number
  /** B3_QUANTITY */
  requestedQty: number
  /** TARGET_DATE */
  targetDate: string
}

export interface CreateAllocationRequest {
  header: AllocationHeaderDto
  lines: AllocationLineSaveDto[]
}

export interface CreateAllocationResponse {
  headerId: number
  lineIds: number[]
}

/** Legacy line shape used by item lookup endpoint. */
export interface AllocationLineDto {
  lineId: number
  itemCode: string
  warehouseId: string
  requestedQty: number
  targetDate: string
}

export interface ApprovalRequest {
  lineId: number
  approverBy: string | any
  /** B3_APPROVED_QUANTITY */
  approvedQty: number
  decision: string
  remarks: string
}

export interface RejectRequest {
  lineId: number
  reason: string
}

export interface CancellationRequest {
  lineId: number
  /** CANCELLED_QTY */
  cancelledQty: number
  reason: string
  cancelledBy: number
}

export interface DemandMetricsDto {
  oaPendingQuantity: number
  oaRsvQty: number
  oaPickedQty: number
  binQty: number
  binRsvQty: number
}

export interface AllocationHeaderGroupDto {
  headerId: number
  transactionDate: string
  allocationBasis: number
  customerId: number
  territoryId: number
  billToCustomer: number
  shipToCustomer: number
  remarks: string
  createdBy: string
  createdDate: string
}

export interface AllocationGroupItemDto {
  id: number
  isApproved: string
  approvedQty: number
  binQty: number
  parentHeaderId: number
  itemCode: number | string
  organizationId: number
  targetDate: string
}

export interface AllocationGroupResponseDto {
  header: AllocationHeaderGroupDto
  items: AllocationGroupItemDto[]
}
