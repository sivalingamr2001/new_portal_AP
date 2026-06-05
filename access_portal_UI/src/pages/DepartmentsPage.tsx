import { DataGrid } from "@/components/DynamicGrid/Index"
import type { ColDef } from "ag-grid-community"
import { useCallback, useMemo, useState, useEffect } from "react"
import { departmentsApi } from "@/api"
import type { UpdateDepartmentRequest } from "@/components/Department/EditDepartmentModal"
import { useLoader } from "@/hooks/useLoader"
import { getTitleFromSidebar } from "@/lib/getTitleFromSidebar"
import { useLocation } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { EditDepartmentModal } from "@/components/Department/EditDepartmentModal"
import {
  normalizeDepartment,
  type DepartmentResponseDto,
} from "@/lib/api-result"

export const DepartmentsPage = () => {
  const location = useLocation()
  const [departments, setDepartments] = useState<DepartmentResponseDto[]>([])
  const { loading, withLoader } = useLoader()

  // Modal tracking states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedDepartment, setSelectedDepartment] = useState<any | null>(null)

  const { title } = useMemo(
    () => getTitleFromSidebar(location.pathname),
    [location.pathname]
  )

  const fetchDepartments = useCallback(async () => {
    try {
      const result = await withLoader(() => departmentsApi.getDepartments())
      setDepartments(result.data.map(normalizeDepartment))
    } catch (error) {
      console.error("Failed to load departments:", error)
    }
  }, [withLoader])

  useEffect(() => {
    fetchDepartments()
  }, [])

  const handleSaveDepartment = async (payload: UpdateDepartmentRequest) => {
    if (!selectedDepartment?.department?.deptId) return;
    try {
      const targetId = selectedDepartment.department.deptId;
      await withLoader(() =>
        departmentsApi.updateDepartment(targetId, {
          name: payload.deptName ?? "",
          hodId: payload.hodId,
        })
      );
      setIsEditModalOpen(false);
      fetchDepartments();
    } catch (err) {
      console.error("Save error encountered:", err);
    }
  };

  const columns = useMemo<(Omit<ColDef<any>, "field"> & { field?: string })[]>(
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
      {
        headerName: "Actions",
        width: 100,
        sortable: false,
        filter: false,
        cellRenderer: (params: any) => {
          return (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedDepartment(params.data)
                setIsEditModalOpen(true)
              }}
            >
              Edit
            </Button>
          )
        },
      },
    ],
    [fetchDepartments]
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

      <EditDepartmentModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        departmentData={selectedDepartment}
        onSave={handleSaveDepartment}
      />
    </div>
  )
}
