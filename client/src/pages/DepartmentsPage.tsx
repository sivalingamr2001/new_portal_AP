import { DataGrid } from "@/components/DynamicGrid/Index"
import type { ColDef } from "ag-grid-community"
import { useCallback, useMemo, useState, useEffect } from "react"
import departmentApi from "@/api/departmentApi"
import type { DepartmentResponseDto } from "@/api/types"
import { useLoader } from "@/hooks/useLoader"
import { getTitleFromSidebar } from "@/lib/getTitleFromSidebar"
import { useLocation } from "react-router-dom"

export const DepartmentsPage = () => {
  const location = useLocation()
  const [departments, setDepartments] = useState<DepartmentResponseDto[]>([])
  const { loading, withLoader } = useLoader()

  const { title } = useMemo(
    () => getTitleFromSidebar(location.pathname),
    [location.pathname]
  )

  const fetchDepartments = useCallback(async () => {
    try {
      const data = await withLoader(() => departmentApi.getAll())
      setDepartments(data)
    } catch (error) {
      console.error("Failed to load departments:", error)
    }
  }, [withLoader])

  useEffect(() => {
    fetchDepartments()
  }, [])

  const columns = useMemo<(Omit<ColDef<any>, 'field'> & { field?: string })[]>(
    () => [
      {
        headerName: "Department ID",
        field: "department.deptId",
        width: 120,
      },
      {
        headerName: "Department Name",
        field: "department.deptName",
        width: 250,
      },
      {
        headerName: "HOD Name",
        field: "hod.hodName",
        width: 150,
      },
      {
        headerName: "HOD Email",
        field: "hod.emailId",
        width: 200,
      },
      {
        headerName: "HOD Mobile",
        field: "hod.mobNo",
        width: 150,
      },
      {
        headerName: "Users Count",
        field: "users",
        width: 120,
        valueGetter: (params: any) => params.data?.users?.length || 0,
      },
    ],
    []
  )

  return (
    <div className="space-y-4">
      <DataGrid
        rowData={departments}
        columnDefs={columns}
        title={title}
        loading={loading}
        onRefresh={fetchDepartments}
        showRefreshButton
        showSearch
        showClearFiltersButton
        noRowsMessage="No departments found"
        pageSize={10}
      />
    </div>
  )
}
