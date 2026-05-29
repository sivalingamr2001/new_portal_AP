import { DataGrid } from "@/components/DynamicGrid/Index";
import type { DetailSectionConfig } from "@/components/DynamicGrid/types";
import { Button } from "@/components/ui/button";
import type { ColDef } from "ag-grid-community";
import { ChevronUp, TextQuote } from "lucide-react";
import { useCallback, useMemo, useState, useEffect } from "react"; // Fixed missing useEffect dependency import
import type { UserRowPayload } from "./types";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import userApi from "@/api/userApi";
import { useLoader } from "@/hooks/useLoader";

export const UsersPage = () => {
  const [expandedRowIds, setExpandedRowIds] = useState<number[]>([]);
  const [users, setUsers] = useState<UserRowPayload[]>([]);
  const { loading, withLoader } = useLoader()

  const fetchUsers = useCallback(async () => {
    try {
      const data: any = await withLoader(() => userApi.getAll());
      setUsers(data);
    } catch (error) {
      console.error("Failed to load user records:", error);
    }
  }, []);

  // FIX 1: Cleared out the recursive loop dependency to guarantee a single initial mount data query
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const toggleRowExpansion = useCallback((id: number) => {
    setExpandedRowIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }, []);

  // FIX 2: Restored the free-tier row interleaving proxy transformer engine
  const computedRowData = useMemo(() => {
    const flatList: any[] = [];
    users.forEach((row) => {
      flatList.push(row);
      if (expandedRowIds.includes(row.cmplUser.cmplUserId)) {
        flatList.push({
          __isDetailRow: true,
          __parentData: row,
          cmplUser: { cmplUserId: `detail_${row.cmplUser.cmplUserId}` }
        });
      }
    });
    return flatList;
  }, [users, expandedRowIds]);

  const handleEditAction = useCallback((rowData: UserRowPayload) => {
    alert(`Editing Target Reference for Compliance ID: ${rowData.cmplUser.cmplUserId}`);
  }, []);

  const dynamicSectionsConfig = useMemo<DetailSectionConfig[]>(() => [
    { title: "Core User Profile Info", objectKey: "user" },
    { title: "Compliance Audit Status", objectKey: "cmplUser" },
    { title: "Corporate Department Details", objectKey: "department" }
  ], []);

  const columns = useMemo<(Omit<ColDef<any>, 'field'> & { field?: string })[]>(() => [
    {
      headerName: "",
      width: 80,
      suppressMovable: true,
      filter: false,
      sortable: false,
      cellRenderer: (params: any) => {
        if (params.data?.__isDetailRow) return null;
        const isExpanded = expandedRowIds.includes(params.data?.cmplUser?.cmplUserId);

        return (
          /* FIX: Replaced primitive prop-string structure with declarative layout elements */
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 cursor-pointer font-bold text-slate-500 hover:text-indigo-600 transition"
                onClick={() => toggleRowExpansion(params.data.cmplUser.cmplUserId)}
              >
                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <TextQuote className="h-4 w-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              {isExpanded ? "Collapse Details" : "Expand Details"}
            </TooltipContent>
          </Tooltip>
        );
      }
    },
    { headerName: "Compliance User ID", field: "cmplUser.cmplUserId" },
    { headerName: "Username", field: "cmplUser.cmplUserName" },
    { headerName: "Email Address", field: "cmplUser.mailId" },
    { headerName: "Mobile String", field: "cmplUser.mobNo" },
    { headerName: "Department ID", field: "department.deptId" },
    {
      headerName: "Actions Panel",
      sortable: false,
      filter: false,
      cellRenderer: (params: any) => {
        if (!params.data || params.data.__isDetailRow) return null;
        return (
          <div className="flex items-center h-full gap-2">
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs px-2"
              onClick={() => handleEditAction(params.data)}
            >
              Edit
            </Button>
          </div>
        );
      },
      width: 100,
    }
  ], [handleEditAction, expandedRowIds, toggleRowExpansion]);

  const globalCustomActions = useMemo(() => [

  ], []);

  return (
    <div className="w-full p-6 space-y-4">
      <DataGrid
        title="Security & Compliance User Directory (Community MIT)"
        rowData={computedRowData} // FIX 3: Changed from static 'users' list straight to 'computedRowData'
        columnDefs={columns}
        gridId="compliance_users_free_v35"
        pageSize={10}
        pageSizeOptions={[10, 20, 50]}
        loading={loading}
        showSearch={true}
        showRefreshButton={true}
        showClearFiltersButton={true}
        customActions={globalCustomActions}
        onRefresh={fetchUsers} // FIX 4: Linked network API handler to dynamic toolbar refresh emitter hook
        theme="system"
        masterDetail={false}
        detailSections={dynamicSectionsConfig}
        gridHeight="550px"
      />
    </div>
  );
};
