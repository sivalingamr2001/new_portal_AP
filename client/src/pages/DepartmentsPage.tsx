// @/pages/Departments.tsx
"use client"

import * as React from "react"
import {
  RefreshCw,
  Search,
  Eye,
  Edit2,
  Building2,
  UserCheck,
  Users,
} from "lucide-react"
import departmentApi from "@/api/departmentApi"
import type { DepartmentResponseDto } from "@/api/types"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export const DepartmentsPage = () => {
  const [departments, setDepartments] = React.useState<DepartmentResponseDto[]>(
    []
  )
  const [searchQuery, setSearchQuery] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  // View Modal Hierarchy States
  const [selectedDept, setSelectedDept] =
    React.useState<DepartmentResponseDto | null>(null)
  const [isViewModalOpen, setIsViewModalOpen] = React.useState(false)

  // EDIT STATE VARIABLES
  const [editingDept, setEditingDept] =
    React.useState<DepartmentResponseDto | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false)
  const [formData, setFormData] = React.useState({
    deptName: "",
    hodId: "" as string | number,
  })

  const fetchDepartments = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await departmentApi.getAll()
      setDepartments(data)
    } catch (error) {
      console.error("Failed to load department schema:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchDepartments()
  }, [fetchDepartments])

  const filteredDepartments = React.useMemo(() => {
    return departments.filter((item) => {
      const name = item.department?.deptName?.toLowerCase() || ""
      const id = String(item.department?.deptId || "")
      const query = searchQuery.toLowerCase()
      return name.includes(query) || id.includes(query)
    })
  }, [departments, searchQuery])

  const handleViewDetails = (dept: DepartmentResponseDto) => {
    setSelectedDept(dept)
    setIsViewModalOpen(true)
  }

  // 1. Trigger Edit Mode: Populate state with active data fields
  const handleOpenEdit = (dept: DepartmentResponseDto) => {
    setEditingDept(dept)
    setFormData({
      deptName: dept.department?.deptName || "",
      // Fallback placeholder logic for hodId mapping if present in your dto response structure
      hodId: "",
    })
    setIsEditModalOpen(true)
  }

  // 2. Submit Put Payload to Backend Api Services
  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingDept?.department?.deptId) return

    setIsSubmitting(true)
    try {
      const updatedData = await departmentApi.update(
        editingDept.department.deptId,
        {
          deptName: formData.deptName || null,
          hodId: formData.hodId ? Number(formData.hodId) : null,
        }
      )

      // 3. Reactively update local component state arrays without forcing an extra network reload
      setDepartments((prev) =>
        prev.map((item) =>
          item.department?.deptId === editingDept.department?.deptId
            ? {
                ...item,
                department: {
                  ...item.department,
                  deptName: updatedData.department?.deptName,
                },
              }
            : item
        )
      )

      setIsEditModalOpen(false)
      setEditingDept(null)
    } catch (error) {
      console.error("Failed to update target department data context:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 p-4">
      {/* HEADER ROW */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Department
        </h1>
      </div>

      {/* FILTER & ACTIONS TOOLBAR BAR */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute top-2.5 left-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search department ID or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={fetchDepartments}
          disabled={isLoading}
          className="shrink-0"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* INDEPENDENT DATA DISPLAY MATRIX */}
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[120px]">Department ID</TableHead>
              <TableHead>Department Name</TableHead>
              <TableHead className="w-[120px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="h-24 text-center text-muted-foreground"
                >
                  Synchronizing records...
                </TableCell>
              </TableRow>
            ) : filteredDepartments.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="h-24 text-center text-muted-foreground"
                >
                  No matching department profiles found.
                </TableCell>
              </TableRow>
            ) : (
              filteredDepartments.map((item) => (
                <TableRow key={item.department?.deptId}>
                  <TableCell className="font-mono font-medium">
                    {item.department?.deptId}
                  </TableCell>
                  <TableCell>
                    {item.department?.deptName || (
                      <span className="text-xs text-muted-foreground italic">
                        Unassigned Name
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {/* View Action Trigger */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={() => handleViewDetails(item)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {/* Edit Action Trigger */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={() => handleOpenEdit(item)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* DYNAMIC HIERARCHY OVERLAY MODAL */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        {/* View Modal content as previously constructed remains here */}
      </Dialog>

      {/* DYNAMIC EDIT FORM MODAL OVERLAY */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleUpdateSubmit}>
            <DialogHeader>
              <DialogTitle>Edit Department Profile</DialogTitle>
              <DialogDescription>
                Modify internal parameters for Department ID:{" "}
                <span className="font-mono font-bold">
                  {editingDept?.department?.deptId}
                </span>
                .
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              {/* Field 1: Department Name Text Input */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="deptName" className="text-right">
                  Name
                </Label>
                <Input
                  id="deptName"
                  value={formData.deptName}
                  onChange={(e) =>
                    setFormData({ ...formData, deptName: e.target.value })
                  }
                  className="col-span-3"
                  placeholder="Enter custom department string"
                />
              </div>

              {/* Field 2: HOD Employee ID Dropdown Selection Mocking */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="hodId" className="text-right">
                  HOD User ID
                </Label>
                <select
                  id="hodId"
                  value={formData.hodId}
                  onChange={(e) =>
                    setFormData({ ...formData, hodId: e.target.value })
                  }
                  className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                  <option value="">Select an available user node</option>
                  {editingDept?.users?.map((u) => (
                    <option key={u.cmplUserId} value={u.cmplUserId}>
                      {u.cmplUserName} (ID: {u.cmplUserId})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {isSubmitting ? "Updating..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
