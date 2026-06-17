import axiosClient from './axiosClient';

// ─────────────────────────────────────────────────────────────
// TYPES — Response Models
// ─────────────────────────────────────────────────────────────

export interface B3Header {
  headerId: number;
  transactionDate: string;           // ISO date string
  customerOrItemSpecific: number | null;
  customerId: number | null;
  territoryId: number | null;
  billToCustomer: number | null;
  shipToCustomer: number | null;
  createdBy: string;
  createdDate: string;
  updatedBy: string | null;
  updatedDate: string | null;
  remarks: string | null;
}

export interface B3Line {
  lineId: number;
  headerId: number;
  organizationId: number | null;
  inventoryItemId: number;
  b3Quantity: number;
  targetDate: string | null;
  b3ApprovedQuantity: number | null;
  approvalFlag: 'Y' | 'N';
  approvedDate: string | null;
  approvedBy: string | null;
  closureFlag: 'Y' | 'N';
  revision: number;
  parentLineId: number | null;
}

export interface B3Cancellation {
  cancelId: number;
  lineId: number;
  cancelledQty: number;
  cancelledDate: string;
  cancelReason: string | null;
  createdBy: string;
  createdDate: string;
  // joined fields from GetAllCancellations
  headerId?: number;
  inventoryItemId?: number;
  organizationId?: number | null;
  originalQuantity?: number;
  approvedQuantity?: number | null;
  customerId?: number | null;
  transactionDate?: string;
}

export interface AllocationRow extends B3Header {
  lineId: number;
  organizationId: number | null;
  inventoryItemId: number;
  b3Quantity: number;
  targetDate: string | null;
  b3ApprovedQuantity: number | null;
  approvalFlag: 'Y' | 'N';
  approvedDate: string | null;
  approvedBy: string | null;
  closureFlag: 'Y' | 'N';
  revision: number;
}

export interface AllocationSummary {
  headerId: number;
  transactionDate: string;
  customerId: number | null;
  totalLines: number;
  totalRequestedQty: number;
  totalApprovedQty: number;
  approvedLines: number;
  pendingLines: number;
  cancelledLines: number;
}

// ─────────────────────────────────────────────────────────────
// TYPES — Request Payloads
// ─────────────────────────────────────────────────────────────

export interface CreateLineRequest {
  organizationId?: number | null;
  inventoryItemId: number;
  b3Quantity: number;
  targetDate?: string | null;        // ISO date string
}

export interface CreateAllocationRequest {
  transactionDate: string;           // ISO date string
  customerOrItemSpecific?: number | null;
  customerId?: number | null;
  territoryId?: number | null;
  billToCustomer?: number | null;
  shipToCustomer?: number | null;
  createdBy: string;
  remarks?: string | null;
  lines: CreateLineRequest[];
}

export interface ReviseQuantityRequest {
  originalLineId: number;
  newB3Quantity: number;
}

export interface ApproveLineRequest {
  lineId: number;
  approvedQuantity: number;
  approvedBy: string;
}

export interface AmendQuantityRequest {
  lineId: number;
  amendedQuantity: number;
  amendedBy: string;
}

export interface CancelLineRequest {
  lineId: number;
  cancelledQty: number;
  cancelReason: string;
  createdBy: string;
}

export interface CancelHeaderRequest {
  headerId: number;
  cancelReason: string;
  createdBy: string;
}

// ─────────────────────────────────────────────────────────────
// TYPES — Generic API Responses
// ─────────────────────────────────────────────────────────────

export interface CreateAllocationResponse {
  headerId: number;
}

export interface ReviseQuantityResponse {
  newLineId: number;
  message: string;
}

export interface ActionResponse {
  message: string;
}

// ─────────────────────────────────────────────────────────────
// API BASE PATH
// ─────────────────────────────────────────────────────────────

const BASE = '/api/binallocation';

// ─────────────────────────────────────────────────────────────
// API FUNCTIONS
// ─────────────────────────────────────────────────────────────

/**
 * Create a bin allocation — one header with multiple line items.
 * POST /api/binallocation
 */
export const createAllocation = async (
  payload: CreateAllocationRequest
): Promise<CreateAllocationResponse> => {
  const { data } = await axiosClient.post<CreateAllocationResponse>(BASE, payload);
  return data;
};

/**
 * Get all bin allocations (header + lines joined).
 * GET /api/binallocation
 */
export const getAllAllocations = async (): Promise<AllocationRow[]> => {
  const { data } = await axiosClient.get<AllocationRow[]>(BASE);
  return data;
};

/**
 * Get a single allocation by header ID.
 * GET /api/binallocation/{headerId}
 */
export const getAllocationByHeaderId = async (
  headerId: number
): Promise<AllocationRow[]> => {
  const { data } = await axiosClient.get<AllocationRow[]>(`${BASE}/${headerId}`);
  return data;
};

/**
 * Get dashboard summary per header (totals, approved, pending, cancelled).
 * GET /api/binallocation/summary
 */
export const getAllocationSummary = async (): Promise<AllocationSummary[]> => {
  const { data } = await axiosClient.get<AllocationSummary[]>(`${BASE}/summary`);
  return data;
};

/**
 * Get all lines currently pending HOD approval.
 * GET /api/binallocation/pending-approval
 */
export const getPendingApprovalLines = async (): Promise<B3Line[]> => {
  const { data } = await axiosClient.get<B3Line[]>(`${BASE}/pending-approval`);
  return data;
};

/**
 * User role: revise requested quantity.
 * Creates a NEW revision row — does NOT modify the original line.
 * POST /api/binallocation/revise
 */
export const reviseQuantity = async (
  payload: ReviseQuantityRequest
): Promise<ReviseQuantityResponse> => {
  const { data } = await axiosClient.post<ReviseQuantityResponse>(
    `${BASE}/revise`,
    payload
  );
  return data;
};

/**
 * Get full revision history for a line (all revisions by original line ID).
 * GET /api/binallocation/revisions/{lineId}
 */
export const getLineRevisionHistory = async (
  lineId: number
): Promise<B3Line[]> => {
  const { data } = await axiosClient.get<B3Line[]>(`${BASE}/revisions/${lineId}`);
  return data;
};

/**
 * HOD approves a pending line with approved quantity.
 * PUT /api/binallocation/approve
 */
export const approveLine = async (
  payload: ApproveLineRequest
): Promise<ActionResponse> => {
  const { data } = await axiosClient.put<ActionResponse>(
    `${BASE}/approve`,
    payload
  );
  return data;
};

/**
 * HOD amends the approved quantity of an already-approved line.
 * PUT /api/binallocation/amend
 */
export const amendApprovedQuantity = async (
  payload: AmendQuantityRequest
): Promise<ActionResponse> => {
  const { data } = await axiosClient.put<ActionResponse>(
    `${BASE}/amend`,
    payload
  );
  return data;
};

/**
 * Cancel a single allocation line.
 * Inserts cancellation record + closes line in one transaction.
 * POST /api/binallocation/cancel/line
 */
export const cancelLine = async (
  payload: CancelLineRequest
): Promise<ActionResponse> => {
  const { data } = await axiosClient.post<ActionResponse>(
    `${BASE}/cancel/line`,
    payload
  );
  return data;
};

/**
 * Cancel all open lines under a header.
 * POST /api/binallocation/cancel/header
 */
export const cancelAllLines = async (
  payload: CancelHeaderRequest
): Promise<ActionResponse> => {
  const { data } = await axiosClient.post<ActionResponse>(
    `${BASE}/cancel/header`,
    payload
  );
  return data;
};

/**
 * Fetch all cancellation records with header and line context.
 * GET /api/binallocation/cancellations
 */
export const getAllCancellations = async (): Promise<B3Cancellation[]> => {
  const { data } = await axiosClient.get<B3Cancellation[]>(
    `${BASE}/cancellations`
  );
  return data;
};
