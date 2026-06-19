export interface AllocationLineItem {
  lineId: number;
  organizationId: number;
  organizationCode: string;
  inventoryItemId: number;
  itemCode: string | null;
  itemDescription: string | null;
  b3Quantity: number;
  b3ApprovedQuantity: number | null;
  targetDate: string;
  approvalFlag: string;
  closureFlag: string;
  revision: number;
  parentLineId: number | null;
}

export interface AllocationHeaderDetails {
  headerId: number;
  customerId: number;
  customerName: string;
  billToCustomerId: number;
  billToCustomerName: string;
  shipToCustomerId: number;
  shipToCustomerName: string;
  remarks: string;
  transactionDate: string;
  totalRequested: number;
  totalApproved: number;
  status: 'Pending' | 'Partial' | 'Fulfilled' | string;
  items: AllocationLineItem[];
}
