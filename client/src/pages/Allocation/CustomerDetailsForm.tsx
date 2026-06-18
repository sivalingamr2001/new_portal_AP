import { useState } from "react"
import { ChevronRight } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Combobox,
  ComboboxContent,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"
import type { Customer, CustomerAddress, OperatingUnit } from "@/api/allocationApi"

/* ─────────────── HELPERS ─────────────── */
const fieldClass =
  "w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"

const labelClass = "text-xs font-medium text-muted-foreground block mb-1.5"

function formatAddress(addr: CustomerAddress | null): string {
  if (!addr) return ""
  const parts = [addr.address1, addr.address2, addr.address3, addr.city, addr.postalCode].filter(Boolean)
  return parts.join("\n")
}

interface CustomerDetailsFormProps {
  allocationBasis: "customer" | "open"
  setAllocationBasis: (basis: "customer" | "open") => void
  selectedRegion: string
  setSelectedRegion: (region: string) => void
  selectedSubRegion: string
  setSelectedSubRegion: (sub: string) => void
  operatingUnit: OperatingUnit | null
  setOperatingUnit: (unit: OperatingUnit | null) => void
  billToCustomer: Customer | null
  setBillToCustomer: (customer: Customer | null) => void
  shipToCustomer: Customer | null
  setShipToCustomer: (customer: Customer | null) => void
  billToLocation: CustomerAddress | null
  setBillToLocation: (addr: CustomerAddress | null) => void
  shipToLocation: CustomerAddress | null
  setShipToLocation: (addr: CustomerAddress | null) => void
  remarks: string
  setRemarks: (remarks: string) => void

  regionSearch: string
  setRegionSearch: (search: string) => void
  subRegionSearch: string
  setSubRegionSearch: (search: string) => void
  operatingUnitSearch: string
  setOperatingUnitSearch: (search: string) => void
  billToCustomerSearch: string
  setBillToCustomerSearch: (search: string) => void
  shipToCustomerSearch: string
  setShipToCustomerSearch: (search: string) => void
  billToLocationSearch: string
  setBillToLocationSearch: (search: string) => void
  shipToLocationSearch: string
  setShipToLocationSearch: (search: string) => void

  regionNames: string[]
  filteredRegionNames: string[]
  subRegionsForSelected: string[]
  filteredSubRegions: string[]
  filteredOperatingUnits: OperatingUnit[]
  filteredBillToCustomers: Customer[]
  filteredShipToCustomers: Customer[]
  filteredBillToAddresses: CustomerAddress[]
  filteredShipToAddresses: CustomerAddress[]

  billToCustomersLoading: boolean
  shipToCustomersLoading: boolean
  billToAddressesLoading: boolean
  shipToAddressesLoading: boolean
}

export function CustomerDetailsForm({
  allocationBasis,
  setAllocationBasis,
  selectedRegion,
  setSelectedRegion,
  selectedSubRegion,
  setSelectedSubRegion,
  operatingUnit,
  setOperatingUnit,
  billToCustomer,
  setBillToCustomer,
  shipToCustomer,
  setShipToCustomer,
  billToLocation,
  setBillToLocation,
  shipToLocation,
  setShipToLocation,
  remarks,
  setRemarks,

  regionSearch,
  setRegionSearch,
  subRegionSearch,
  setSubRegionSearch,
  operatingUnitSearch,
  setOperatingUnitSearch,
  billToCustomerSearch,
  setBillToCustomerSearch,
  shipToCustomerSearch,
  setShipToCustomerSearch,
  billToLocationSearch,
  setBillToLocationSearch,
  shipToLocationSearch,
  setShipToLocationSearch,

  regionNames,
  filteredRegionNames,
  subRegionsForSelected,
  filteredSubRegions,
  filteredOperatingUnits,
  filteredBillToCustomers,
  filteredShipToCustomers,
  filteredBillToAddresses,
  filteredShipToAddresses,

  billToCustomersLoading,
  shipToCustomersLoading,
  billToAddressesLoading,
  shipToAddressesLoading,
}: CustomerDetailsFormProps) {
  const [customerDetailsOpen, setCustomerDetailsOpen] = useState(true)

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div
        onClick={() => setCustomerDetailsOpen((prev) => !prev)}
        className="flex cursor-pointer items-center justify-between border-b border-border px-6 py-4 transition-colors hover:bg-muted/40"
      >
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Customer Details
          </h3>
          {!customerDetailsOpen && (
            <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
              {selectedRegion && (
                <span className="rounded-md bg-muted px-2 py-1 text-muted-foreground border border-border">
                  Region: {selectedRegion}
                </span>
              )}
              {operatingUnit && (
                <span className="rounded-md bg-muted px-2 py-1 text-muted-foreground border border-border">
                  OU: {operatingUnit.name}
                </span>
              )}
              {billToCustomer && (
                <span className="rounded-md bg-muted px-2 py-1 text-muted-foreground border border-border">
                  Bill To: {billToCustomer.customerName}
                </span>
              )}
              {shipToCustomer && (
                <span className="rounded-md bg-muted px-2 py-1 text-muted-foreground border border-border">
                  Ship To: {shipToCustomer.customerName}
                </span>
              )}
              <span className="rounded-md bg-blue-500/10 px-2 py-1 text-blue-600 dark:text-blue-400 border border-blue-500/20 font-medium">
                {allocationBasis === "customer" ? "Customer Specific" : "Open Pool"}
              </span>
            </div>
          )}
        </div>
        <ChevronRight
          className={`h-5 w-5 text-muted-foreground transition-transform duration-200 ${
            customerDetailsOpen ? "rotate-90" : ""
          }`}
        />
      </div>

      {customerDetailsOpen && (
        <div className="p-6">
          {/* Allocation Type Toggle */}
          <div className="mb-4">
            <Label className={labelClass}>Allocation Type</Label>
            <div className="flex w-fit gap-2 rounded-lg border border-border bg-muted p-1">
              <button
                type="button"
                onClick={() => setAllocationBasis("customer")}
                className={`rounded-md px-4 py-1.5 text-xs font-medium transition-all cursor-pointer ${
                  allocationBasis === "customer"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Customer Specific
              </button>
              <button
                type="button"
                onClick={() => setAllocationBasis("open")}
                className={`rounded-md px-4 py-1.5 text-xs font-medium transition-all cursor-pointer ${
                  allocationBasis === "open"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Open Pool
              </button>
            </div>
          </div>

          {allocationBasis === "customer" && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
              {/* Region */}
              <div className="md:col-span-2">
                <Label className={labelClass}>Region *</Label>
                <Combobox
                  value={selectedRegion}
                  onValueChange={(value) => {
                    setSelectedRegion(value ?? "")
                    setSelectedSubRegion("")
                    setBillToCustomer(null)
                    setShipToCustomer(null)
                    setBillToLocation(null)
                    setShipToLocation(null)
                  }}
                  disabled={regionNames.length === 0}
                >
                  <ComboboxInput
                    className={fieldClass}
                    placeholder="Select region..."
                    value={regionSearch}
                    onChange={(e) => setRegionSearch(e.currentTarget.value)}
                  />
                  <ComboboxContent>
                    <ComboboxList>
                      {filteredRegionNames.length === 0 ? (
                        <ComboboxItem value="" disabled>
                          No regions found
                        </ComboboxItem>
                      ) : (
                        filteredRegionNames.map((region) => (
                          <ComboboxItem key={region} value={region}>
                            <span className="whitespace-nowrap">{region}</span>
                          </ComboboxItem>
                        ))
                      )}
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>
              </div>

              {/* Sub Region */}
              <div className="md:col-span-2">
                <Label className={labelClass}>Sub Region *</Label>
                <Combobox
                  value={selectedSubRegion}
                  onValueChange={(value) => {
                    setSelectedSubRegion(value ?? "")
                    setBillToCustomer(null)
                    setShipToCustomer(null)
                    setBillToLocation(null)
                    setShipToLocation(null)
                  }}
                  disabled={!selectedRegion || subRegionsForSelected.length === 0}
                >
                  <ComboboxInput
                    className={fieldClass}
                    placeholder={!selectedRegion ? "Select region first..." : "Select sub-region..."}
                    value={subRegionSearch}
                    onChange={(e) => setSubRegionSearch(e.currentTarget.value)}
                  />
                  <ComboboxContent>
                    <ComboboxList>
                      {filteredSubRegions.length === 0 ? (
                        <ComboboxItem value="" disabled>
                          No sub-regions found
                        </ComboboxItem>
                      ) : (
                        filteredSubRegions.map((sub) => (
                          <ComboboxItem key={sub} value={sub}>
                            <span className="whitespace-nowrap">{sub}</span>
                          </ComboboxItem>
                        ))
                      )}
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>
              </div>

              {/* Operating Unit */}
              <div className="md:col-span-2">
                <Label className={labelClass}>Operating Unit *</Label>
                <Combobox
                  value={operatingUnit?.name ?? ""}
                  onValueChange={(value) => {
                    const unit = filteredOperatingUnits.find((u) => u.name === value)
                    setOperatingUnit(unit ?? null)
                    setBillToCustomer(null)
                    setShipToCustomer(null)
                    setBillToLocation(null)
                    setShipToLocation(null)
                  }}
                  disabled={!selectedRegion}
                >
                  <ComboboxInput
                    className={fieldClass}
                    placeholder="Select operating unit..."
                    value={operatingUnitSearch}
                    onChange={(e) => setOperatingUnitSearch(e.currentTarget.value)}
                  />
                  <ComboboxContent>
                    <ComboboxList>
                      {filteredOperatingUnits.length === 0 ? (
                        <ComboboxItem value="" disabled>
                          No operating units found
                        </ComboboxItem>
                      ) : (
                        filteredOperatingUnits.map((unit) => (
                          <ComboboxItem key={unit.organizationId} value={unit.name}>
                            <span className="whitespace-nowrap">{unit.name}</span>
                          </ComboboxItem>
                        ))
                      )}
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>
              </div>

              {/* Bill To Customer */}
              <div className="md:col-span-3">
                <Label className={labelClass}>Bill To Customer *</Label>
                <Combobox
                  value={billToCustomer?.customerName ?? ""}
                  onValueChange={(value) => {
                    const customer = filteredBillToCustomers.find((c) => c.customerName === value)
                    setBillToCustomer(customer ?? null)
                    setBillToLocation(null)
                  }}
                  disabled={!operatingUnit || billToCustomersLoading}
                >
                  <ComboboxInput
                    className={fieldClass}
                    placeholder="Select bill-to customer..."
                    value={billToCustomerSearch}
                    onChange={(e) => setBillToCustomerSearch(e.currentTarget.value)}
                  />
                  <ComboboxContent>
                    <ComboboxList>
                      {billToCustomersLoading ? (
                        <ComboboxItem value="" disabled>
                          Loading...
                        </ComboboxItem>
                      ) : filteredBillToCustomers.length === 0 ? (
                        <ComboboxItem value="" disabled>
                          No customers found
                        </ComboboxItem>
                      ) : (
                        filteredBillToCustomers.map((customer) => (
                          <ComboboxItem key={customer.customerId} value={customer.customerName}>
                            <span className="whitespace-nowrap">{customer.customerName}</span>
                          </ComboboxItem>
                        ))
                      )}
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>
              </div>

              {/* Ship To Customer */}
              <div className="md:col-span-3">
                <Label className={labelClass}>Ship To Customer *</Label>
                <Combobox
                  value={shipToCustomer?.customerName ?? ""}
                  onValueChange={(value) => {
                    const customer = filteredShipToCustomers.find((c) => c.customerName === value)
                    setShipToCustomer(customer ?? null)
                    setShipToLocation(null)
                  }}
                  disabled={!operatingUnit || shipToCustomersLoading}
                >
                  <ComboboxInput
                    className={fieldClass}
                    placeholder="Select ship-to customer..."
                    value={shipToCustomerSearch}
                    onChange={(e) => setShipToCustomerSearch(e.currentTarget.value)}
                  />
                  <ComboboxContent>
                    <ComboboxList>
                      {shipToCustomersLoading ? (
                        <ComboboxItem value="" disabled>
                          Loading...
                        </ComboboxItem>
                      ) : filteredShipToCustomers.length === 0 ? (
                        <ComboboxItem value="" disabled>
                          No customers found
                        </ComboboxItem>
                      ) : (
                        filteredShipToCustomers.map((customer) => (
                          <ComboboxItem key={customer.customerId} value={customer.customerName}>
                            <span className="whitespace-nowrap">{customer.customerName}</span>
                          </ComboboxItem>
                        ))
                      )}
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>
              </div>

              {/* Bill To Location */}
              <div className="md:col-span-3">
                <Label className={labelClass}>Bill To Location *</Label>
                <Combobox
                  value={billToLocation ? `${billToLocation.location}-${billToLocation.address1}` : ""}
                  onValueChange={(value) => {
                    const address = filteredBillToAddresses.find(
                      (a) => `${a.location}-${a.address1}` === value
                    )
                    setBillToLocation(address ?? null)
                  }}
                  disabled={!billToCustomer || billToAddressesLoading}
                >
                  <ComboboxInput
                    className={fieldClass}
                    placeholder="Select location..."
                    value={billToLocationSearch}
                    onChange={(e) => setBillToLocationSearch(e.currentTarget.value)}
                  />
                  <ComboboxContent>
                    <ComboboxList>
                      {billToAddressesLoading ? (
                        <ComboboxItem value="" disabled>
                          Loading...
                        </ComboboxItem>
                      ) : filteredBillToAddresses.length === 0 ? (
                        <ComboboxItem value="" disabled>
                          No locations found
                        </ComboboxItem>
                      ) : (
                        filteredBillToAddresses.map((address) => (
                          <ComboboxItem
                            key={`${address.location}-${address.address1}`}
                            value={`${address.location}-${address.address1}`}
                          >
                            <div className="flex flex-col text-left">
                              <span>{address.location}</span>
                              <span className="text-[11px] text-muted-foreground">{address.address1}</span>
                            </div>
                          </ComboboxItem>
                        ))
                      )}
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>
              </div>

              {/* Ship To Location */}
              <div className="md:col-span-3">
                <Label className={labelClass}>Ship To Location *</Label>
                <Combobox
                  value={shipToLocation ? `${shipToLocation.location}-${shipToLocation.address1}` : ""}
                  onValueChange={(value) => {
                    const address = filteredShipToAddresses.find(
                      (a) => `${a.location}-${a.address1}` === value
                    )
                    setShipToLocation(address ?? null)
                  }}
                  disabled={!shipToCustomer || shipToAddressesLoading}
                >
                  <ComboboxInput
                    className={fieldClass}
                    placeholder="Select location..."
                    value={shipToLocationSearch}
                    onChange={(e) => setShipToLocationSearch(e.currentTarget.value)}
                  />
                  <ComboboxContent>
                    <ComboboxList>
                      {shipToAddressesLoading ? (
                        <ComboboxItem value="" disabled>
                          Loading...
                        </ComboboxItem>
                      ) : filteredShipToAddresses.length === 0 ? (
                        <ComboboxItem value="" disabled>
                          No locations found
                        </ComboboxItem>
                      ) : (
                        filteredShipToAddresses.map((address) => (
                          <ComboboxItem
                            key={`${address.location}-${address.address1}`}
                            value={`${address.location}-${address.address1}`}
                          >
                            <div className="flex flex-col text-left">
                              <span>{address.location}</span>
                              <span className="text-[11px] text-muted-foreground">{address.address1}</span>
                            </div>
                          </ComboboxItem>
                        ))
                      )}
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>
              </div>

              {/* Address Displays */}
              <div className="md:col-span-3">
                <Label className={labelClass}>Bill To Address</Label>
                <div className="min-h-[72px] rounded-lg border border-border bg-background px-3 py-2 text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap break-words">
                  {billToLocation ? formatAddress(billToLocation) : "Select a Bill To location"}
                </div>
              </div>

              <div className="md:col-span-3">
                <Label className={labelClass}>Ship To Address</Label>
                <div className="min-h-[72px] rounded-lg border border-border bg-background px-3 py-2 text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap break-words">
                  {shipToLocation ? formatAddress(shipToLocation) : "Select a Ship To location"}
                </div>
              </div>

              {/* Remarks */}
              <div className="md:col-span-6">
                <Label className={labelClass}>Remarks</Label>
                <Textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Optional header remarks (saved to JAN_B3_HEADER.REMARKS)"
                  className={`${fieldClass} min-h-20 resize-none`}
                  maxLength={250}
                />
              </div>
            </div>
          )}

          {allocationBasis === "open" && (
            <div>
              <Label className={labelClass}>Remarks</Label>
              <Textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Enter remarks for Open Pool allocation"
                className={`${fieldClass} min-h-24 resize-none`}
                maxLength={250}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
