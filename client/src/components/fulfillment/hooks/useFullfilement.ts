import { useCallback, useState, useEffect, useMemo } from "react";
import { 
  useAllocationSummary, 
  useCreateAllocation,
  // Assuming these are defined or wrapped from your api layer
  useOrganizations 
} from "@/hooks/useAllocationApi";

// ─── Interfaces ──────────────────────────────────────────────
export interface BackendAllocationLine {
  lineId: number;
  organizationId: number;
  inventoryItemId: number;
  b3Quantity: number;
  targetDate: string;
  b3ApprovedQuantity: number | null;
  approvalFlag: "Y" | "N";
  approvedDate: string | null;
  approvedBy: string | null;
  closureFlag: "Y" | "N";
  revision: number;
  headerId: number;
  transactionDate: string;
  customerOrItemSpecific: number;
  customerId: number;
  territoryId: number | null;
  billToCustomer: number;
  shipToCustomer: number;
  createdBy: string;
  createdDate: string;
  updatedBy: string;
  updatedDate: string;
  remarks: string;
}

export interface GroupedAllocationHeader {
  headerId: number;
  transactionDate: string;
  billToCustomer: number;
  shipToCustomer: number;
  remarks: string;
  status: "Fulfilled" | "Partial" | "Pending";
  totalRequested: number;
  totalApproved: number;
  lines: BackendAllocationLine[];
}

export function useFulFilment() {
  const [records, setRecords] = useState<BackendAllocationLine[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<BackendAllocationLine | null>(null);
  const [loadingSingle, setLoadingSingle] = useState(false);

  const { data: organizations } = useOrganizations();

  // ─── Fetch All Records (Fulfillment Source) ──────────────────
  const fetchAllRecords = useCallback(async () => {
    setLoadingRecords(true);
    try {
      const data: BackendAllocationLine[] = [
        { "lineId": 1, "organizationId": 904, "inventoryItemId": 31952850, "b3Quantity": 100, "targetDate": "2026-06-30T00:00:00", "b3ApprovedQuantity": 100, "approvalFlag": "Y", "approvedDate": "2026-06-18T11:18:51", "approvedBy": "JANHPL", "closureFlag": "N", "revision": 0, "headerId": 1, "transactionDate": "2026-06-18T05:05:05", "customerOrItemSpecific": 1, "customerId": 1722, "territoryId": null, "billToCustomer": 1722, "shipToCustomer": 2869590, "createdBy": "current-user", "createdDate": "2026-06-18T10:34:27", "updatedBy": "current-user", "updatedDate": "2026-06-18T10:34:27", "remarks": "rem" },
        { "lineId": 2, "organizationId": 904, "inventoryItemId": 5063050, "b3Quantity": 100, "targetDate": "2026-06-30T00:00:00", "b3ApprovedQuantity": 150, "approvalFlag": "Y", "approvedDate": "2026-06-18T11:57:44", "approvedBy": "system", "closureFlag": "N", "revision": 0, "headerId": 2, "transactionDate": "2026-06-18T05:06:49", "customerOrItemSpecific": 1, "customerId": 1722, "territoryId": null, "billToCustomer": 1722, "shipToCustomer": 3477592, "createdBy": "current-user", "createdDate": "2026-06-18T10:36:10", "updatedBy": "current-user", "updatedDate": "2026-06-18T10:36:10", "remarks": "Added" },
        { "lineId": 3, "organizationId": 111, "inventoryItemId": 30730540, "b3Quantity": 100, "targetDate": "2026-06-30T00:00:00", "b3ApprovedQuantity": null, "approvalFlag": "N", "approvedDate": null, "approvedBy": null, "closureFlag": "N", "revision": 0, "headerId": 3, "transactionDate": "2026-06-18T05:17:56", "customerOrItemSpecific": 1, "customerId": 3477592, "territoryId": null, "billToCustomer": 3477592, "shipToCustomer": 2869590, "createdBy": "current-user", "createdDate": "2026-06-18T10:47:17", "updatedBy": "current-user", "updatedDate": "2026-06-18T10:47:17", "remarks": "Add" },
        { "lineId": 4, "organizationId": 924, "inventoryItemId": 22033262, "b3Quantity": 1000, "targetDate": "2026-06-26T00:00:00", "b3ApprovedQuantity": null, "approvalFlag": "N", "approvedDate": null, "approvedBy": null, "closureFlag": "N", "revision": 0, "headerId": 4, "transactionDate": "2026-06-18T07:01:01", "customerOrItemSpecific": 1, "customerId": 4522608, "territoryId": null, "billToCustomer": 4522608, "shipToCustomer": 771580, "createdBy": "current-user", "createdDate": "2026-06-18T12:30:23", "updatedBy": "current-user", "updatedDate": "2026-06-18T12:30:23", "remarks": "Add remarks" },
        { "lineId": 5, "organizationId": 111, "inventoryItemId": 15789144, "b3Quantity": 1500, "targetDate": "2026-07-01T00:00:00", "b3ApprovedQuantity": null, "approvalFlag": "N", "approvedDate": null, "approvedBy": null, "closureFlag": "N", "revision": 0, "headerId": 4, "transactionDate": "2026-06-18T07:01:01", "customerOrItemSpecific": 1, "customerId": 4522608, "territoryId": null, "billToCustomer": 4522608, "shipToCustomer": 771580, "createdBy": "current-user", "createdDate": "2026-06-18T12:30:23", "updatedBy": "current-user", "updatedDate": "2026-06-18T12:30:23", "remarks": "Add remarks" },
        { "lineId": 6, "organizationId": 524, "inventoryItemId": 13486148, "b3Quantity": 2000, "targetDate": "2026-07-05T00:00:00", "b3ApprovedQuantity": null, "approvalFlag": "N", "approvedDate": null, "approvedBy": null, "closureFlag": "N", "revision": 0, "headerId": 4, "transactionDate": "2026-06-18T07:01:01", "customerOrItemSpecific": 1, "customerId": 4522608, "territoryId": null, "billToCustomer": 4522608, "shipToCustomer": 771580, "createdBy": "current-user", "createdDate": "2026-06-18T12:30:23", "updatedBy": "current-user", "updatedDate": "2026-06-18T12:30:23", "remarks": "Add remarks" },
        { "lineId": 7, "organizationId": 484, "inventoryItemId": 24135285, "b3Quantity": 1000, "targetDate": "2026-07-01T00:00:00", "b3ApprovedQuantity": null, "approvalFlag": "N", "approvedDate": null, "approvedBy": null, "closureFlag": "N", "revision": 0, "headerId": 5, "transactionDate": "2026-06-18T07:02:12", "customerOrItemSpecific": 1, "customerId": 4522608, "territoryId": null, "billToCustomer": 4522608, "shipToCustomer": 771580, "createdBy": "current-user", "createdDate": "2026-06-18T12:31:33", "updatedBy": "current-user", "updatedDate": "2026-06-18T12:31:33", "remarks": "Add remarks" }
      ];
      setRecords(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingRecords(false);
    }
  }, []);

  // ─── Load Single Record For Edit ────────────────────────────
  const loadRecordForEdit = useCallback(async (lineId: number) => {
    setLoadingSingle(true);
    try {
      // Real code replacement endpoint wrapper call:
      // const res = await fetch(`/api/allocations/line/${lineId}`);
      // const data = await res.json();
      
      const matched = records.find((r) => r.lineId === lineId);
      if (matched) {
        setSelectedRecord(matched);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingSingle(false);
    }
  }, [records]);

  useEffect(() => {
    fetchAllRecords();
  }, [fetchAllRecords]);

  // ─── Data Grouping Transformer (Header -> Lines Relationship) ───
  const groupedHeaders = useMemo(() => {
    const map: Record<number, GroupedAllocationHeader> = {};

    records.forEach((line) => {
      if (!map[line.headerId]) {
        map[line.headerId] = {
          headerId: line.headerId,
          transactionDate: line.transactionDate,
          billToCustomer: line.billToCustomer,
          shipToCustomer: line.shipToCustomer,
          remarks: line.remarks,
          status: "Pending",
          totalRequested: 0,
          totalApproved: 0,
          lines: [],
        };
      }

      const header = map[line.headerId];
      header.totalRequested += line.b3Quantity;
      header.totalApproved += line.b3ApprovedQuantity || 0;
      header.lines.push(line);
    });

    return Object.values(map).map((header) => {
      const allApproved = header.lines.every((l) => l.approvalFlag === "Y");
      const noneApproved = header.lines.every((l) => l.approvalFlag === "N");
      
      if (allApproved) header.status = "Fulfilled";
      else if (noneApproved) header.status = "Pending";
      else header.status = "Partial";

      return header;
    });
  }, [records]);

  return {
    groupedHeaders,
    loadingRecords,
    selectedRecord,
    loadingSingle,
    loadRecordForEdit,
    closeEditModal: () => setSelectedRecord(null),
    refreshRecords: fetchAllRecords,
    organizations: organizations || [],
  };
}
