// @/pages/Users.tsx
"use client";

import * as React from "react";
import { RefreshCw, Search } from "lucide-react";
import userApi from "@/api/userApi";
import type { ApiLoginResponseDto } from "@/api/types";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const UsersPage = () => {
  const [users, setUsers] = React.useState<ApiLoginResponseDto[]>([]);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);

  // Core API Fetch Execution
  const fetchUsers = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await userApi.getAll();
      setUsers(data);
    } catch (error) {
      console.error("Failed to load user records:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Run on mount
  React.useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Client-side search matching against user name, email, or employee ID
  const filteredUsers = React.useMemo(() => {
    return users.filter((item) => {
      const name = item.cmplUser?.cmplUserName?.toLowerCase() || "";
      const email = item.cmplUser?.mailId?.toLowerCase() || "";
      const empId = item.cmplUser?.empId?.toLowerCase() || "";
      const query = searchQuery.toLowerCase();

      return name.includes(query) || email.includes(query) || empId.includes(query);
    });
  }, [users, searchQuery]);

  return (
    <div className="space-y-6 p-4">
      {/* HEADER ROW */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">User</h1>
      </div>

      {/* FILTER & ACTIONS TOOLBAR BAR */}
      <div className="flex items-center justify-between gap-4">
        {/* Search Field */}
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search username, email, or employee ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Refetch Action Button */}
        <Button
          variant="outline"
          size="icon"
          onClick={fetchUsers}
          disabled={isLoading}
          className="shrink-0"
          title="Refresh Data"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* COMPACT DATA TABLE DISPLAY */}
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User ID</TableHead>
              <TableHead>Username</TableHead>
              <TableHead>Employee ID</TableHead>
              <TableHead>Email ID</TableHead>
              <TableHead>Mobile No</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Location</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  Synchronizing records...
                </TableCell>
              </TableRow>
            ) : filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  No matching user profiles found.
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((item) => (
                <TableRow key={item.user?.userId || item.cmplUser?.cmplUserId}>
                  <TableCell className="font-mono text-xs">
                    {item.cmplUser?.cmplUserId}
                  </TableCell>
                  <TableCell className="font-medium">
                    {item.cmplUser?.cmplUserName}
                  </TableCell>
                  <TableCell>
                    {item.cmplUser?.empId || (
                      <span className="text-xs italic text-muted-foreground">N/A</span>
                    )}
                  </TableCell>
                  <TableCell>{item.cmplUser?.mailId}</TableCell>
                  <TableCell>{item.cmplUser?.mobNo}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary ring-1 ring-inset ring-primary/20">
                      {item.user?.role || "User"}
                    </span>
                  </TableCell>
                  <TableCell>{item.user?.location || "Default"}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
