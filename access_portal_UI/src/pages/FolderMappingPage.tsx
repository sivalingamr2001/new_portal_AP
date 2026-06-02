import { DataGrid } from "@/components/DynamicGrid/Index"
import type { ColDef } from "ag-grid-community"
import { useCallback, useMemo, useState, useEffect } from "react"
import folderMappingApi from "@/api/folderMappingApi"
import type { FolderMappingDto } from "@/api/types"
import { useLoader } from "@/hooks/useLoader"
import { getTitleFromSidebar } from "@/lib/getTitleFromSidebar"
import { useLocation } from "react-router-dom"

export const FolderMappingPage = () => {
  const location = useLocation()
  const [folderMappings, setFolderMappings] = useState<FolderMappingDto[]>([])
  const { loading, withLoader } = useLoader()

  const { title } = useMemo(
    () => getTitleFromSidebar(location.pathname),
    [location.pathname]
  )

  const fetchFolderMappings = useCallback(async () => {
    try {
      const result = await withLoader(() => folderMappingApi.getAll())
      if (!result.isSuccess || !result.value) {
        console.error("Failed to load folder mappings:", result.error?.message)
        return
      }
      setFolderMappings(result.value.data)
    } catch (error) {
      console.error("Failed to load folder mappings:", error)
    }
  }, [withLoader])

  useEffect(() => {
    fetchFolderMappings()
  }, [])

  const columns = useMemo<(Omit<ColDef<any>, "field"> & { field?: string })[]>(
    () => [
      {
        headerName: "ID",
        field: "id",
        width: 80,
      },
      {
        headerName: "Folder Path",
        field: "folderPath",
        width: 250,
      },
      {
        headerName: "Primary HOD Name",
        field: "primaryHodName",
        width: 150,
      },
      {
        headerName: "Primary HOD Email",
        field: "primaryHodEmail",
        width: 200,
      },
      {
        headerName: "Secondary HOD Name",
        field: "secondaryHodName",
        width: 150,
      },
      {
        headerName: "Secondary HOD Email",
        field: "secondaryHodEmail",
        width: 200,
      },
    ],
    []
  )

  return (
    <div className="space-y-4">
      <DataGrid
        rowData={folderMappings}
        columnDefs={columns}
        title={title}
        loading={loading}
        onRefresh={fetchFolderMappings}
        showRefreshButton
        showSearch
        showClearFiltersButton
        noRowsMessage="No folder mappings found"
        pageSize={10}
      />
    </div>
  )
}
