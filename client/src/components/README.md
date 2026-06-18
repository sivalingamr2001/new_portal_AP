# Allocation Screen — Refactored

## Folder structure

```
allocation-refactor/
│
├── AllocationScreen.tsx          ← Drop-in entry point (replaces original)
├── types.ts                      ← Form-layer types (separate from API types)
│
├── hooks/
│   └── useAllocationForm.ts      ← All form state + API orchestration
│
└── components/
    ├── AllocationForm.tsx         ← Main form card (layout + submit button)
    ├── AllocationTypeToggle.tsx   ← "Customer Specific / Open Pool" toggle
    ├── CustomerSection.tsx        ← Region → Sub-region → Bill-to → Ship-to → Prepared-by
    ├── LinesTable.tsx             ← Column headers + rows + add-line button
    ├── LineRow.tsx                ← Single item line with inline item search
    ├── AllocationSidebar.tsx      ← Portfolio KPIs + recent allocation headers
    └── StatusBanner.tsx           ← Success / error / loading feedback strip
```

## Integration

**1. Drop in AllocationScreen**

```tsx
// In your portal root component — replace the old inline AllocationScreen:
import { AllocationScreen } from "@/screens/allocation/AllocationScreen"

// Then in JSX:
{currentScreen === 'allocation' && <AllocationScreen />}
```

**2. Hook alias**

`useAllocationForm` imports directly from `@/hooks/useAllocationApi` — your existing hook file. No changes needed there.

**3. API alias**

All API calls go through `@/api/allocationApi` — your existing file. No changes needed.

---

## Data flow

```
AllocationScreen
  └── useAllocationForm (hook)
        ├── useRegions()                → regionOptions dropdown
        ├── useBillToCustomers()        → bill-to dropdown (triggered by region+subRegion)
        ├── useShipToCustomers()        → ship-to dropdown
        ├── usePreparedByEmployees()    → prepared-by dropdown
        ├── useOrganizations()          → org dropdown per line
        ├── useAllocationSummary()      → sidebar KPIs + recents
        └── useCreateAllocation()       → POST on submit
              └── payload built from form state → CreateAllocationRequest
```

## Line item search

Each line row has its own debounce-free search that calls `getItems(page, 8, query)` when the user types ≥ 2 characters. Results appear in a dropdown; selecting one sets `inventoryItemId`, `itemCode`, and `description` on that line.

## Validation (client-side)

Before submitting, `useAllocationForm` checks:
- Customer mode: region, sub-region, bill-to, prepared-by all filled
- At least one line with `inventoryItemId` set and `b3Quantity > 0`

Server-side errors surface via the `StatusBanner`.

## What was removed vs original

| Original (mock) | Refactored (real API) |
|---|---|
| `INITIAL_ITEMS` mock array | `useAllocationSummary()` live data |
| Free-text customer/region inputs | Real dropdowns from API |
| `String(Date.now())` IDs | Server-assigned `headerId` |
| Single `handleSubmit` god-function | Split across hook + API |
| `alert()` for feedback | `StatusBanner` component |
| `handleLineChange` mutating item name | `LineRow` with inline search + `selectItem` |
