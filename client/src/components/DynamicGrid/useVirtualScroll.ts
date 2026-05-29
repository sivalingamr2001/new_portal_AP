import { useCallback, useRef, useState } from "react"
import type { GridApi } from "ag-grid-community"

export interface VirtualScrollConfig {
  pageSize?: number
  bufferSize?: number
  onLoadMore?: (page: number) => Promise<void>
}

export interface VirtualScrollState {
  isLoading: boolean
  hasMore: boolean
  currentPage: number
  totalPages: number
}

export function useVirtualScroll(config: VirtualScrollConfig = {}) {
  const { pageSize = 10, bufferSize = 2, onLoadMore } = config

  const gridApiRef = useRef<GridApi | null>(null)
  const [state, setState] = useState<VirtualScrollState>({
    isLoading: false,
    hasMore: true,
    currentPage: 1,
    totalPages: 1,
  })

  const handleBodyScroll = useCallback(
    async (event: any) => {
      if (
        !gridApiRef.current ||
        state.isLoading ||
        !state.hasMore ||
        !onLoadMore
      ) {
        return
      }

      const api = gridApiRef.current
      const rowCount = api.getDisplayedRowCount()
      const lastRowIndex = api.getLastDisplayedRowIndex()

      // Calculate if we're near the bottom (buffer zone)
      const threshold = rowCount - pageSize + bufferSize * pageSize
      const isNearBottom = lastRowIndex >= threshold

      if (isNearBottom && state.currentPage < state.totalPages) {
        setState((prev) => ({ ...prev, isLoading: true }))
        try {
          const nextPage = state.currentPage + 1
          await onLoadMore(nextPage)
          setState((prev) => ({
            ...prev,
            currentPage: nextPage,
            isLoading: false,
          }))
        } catch (error) {
          console.error("Error loading more data:", error)
          setState((prev) => ({ ...prev, isLoading: false }))
        }
      }
    },
    [
      state.isLoading,
      state.hasMore,
      state.currentPage,
      state.totalPages,
      pageSize,
      bufferSize,
      onLoadMore,
    ]
  )

  const setGridApi = useCallback(
    (api: GridApi | null) => {
      gridApiRef.current = api
      if (api) {
        api.addEventListener("bodyScroll", handleBodyScroll)
      }
    },
    [handleBodyScroll]
  )

  const updateState = useCallback((totalPages: number, hasMore?: boolean) => {
    setState((prev) => ({
      ...prev,
      totalPages,
      hasMore: hasMore !== undefined ? hasMore : prev.currentPage < totalPages,
    }))
  }, [])

  const reset = useCallback(() => {
    setState({
      isLoading: false,
      hasMore: true,
      currentPage: 1,
      totalPages: 1,
    })
    if (gridApiRef.current) {
      gridApiRef.current.clearServerSideDatasource()
    }
  }, [])

  return {
    gridApiRef,
    state,
    setGridApi,
    updateState,
    reset,
  }
}
