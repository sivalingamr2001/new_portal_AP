export interface RegionDetailsDto {
    region: string;
    subRegion: string;
}

export interface CustomerDto {
    customerId: number;
    customerName: string;
    region: string;
}

export interface EmployeeDto {
    lastName: string;
    employeeNumber: string;
}

export interface AddressDto {
    address1: string;
    address2: string;
    address3: string;
    city: string;
    postalCode: string;
    orgId: number;
    location: string;
}

export interface OperatingUnitDto {
    organizationId: number;
    name: string;
}

export interface OrganizationDto {
    organizationId: number;
    organizationCode: string;
}

export interface RrsCategoryResponseDto {
  rrsCategory: string
}

export interface InventoryItemDto {
    inventoryItemId: number;
    itemCode: string;
    description: string;
}

export interface AllocationHeaderDto {
    requestDate: string;
    allocationBasis: string;
    customerId: number | null;
    territoryId: number;
    remarks: string;
    createdBy: number;
}

export interface AllocationLineDto {
    lineId: number;
    itemCode: string;
    warehouseId: string;
    requestedQty: number;
    targetDate: string;
}

export interface CreateAllocationRequest {
    header: AllocationHeaderDto;
    lines: AllocationLineDto[];
}

export interface ApprovalRequest {
    lineId: number;
    approverId: number;
    approvedQty: number;
    decision: string;
    remarks: string;
}

export interface RejectRequest {
    lineId: number;
    reason: string;
}

export interface CancellationRequest {
    lineId: number;
    cancelledQty: number;
    reason: string;
    cancelledBy: number;
}

export interface DemandMetricsRequest {
    customerId: number;
    organizationId: number;
    inventoryItemId: number;
}

export interface DemandMetricsDto {
    oaPendingQuantity: number;
    oaRsvQty: number;
    oaPickedQty: number;
    binQty: number;
    binRsvQty: number;
}
