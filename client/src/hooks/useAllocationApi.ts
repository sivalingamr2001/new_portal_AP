import {
  amendApprovedQuantity,
  approveLine,
  cancelAllLines,
  cancelLine,
  createAllocation,
  getAllAllocations,
  getAllCancellations,
  getAllocationByHeaderId,
  getAllocationSummary,
  getBillToCustomers,
  getCustomerAddresses,
  getDemandMetrics,
  getItems,
  getLineRevisionHistory,
  getOperatingUnits,
  getOrganizations,
  getPendingApprovalLines,
  getPreparedByEmployees,
  getRegions,
  getRrsCategory,
  getShipToCustomers,
  getWeeksDropdown,
  loginApi,
  reviseQuantity,
  type AmendQuantityRequest,
  type ApproveLineRequest,
  type CancelHeaderRequest,
  type CancelLineRequest,
  type CreateAllocationRequest,
  type InventoryItem,
  type ReviseQuantityRequest,
} from "@/api/allocationApi"
import { useState, useCallback, useRef, useEffect } from "react"

// ─────────────────────────────────────────────────────────────
// SHARED STATE & CACHE
// ─────────────────────────────────────────────────────────────

const cache = new Map<string, { data: unknown; ts: number }>()
const CACHE_TTL_MS = 5 * 60 * 1000

function getCacheKey(fnName: string, params?: unknown): string {
  return `${fnName}::${params ? JSON.stringify(params) : ""}`
}

function getCached<T>(key: string): T | undefined {
  const entry = cache.get(key)
  if (!entry) return undefined
  if (Date.now() - entry.ts > CACHE_TTL_MS) {
    cache.delete(key)
    return undefined
  }
  return entry.data as T
}

function setCache<T>(key: string, data: T): void {
  cache.set(key, { data, ts: Date.now() })
}

export function clearAllocationCache(): void {
  cache.clear()
}

// ─────────────────────────────────────────────────────────────
// GENERIC HOOK FACTORY
// ─────────────────────────────────────────────────────────────

interface UseApiOptions<T> {
  immediate?: boolean
  initialData?: T
  cacheEnabled?: boolean
  cacheKey?: string
}

interface UseApiReturn<T, P extends unknown[]> {
  data: T | undefined
  loading: boolean
  error: Error | null
  execute: (...params: P) => Promise<T>
  reset: () => void
}

function useApi<T, P extends unknown[]>(
  apiFn: (...params: P) => Promise<T>,
  options: UseApiOptions<T> = {}
): UseApiReturn<T, P> {
  const {
    immediate = false,
    initialData,
    cacheEnabled = true,
    cacheKey,
  } = options

  const [data, setData] = useState<T | undefined>(initialData)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const apiFnRef = useRef(apiFn)
  apiFnRef.current = apiFn

  const execute = useCallback(
    async (...params: P): Promise<T> => {
      const key = cacheKey ?? getCacheKey(apiFn.name, params)
      if (cacheEnabled) {
        const cached = getCached<T>(key)
        if (cached !== undefined) {
          setData(cached)
          setError(null)
          return cached
        }
      }
      setLoading(true)
      setError(null)
      try {
        const result = await apiFnRef.current(...params)
        if (cacheEnabled) setCache(key, result)
        setData(result)
        return result
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err))
        setError(error)
        throw error
      } finally {
        setLoading(false)
      }
    },
    [cacheEnabled, cacheKey]
  )

  const reset = useCallback(() => {
    setData(initialData)
    setLoading(false)
    setError(null)
  }, [initialData])

  useEffect(() => {
    if (immediate) {
      execute(...([] as any))
    }
  }, [immediate, execute])

  return { data, loading, error, execute, reset }
}

// ─────────────────────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────────────────────

export function useLogin() {
  return useApi(loginApi, { cacheEnabled: false })
}

// ─────────────────────────────────────────────────────────────
// LOOKUP / REFERENCE DATA (cache-friendly, auto-fetch)
// ─────────────────────────────────────────────────────────────

export function useRegions() {
  return useApi(getRegions, { immediate: true })
}

export function useBillToCustomers(region: string, subRegion: string) {
  return useApi(getBillToCustomers, {
    immediate: !!region && !!subRegion,
  })
}

export function useShipToCustomers(region: string, subRegion: string) {
  return useApi(getShipToCustomers, {
    immediate: !!region && !!subRegion,
  })
}

export function usePreparedByEmployees(region: string) {
  return useApi(getPreparedByEmployees, { immediate: !!region })
}

export function useCustomerAddresses(
  customerId: number,
  siteUseCode?: string,
  orgId?: number
) {
  const fetcher = useCallback(
    (id: number, code?: string, org?: number) =>
      getCustomerAddresses(id, code, org),
    []
  )

  return useApi(fetcher, {
    immediate: !!customerId,
    cacheKey: getCacheKey("getCustomerAddresses", {
      customerId,
      siteUseCode,
      orgId,
    }),
  })
}

export function useWeeksDropdown() {
  return useApi(getWeeksDropdown, { immediate: true })
}

export function useOperatingUnits() {
  return useApi(getOperatingUnits, { immediate: true })
}

export function useDemandMetrics(
  customerId: number,
  organizationId: number,
  inventoryItemId: number
) {
  return useApi(getDemandMetrics, {
    immediate: !!(customerId && organizationId && inventoryItemId),
  })
}

export function useOrganizations() {
  return useApi(getOrganizations, { immediate: true })
}

export function useItems() {
  return useApi(getItems)
}

export function useRrsCategory(
  organizationId: number,
  inventoryItemId: number
) {
  return useApi(getRrsCategory, {
    immediate: !!(organizationId && inventoryItemId),
  })
}

// ─────────────────────────────────────────────────────────────
// ALLOCATION CRUD
// ─────────────────────────────────────────────────────────────

export function useCreateAllocation() {
  const hook = useApi(createAllocation, { cacheEnabled: false })
  const execute = useCallback(
    async (payload: CreateAllocationRequest) => {
      const result = await hook.execute(payload)
      cache.delete(getCacheKey("getAllAllocations"))
      cache.delete(getCacheKey("getAllocationSummary"))
      return result
    },
    [hook]
  )
  return { ...hook, execute }
}

export function useAllAllocations() {
  return useApi(getAllAllocations, { immediate: true })
}

export function useAllocationByHeaderId(headerId?: number) {
  return useApi(getAllocationByHeaderId, { immediate: !!headerId })
}

export function useAllocationSummary() {
  return useApi(getAllocationSummary, { immediate: true })
}

export function usePendingApprovalLines() {
  return useApi(getPendingApprovalLines, { immediate: true })
}

// ─────────────────────────────────────────────────────────────
// LINE ACTIONS (mutations — no cache, auto-invalidate)
// ─────────────────────────────────────────────────────────────

export function useReviseQuantity() {
  const hook = useApi(reviseQuantity, { cacheEnabled: false })
  const execute = useCallback(
    async (payload: ReviseQuantityRequest) => {
      const result = await hook.execute(payload)
      cache.delete(getCacheKey("getAllAllocations"))
      cache.delete(getCacheKey("getAllocationSummary"))
      cache.delete(getCacheKey("getPendingApprovalLines"))
      return result
    },
    [hook]
  )
  return { ...hook, execute }
}

export function useLineRevisionHistory() {
  return useApi(getLineRevisionHistory)
}

export function useApproveLine() {
  const hook = useApi(approveLine, { cacheEnabled: false })
  const execute = useCallback(
    async (payload: ApproveLineRequest) => {
      const result = await hook.execute(payload)
      cache.delete(getCacheKey("getAllAllocations"))
      cache.delete(getCacheKey("getAllocationSummary"))
      cache.delete(getCacheKey("getPendingApprovalLines"))
      return result
    },
    [hook]
  )
  return { ...hook, execute }
}

export function useAmendApprovedQuantity() {
  const hook = useApi(amendApprovedQuantity, { cacheEnabled: false })
  const execute = useCallback(
    async (payload: AmendQuantityRequest) => {
      const result = await hook.execute(payload)
      cache.delete(getCacheKey("getAllAllocations"))
      cache.delete(getCacheKey("getAllocationSummary"))
      return result
    },
    [hook]
  )
  return { ...hook, execute }
}

export function useCancelLine() {
  const hook = useApi(cancelLine, { cacheEnabled: false })
  const execute = useCallback(
    async (payload: CancelLineRequest) => {
      const result = await hook.execute(payload)
      cache.delete(getCacheKey("getAllAllocations"))
      cache.delete(getCacheKey("getAllocationSummary"))
      cache.delete(getCacheKey("getPendingApprovalLines"))
      cache.delete(getCacheKey("getAllCancellations"))
      return result
    },
    [hook]
  )
  return { ...hook, execute }
}

export function useCancelAllLines() {
  const hook = useApi(cancelAllLines, { cacheEnabled: false })
  const execute = useCallback(
    async (payload: CancelHeaderRequest) => {
      const result = await hook.execute(payload)
      cache.delete(getCacheKey("getAllAllocations"))
      cache.delete(getCacheKey("getAllocationSummary"))
      cache.delete(getCacheKey("getPendingApprovalLines"))
      cache.delete(getCacheKey("getAllCancellations"))
      return result
    },
    [hook]
  )
  return { ...hook, execute }
}

export function useAllCancellations() {
  return useApi(getAllCancellations, { immediate: true })
}

// ─────────────────────────────────────────────────────────────
// PAGINATION HOOK (items with search + page nav)
// ─────────────────────────────────────────────────────────────

interface UsePaginatedItemsOptions {
  pageSize?: number
  search?: string
}

export function usePaginatedItems(options: UsePaginatedItemsOptions = {}) {
  const { pageSize = 10, search = "" } = options
  const [page, setPage] = useState(1)
  const [items, setItems] = useState<InventoryItem[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [hasNextPage, setHasNextPage] = useState(false)
  const [hasPreviousPage, setHasPreviousPage] = useState(false)

  const baseHook = useApi(getItems)

  const fetchPage = useCallback(
    async (targetPage: number) => {
      const result = await baseHook.execute(targetPage, pageSize, search)
      setItems(result.data)
      setTotalCount(result.totalCount)
      setTotalPages(result.totalPages)
      setHasNextPage(result.hasNextPage)
      setHasPreviousPage(result.hasPreviousPage)
      setPage(targetPage)
      return result
    },
    [baseHook, pageSize, search]
  )

  const nextPage = useCallback(() => {
    if (hasNextPage) return fetchPage(page + 1)
  }, [hasNextPage, page, fetchPage])

  const previousPage = useCallback(() => {
    if (hasPreviousPage) return fetchPage(page - 1)
  }, [hasPreviousPage, page, fetchPage])

  const goToPage = useCallback(
    (targetPage: number) => {
      if (targetPage >= 1 && targetPage <= totalPages) {
        return fetchPage(targetPage)
      }
    },
    [totalPages, fetchPage]
  )

  useEffect(() => {
    setPage(1)
    fetchPage(1)
  }, [search, pageSize, fetchPage])

  return {
    data: items,
    page,
    pageSize,
    totalCount,
    totalPages,
    hasNextPage,
    hasPreviousPage,
    loading: baseHook.loading,
    error: baseHook.error,
    fetchPage,
    nextPage,
    previousPage,
    goToPage,
    reset: baseHook.reset,
  }
}

// ─────────────────────────────────────────────────────────────
// BULK OPERATIONS
// ─────────────────────────────────────────────────────────────

interface BulkActionResult {
  succeeded: number
  failed: number
  errors: { index: number; error: Error }[]
}

export function useBulkApproveLines() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [result, setResult] = useState<BulkActionResult | null>(null)

  const execute = useCallback(
    async (payloads: ApproveLineRequest[]): Promise<BulkActionResult> => {
      setLoading(true)
      setError(null)
      const results: BulkActionResult = { succeeded: 0, failed: 0, errors: [] }
      try {
        await Promise.all(
          payloads.map(async (payload, index) => {
            try {
              await approveLine(payload)
              results.succeeded++
            } catch (err) {
              results.failed++
              results.errors.push({
                index,
                error: err instanceof Error ? err : new Error(String(err)),
              })
            }
          })
        )
        cache.delete(getCacheKey("getAllAllocations"))
        cache.delete(getCacheKey("getAllocationSummary"))
        cache.delete(getCacheKey("getPendingApprovalLines"))
        setResult(results)
        return results
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err))
        setError(error)
        throw error
      } finally {
        setLoading(false)
      }
    },
    []
  )

  const reset = useCallback(() => {
    setLoading(false)
    setError(null)
    setResult(null)
  }, [])

  return { result, loading, error, execute, reset }
}
