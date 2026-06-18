import type {
  Customer,
  CustomerAddress,
  DemandMetrics,
  OperatingUnit,
  Organization,
  Region,
} from "@/api/allocationApi"

/** Use mock dropdown/item data when APIs are unavailable or for local testing. */
export const ALLOCATION_USE_MOCK_DATA = false

/** Log submit payload to console instead of calling the API. */
export const ALLOCATION_SUBMIT_TO_CONSOLE = false

export const MOCK_REGIONS: Region[] = [
  { region: "Maharashtra", subRegion: "West" },
  { region: "Maharashtra", subRegion: "Central" },
]

export const MOCK_OPERATING_UNITS: OperatingUnit[] = [
  { organizationId: 103, name: "JANATICS India OU" },
  { organizationId: 704, name: "JANATICS Export OU" },
]

export const MOCK_ORGANIZATIONS: Organization[] = [
  { organizationId: 904, organizationCode: "MFG-CBE" },
  { organizationId: 924, organizationCode: "MFG-HYD" },
]

export const MOCK_WEEKS = ["202625", "202626"]

export const MOCK_BILL_TO_CUSTOMERS: Customer[] = [
  { customerId: 1001, customerName: "Tata Motors", region: "Maharashtra" },
  { customerId: 1002, customerName: "Maruti Suzuki", region: "Maharashtra" },
]

export const MOCK_SHIP_TO_CUSTOMERS: Customer[] = [
  { customerId: 2001, customerName: "Tata Motors - Pune Plant", region: "Maharashtra" },
  { customerId: 2002, customerName: "Maruti Suzuki - Gurgaon", region: "Maharashtra" },
]

export const MOCK_BILL_TO_ADDRESSES: CustomerAddress[] = [
  {
    location: "PUNE-HQ",
    address1: "Plot 12, MIDC Bhosari",
    address2: "Pune",
    address3: "",
    city: "Pune",
    postalCode: "411026",
    orgId: 103,
  },
]

export const MOCK_SHIP_TO_ADDRESSES: CustomerAddress[] = [
  {
    location: "PUNE-PLANT",
    address1: "Gate 3, Chakan Industrial Area",
    address2: "",
    address3: "",
    city: "Pune",
    postalCode: "410501",
    orgId: 103,
  },
]

export const MOCK_DEMAND_METRICS: DemandMetrics = {
  oaPendingQuantity: 120,
  oaRsvQty: 45,
  oaPickedQty: 30,
  binQty: 500,
  binRsvQty: 80,
}

export const MOCK_ITEM = {
  inventoryItemId: 5001,
  itemCode: "VALVE-001",
  description: "Pneumatic Valve",
  rrsCategory: "Std",
}
