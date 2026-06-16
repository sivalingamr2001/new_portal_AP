import { axiosClient } from "@/lib/axiosClient"
import type { ItemLine } from "@/layout/AppLayout"
import type {
  RegionDetailsDto,
  CustomerDto,
  EmployeeDto,
  AddressDto,
  OperatingUnitDto,
  DemandMetricsDto,
  InventoryItemDto,
  OrganizationDto,
  RrsCategoryResponseDto,
  ItemByCodeDto,
  CreateAllocationRequest,
  CreateAllocationResponse,
  ApprovalRequest,
  RejectRequest,
  CancellationRequest,
} from "./types/allocationDto"
import type { PagedResult } from "./types/pagedResult"

/**
 * Returns a unique array list of all system regions and sub-regions.
 * Maps to: GET /api/Allocation/regions
 */
export const getAllRegionsApi = async (): Promise<RegionDetailsDto[]> => {
  const response = await axiosClient.get<RegionDetailsDto[]>(
    "/Allocation/regions"
  )
  return response.data
}

/**
 * Gets unique customer billing assignments matching a specific region and sub-region.
 * Maps to: GET /api/Allocation/customers/bill-to
 */
export const getBillToCustomersApi = async (
  region: string,
  subRegion: string
): Promise<CustomerDto[]> => {
  const response = await axiosClient.get<CustomerDto[]>(
    "/Allocation/customers/bill-to",
    {
      params: { region, subRegion },
    }
  )
  return response.data
}

/**
 * Gets unique shipping configurations for customers matching a specific region and sub-region.
 * Maps to: GET /api/Allocation/customers/ship-to
 */
export const getShipToCustomersApi = async (
  region: string,
  subRegion: string
): Promise<CustomerDto[]> => {
  const response = await axiosClient.get<CustomerDto[]>(
    "/Allocation/customers/ship-to",
    {
      params: { region, subRegion },
    }
  )
  return response.data
}

/**
 * Pulls qualified executive employee profiles working out of a specific region.
 * Maps to: GET /api/Allocation/employees/prepared-by
 */
export const getPreparedByEmployeesApi = async (
  region: string
): Promise<EmployeeDto[]> => {
  const response = await axiosClient.get<EmployeeDto[]>(
    "/Allocation/employees/prepared-by",
    {
      params: { region },
    }
  )
  return response.data
}

/**
 * Queries multi-location structures matching a specific client, operational unit, and context.
 * Maps to: GET /api/Allocation/customers/{customerId}/addresses
 */
export const getCustomerAddressesApi = async (
  customerId: number,
  siteUseCode: "BILL_TO" | "SHIP_TO",
  orgId: number
): Promise<AddressDto[]> => {
  const response = await axiosClient.get<AddressDto[]>(
    `/Allocation/customers/${customerId}/addresses`,
    {
      params: { siteUseCode, orgId },
    }
  )
  return response.data
}

/**
 * Generates system standard upcoming sequence loops for UI selector dropdown items.
 * Maps to: GET /api/Allocation/weeks/dropdown
 */
export const getWeeksDropdownApi = async (): Promise<string[]> => {
  const response = await axiosClient.get<string[]>("/Allocation/weeks/dropdown")
  return response.data
}

/**
 * Retrieves targeted corporate operational unit profiles filtered by core organization identifiers.
 * Maps to: GET /api/Allocation/operating-units
 */
export const getOperatingUnitsApi = async (): Promise<OperatingUnitDto[]> => {
  const response = await axiosClient.get<OperatingUnitDto[]>(
    "/Allocation/operating-units"
  )
  return response.data
}

// =========================================================================
// TRANSACTION GRID DETAIL LAYER (ALLOCATIONS ENDPOINTS)
// =========================================================================

/**
 * Fetches the list of valid operational organization units for item rows.
 * Maps to: GET /api/allocations/organizations
 */
export const getItemOperatingUnits = async (): Promise<OrganizationDto[]> => {
  const response = await axiosClient.get<OrganizationDto[]>(
    "/allocations/organizations"
  )
  return response.data
}

/**
 * Retrieves the designated RRS Category string for a specific organization item match.
 * Maps to: GET /api/allocations/rrs-category
 */
export const getItemRrsCategory = async (
  organizationId: number | string,
  inventoryItemId: number | string
): Promise<RrsCategoryResponseDto> => {
  const response = await axiosClient.get<RrsCategoryResponseDto>(
    "/allocations/rrs-category",
    {
      params: { organizationId, inventoryItemId },
    }
  )
  return response.data
}

/**
 * Fetches a paginated, filterable collection of inventory items.
 * Maps to: GET /api/allocations/items
 */
export const getPaginatedItems = async (
  page: number,
  pageSize: number,
  search?: string
): Promise<PagedResult<InventoryItemDto>> => {
  const response = await axiosClient.get<PagedResult<InventoryItemDto>>(
    "/allocations/items",
    {
      params: {
        page,
        pageSize,
        search: search?.trim() || undefined,
      },
    }
  )
  return response.data
}

/**
 * Resolves item identifiers and details based on a single exact item code string.
 * Maps to: GET /api/allocations/items/{itemCode}
 */
export const getItemByCode = async (
  itemCode: string
): Promise<ItemByCodeDto> => {
  const response = await axiosClient.get<ItemByCodeDto>(
    `/allocations/items/${encodeURIComponent(itemCode.trim())}`
  )
  return response.data
}

/**
 * Creates a BIN allocation header and line records (JAN_B3_HEADER / JAN_B3_LINES).
 * Maps to: POST /api/allocations
 */
export const createAllocationApi = async (
  payload: CreateAllocationRequest
): Promise<CreateAllocationResponse> => {
  const response = await axiosClient.post<CreateAllocationResponse>(
    "/allocations",
    payload
  )
  return response.data
}

/**
 * Approves an allocation line (JAN_B3_LINES approval fields).
 * Maps to: POST /api/allocations/approve
 */
export const approveAllocationLineApi = async (
  payload: ApprovalRequest
): Promise<void> => {
  await axiosClient.post("/allocations/approve", payload)
}

/**
 * Rejects an allocation line.
 * Maps to: POST /api/allocations/reject
 */
export const rejectAllocationLineApi = async (
  payload: RejectRequest
): Promise<void> => {
  await axiosClient.post("/allocations/reject", payload)
}

/**
 * Cancels quantity on an allocation line (JAN_B3_CANCELLATION).
 * Maps to: POST /api/allocations/cancel
 */
export const cancelAllocationLineApi = async (
  payload: CancellationRequest
): Promise<void> => {
  await axiosClient.post("/allocations/cancel", payload)
}

/**
 * Retrieves reference totals, balances, and demand metrics from your Oracle views.
 * Maps exactly to: GET /api/allocations/demand-metrics?customerId=X&organizationId=Y&inventoryItemId=Z
 */
export const getDemandMetricsApi = async (
  customerId: number,
  organizationId: number,
  inventoryItemId: number
): Promise<DemandMetricsDto> => {
  const response = await axiosClient.get<DemandMetricsDto>(
    "/allocations/demand-metrics",
    {
      params: { customerId, organizationId, inventoryItemId },
    }
  )
  return response.data
}

/**
 * Retrieves a list of all created allocations.
 * Maps to: GET /api/allocations
 */
export const getAllAllocationsApi = async (): Promise<ItemLine[]> => {
  const response = await axiosClient.get<ItemLine[]>("/allocations")
  return response.data
}

export interface AmendRequest {
  lineId: number
  newQty: number
  reason: string
}

export const amendAllocationLineApi = async (
  payload: AmendRequest
): Promise<void> => {
  await axiosClient.post("/allocations/amend", payload)
}
