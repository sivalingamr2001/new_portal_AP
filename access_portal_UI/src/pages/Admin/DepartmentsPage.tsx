import { departmentsApi } from "@/api"
import type { DepartmentDetailDto } from "@/api/types" // Using your provided native interface layout structure
import { Button } from "@/components/ui/button"
import type { DynamicPageConfig } from "@/types"
import { DynamicGridPage } from "../common/DynamicGridPage"
import { EditDepartmentModal } from "@/components/Department/EditDepartmentModal"

const departmentConfig: DynamicPageConfig<DepartmentDetailDto> = {
  gridId: "departments_grid",
  enableInfiniteScroll: false,
  defaultPageSize: 10,
  getId: (item) => item.id,
  fetchData: async () => {
    const res = await departmentsApi.getDepartments()
    return { data: res.data }
  },
  onUpdateRecord: async (id, payload) => {
    await departmentsApi.updateDepartment(id as number, {
      name: payload.deptName ?? "",
      hodId: payload.hodId,
    })
  },
  columns: ({ openEditModal }) => [
    {
      headerName: "Department ID",
      field: "id",
      width: 120
    },
    {
      headerName: "Department Name",
      field: "name",
      width: 250
    },
    {
      headerName: "HOD Name",
      field: "hodName",
      width: 150
    },
    {
      headerName: "HOD Email",
      field: "hodEmail",
      width: 200
    },
    {
      headerName: "Active Status",
      field: "isActive",
      width: 120,
      valueFormatter: (params: any) => params.value ? "Active" : "Inactive"
    },
    {
      headerName: "Created On",
      field: "createdOn",
      width: 180,
      valueFormatter: (params: any) => params.value ? new Date(params.value).toLocaleDateString() : "N/A"
    },
    {
      headerName: "Actions",
      width: 100,
      sortable: false,
      filter: false,
      cellRenderer: (params: any) => params.data && (
        <Button variant="outline" size="sm" onClick={() => openEditModal(params.data)}>Edit</Button>
      ),
    },
  ],
}

export const DepartmentsPage = () => <DynamicGridPage config={departmentConfig} ModalComponent={EditDepartmentModal} />
