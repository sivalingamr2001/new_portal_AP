import { useCallback, useState } from "react"
import type { PagedResult, Result } from "@/api/types"

export interface UsePaginatedDataGridOptions<T> {
  pageSize?: number
  initialPage?: number
  onError?: (error: Error) => void
}

export function usePaginatedDataGrid<T extends Record<string, unknown>>(
  apiFn: (page: number, pageSize: number) => Promise<Result<PagedResult<T>>>,
  options: UsePaginatedDataGridOptions<T> = {}
) {
  const { pageSize = 10, initialPage = 1, onError } = options

  const [rowData, setRowData] = useState<T[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [currentPage, setCurrentPage] = useState(initialPage)
  const [loading, setLoading] = useState(false)

  const loadData = useCallback(
    async (page: number = currentPage) => {
      setLoading(true)
      try {
        const result = await apiFn(page, pageSize)

        if (result.isSuccess && result.value) {
          const pagedResult = result.value
          setRowData(pagedResult.data)
          setTotalCount(pagedResult.totalCount)
          setTotalPages(pagedResult.totalPages)
          setCurrentPage(page)
        } else if (result.error) {
          const error = new Error(result.error.message || "Failed to load data")
          onError?.(error)
        }
      } catch (error) {
        const err = error instanceof Error ? error : new Error("Unknown error")
        onError?.(err)
      } finally {
        setLoading(false)
      }
    },
    [apiFn, pageSize, currentPage, onError]
  )

  const loadMore = useCallback(
    async (page: number) => {
      try {
        const result = await apiFn(page, pageSize)

        if (result.isSuccess && result.value) {
          const pagedResult = result.value
          setRowData((prev) => [...prev, ...pagedResult.data])
          setTotalCount(pagedResult.totalCount)
          setTotalPages(pagedResult.totalPages)
          setCurrentPage(page)
        }
      } catch (error) {
        const err = error instanceof Error ? error : new Error("Unknown error")
        onError?.(err)
      }
    },
    [apiFn, pageSize, onError]
  )

  const refresh = useCallback(() => {
    setCurrentPage(initialPage)
    loadData(initialPage)
  }, [loadData, initialPage])

  const reset = useCallback(() => {
    setRowData([])
    setTotalCount(0)
    setTotalPages(0)
    setCurrentPage(initialPage)
  }, [initialPage])

  return {
    rowData,
    totalCount,
    totalPages,
    currentPage,
    loading,
    loadData,
    loadMore,
    refresh,
    reset,
  }
}
