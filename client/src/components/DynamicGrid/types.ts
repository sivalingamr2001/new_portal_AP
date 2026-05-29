import type {
  ColDef,
  GridApi,
  GridReadyEvent,
  RowClickedEvent,
  SelectionChangedEvent,
  FilterChangedEvent,
  SortChangedEvent,
  PaginationChangedEvent,
} from "ag-grid-community"
import type { ReactNode } from "react"
import type { PagedResult } from "@/api/types"

export interface ActionButtonProps {
  label: string
  onClick: (api: GridApi | null) => void
  icon?: ReactNode
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link"
}

// Configuration schema for dynamic expansion sections
export interface DetailSectionConfig {
  title: string
  objectKey: string
  hiddenFields?: string[]
}

export interface VirtualScrollProps<T> {
  enabled?: boolean
  onLoadMore?: (page: number) => Promise<PagedResult<T>>
  pageSize?: number
  bufferSize?: number
}

export interface DataGridProps<
  TData extends Record<string, unknown> = Record<string, unknown>,
> {
  rowData: TData[]
  columnDefs: (Omit<ColDef<TData>, "field"> & { field?: string })[]
  title?: string
  gridId?: string
  loading?: boolean
  pageSize?: number
  pageSizeOptions?: number[]
  rowSelection?: "single" | "multiple" | "none"
  animateRows?: boolean
  showSearch?: boolean
  showRefreshButton?: boolean
  showClearFiltersButton?: boolean
  customActions?: ActionButtonProps[]
  noRowsMessage?: string
  loadingMessage?: string
  onRefresh?: () => void | Promise<void>
  onGridReady?: (api: GridApi<TData>) => void
  onRowClicked?: (event: RowClickedEvent<TData>) => void
  onSelectionChanged?: (selectedRows: TData[]) => void
  onFilterChanged?: (event: FilterChangedEvent<TData>) => void
  onSortChanged?: (event: SortChangedEvent<TData>) => void
  onPaginationChanged?: (event: PaginationChangedEvent<TData>) => void
  onClearFilters?: () => void | Promise<void>
  className?: string
  gridHeight?: string | number
  compact?: boolean
  theme?: "light" | "dark" | "system"
  defaultColDef?: ColDef<TData>

  // Dynamic Master-Detail Configuration Flags
  masterDetail?: boolean
  detailSections?: DetailSectionConfig[]

  // Virtual scrolling configuration
  virtualScroll?: VirtualScrollProps<TData>
}

export interface DataGridState {
  quickFilter: string
  selectedCount: number
  totalRows: number
  filteredRows: number
  currentPage: number
  totalPages: number
  activeFiltersCount: number
  isRefreshing: boolean
}

export interface UseDataGridReturn<TData extends Record<string, unknown>> {
  gridApiRef: React.RefObject<GridApi<TData> | null>
  state: DataGridState
  handlers: {
    onGridReady: (event: GridReadyEvent<TData>) => void
    onQuickFilterChange: (value: string) => void
    onClearFilters: () => void
    onRefresh: () => Promise<void>
    onSelectionChanged: (event: SelectionChangedEvent<TData>) => void
    onFilterChanged: (event: FilterChangedEvent<TData>) => void
    onSortChanged: (event: SortChangedEvent<TData>) => void
    onPaginationChanged: (event: PaginationChangedEvent<TData>) => void
  }
}

export interface GridToolbarProps {
  title: string
  description?: string
  state: DataGridState
  showSearch: boolean
  showRefresh: boolean
  showClearFilters: boolean
  onRefresh: () => void
  onClearFilters: () => void
  customActions?: ActionButtonProps[]
  gridApi: GridApi | null
}
