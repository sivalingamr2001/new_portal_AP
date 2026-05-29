import { themeQuartz, type ColDef, type GridOptions } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { useMemo, useCallback } from "react";
import { useDataGrid } from "./useDataGrid";
import { GridToolbar } from "./GridToolbar";
import { DynamicDetailCellRenderer } from "./DynamicDetailCellRenderer";
import { Separator } from "../ui/separator";
import type { DataGridProps } from "./types";
import { Loader } from "../Loader";

import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";
ModuleRegistry.registerModules([AllCommunityModule]);

const BASE_COL_DEF: ColDef = {
  sortable: true,
  filter: true,
  resizable: true,
  floatingFilter: false,
  minWidth: 100,
};

export function DataGrid<TData extends Record<string, unknown>>(props: DataGridProps<TData>) {
  const {
    rowData, columnDefs, title = "Data Table", loading = false, rowSelection = "multiple",
    animateRows = true, showSearch = true, showRefreshButton = true, showClearFiltersButton = true,
    noRowsMessage = "No records found", onRowClicked, onClearFilters: onClearFiltersCallback,
    gridHeight = "600px", compact = false, theme = "system", defaultColDef: defaultColDefProp,
    customActions, masterDetail = false, detailSections, pageSize = 10, pageSizeOptions = [10, 20, 50]
  } = props;

  const { gridApiRef, state, handlers } = useDataGrid(props);

  const gridTheme = useMemo(() => {
    const isDark = theme === "dark";
    return themeQuartz.withParams({
      browserColorScheme: isDark ? "dark" : "light",
      backgroundColor: isDark ? "#1f2836" : "#ffffff",
      foregroundColor: isDark ? "#FFF" : "#1f2a37",
      headerBackgroundColor: isDark ? "#374151" : "#f9fafb",
      fontFamily: "Inter, system-ui, sans-serif",
      headerFontFamily: "Inter, system-ui, sans-serif",
    });
  }, [theme]);

  const resolvedDefaultColDef = useMemo(() => ({
    ...BASE_COL_DEF,
    ...defaultColDefProp,
  }), [defaultColDefProp]);

  const CustomLoadingOverlay = useCallback(() => <Loader isText={true} />, []);

  const customFullWidthCellRenderer = useCallback((params: any) => {
    return <DynamicDetailCellRenderer data={params.data.__parentData} sections={detailSections} />;
  }, [detailSections]);

  const gridOptions = useMemo<GridOptions<any>>(() => ({
    pagination: true,
    paginationPageSize: pageSize,
    paginationPageSizeSelector: pageSizeOptions,
    animateRows,
    enableCellTextSelection: true,
    rowSelection: rowSelection === "multiple"
      ? { mode: "multiRow", checkboxes: true, headerCheckbox: true }
      : rowSelection === "single"
        ? { mode: "singleRow", checkboxes: false }
        : undefined,
    loadingOverlayComponent: CustomLoadingOverlay,
    noRowsOverlayComponent: () => <div className="no-rows-overlay-msg">{noRowsMessage}</div>,
    isFullWidthRow: (params) => params.rowNode.data?.__isDetailRow === true,
    fullWidthCellRenderer: customFullWidthCellRenderer,
    getRowHeight: (params) => {
      if (params.data?.__isDetailRow) {
        return detailSections && detailSections.length > 0 ? 160 : 40;
      }
      return compact ? 36 : 48;
    },
    embedFullWidthRows: true,
  }), [animateRows, rowSelection, compact, noRowsMessage, CustomLoadingOverlay, customFullWidthCellRenderer, pageSize, pageSizeOptions, detailSections]);

  // FIX: Intercept columns to prepend a robust, free-compatible dynamic Row Numbering column
  const cleanGridColumnDefs = useMemo<ColDef<any>[]>(() => {
    const rowNumCol: ColDef<any> = {
      headerName: "#",
      valueGetter: (params) => {
        // Return blank space for detail nodes to maintain layout aesthetics
        if (params.data?.__isDetailRow) return "";

        // Dynamically compute index relative to the viewport rows structure
        if (params.node && params.node.rowIndex !== null && params.node.rowIndex !== undefined) {
          // If pagination is enabled, calculate the global dynamic offset sequence
          const currentPage = params.api.paginationGetCurrentPage();
          const pageSizeValue = params.api.paginationGetPageSize();

          // Count only valid parent nodes preceding this index in the current viewport matrix
          let actualParentIndex = 0;
          const api = params.api;

          for (let i = 0; i <= params.node.rowIndex; i++) {
            const rowNode = api.getDisplayedRowAtIndex(i);
            if (rowNode && !rowNode.data?.__isDetailRow) {
              actualParentIndex++;
            }
          }

          return (currentPage * pageSizeValue) + actualParentIndex;
        }
        return "";
      },
      width: 60,
      minWidth: 50,
      maxWidth: 80,
      sortable: false,
      filter: false,
      resizable: false,
      pinned: "left", // Keep it anchored securely on scrolling viewports
      suppressMovable: true,
      cellClass: "font-mono text-center text-muted-foreground bg-muted/10 text-xs border-r"
    };

    return [rowNumCol, ...(columnDefs as ColDef<any>[])];
  }, [columnDefs]);

  return (
    <div className="datagrid-wrapper w-full flex flex-col h-full" aria-label={`${title} data grid`} role="region">
      <GridToolbar
        title={title}
        state={state}
        showSearch={showSearch}
        showRefresh={showRefreshButton}
        showClearFilters={showClearFiltersButton}
        onRefresh={handlers.onRefresh}
        gridApi={gridApiRef.current}
        customActions={customActions}
        onClearFilters={async () => {
          handlers.onClearFilters();
          if (onClearFiltersCallback) await onClearFiltersCallback();
        }}
      />
      <Separator className="my-2" />

      <div className="datagrid-scroll-shell relative flex-1 w-full min-h-75">
        {state.isRefreshing && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/60 dark:bg-slate-900/60 backdrop-blur-[1px] transition-all">
            <div className="bg-background/90 p-3 rounded-full shadow-lg border border-border/40 flex items-center justify-center animate-fade-in">
              <Loader isText={false} />
            </div>
          </div>
        )}

        <div className="datagrid-scroll-inner" style={{ height: "600px", marginTop: "8px", width: "100%" }}>
          <AgGridReact<any>
            rowData={rowData}
            columnDefs={cleanGridColumnDefs}
            theme={gridTheme}
            loading={loading}
            defaultColDef={resolvedDefaultColDef}
            onGridReady={handlers.onGridReady}
            onSelectionChanged={handlers.onSelectionChanged}
            onFilterChanged={handlers.onFilterChanged}
            onSortChanged={handlers.onSortChanged}
            onPaginationChanged={handlers.onPaginationChanged}
            onRowClicked={onRowClicked}
            {...gridOptions}
          />
        </div>
      </div>
    </div>
  );
}
