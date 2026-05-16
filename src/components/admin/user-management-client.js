"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DataTable } from "@/components/shared/data-table";
import { UserService } from "@/services/users";

const roleOptions = [
  { value: "employee", label: "Employee" },
  { value: "manager", label: "Manager" },
  { value: "admin", label: "Admin" },
];

const statusOptions = [
  { value: "active", label: "Active" },
  { value: "pending", label: "Pending" },
  { value: "disabled", label: "Disabled" },
];

export function UserManagementClient({ initialUsers = [] }) {
  const [users, setUsers] = useState(initialUsers);
  const [busyUserId, setBusyUserId] = useState(null);

  const managers = useMemo(
    () => users.filter((user) => user.role === "manager" && user.status === "active"),
    [users],
  );

  async function updateUser(user, values) {
    try {
      setBusyUserId(user.id);
      const nextValues = { ...values };

      if (nextValues.role && nextValues.role !== "employee" && user.manager_id) {
        await UserService.assignManager(user.id, null);
      }

      const updatedUser = await UserService.updateUser(user.id, nextValues);
      setUsers((current) =>
        current.map((item) =>
          item.id === user.id
            ? {
                ...item,
                ...updatedUser,
                manager_id:
                  nextValues.role && nextValues.role !== "employee"
                    ? null
                    : item.manager_id,
              }
            : item,
        ),
      );
      toast.success("User updated");
    } catch (error) {
      toast.error(error.message || "Could not update user");
    } finally {
      setBusyUserId(null);
    }
  }

  async function assignManager(user, managerId) {
    try {
      setBusyUserId(user.id);
      await UserService.assignManager(user.id, managerId === "none" ? null : managerId);
      setUsers((current) =>
        current.map((item) =>
          item.id === user.id
            ? { ...item, manager_id: managerId === "none" ? null : managerId }
            : item,
        ),
      );
      toast.success("Manager assignment updated");
    } catch (error) {
      toast.error(error.message || "Could not assign manager");
    } finally {
      setBusyUserId(null);
    }
  }

  const columns = [
    { key: "name", header: "Name" },
    { key: "email", header: "Email" },
    {
      key: "role",
      header: "Role",
      render: (row) => (
        <Select
          value={row.role}
          disabled={busyUserId === row.id}
          onValueChange={(value) => updateUser(row, { role: value })}
        >
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {roleOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ),
    },
    {
      key: "manager_id",
      header: "Manager",
      render: (row) =>
        row.role === "employee" ? (
          <Select
            value={row.manager_id || "none"}
            disabled={busyUserId === row.id || managers.length === 0}
            onValueChange={(value) => assignManager(row, value)}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Assign manager" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Unassigned</SelectItem>
              {managers.map((manager) => (
                <SelectItem key={manager.id} value={manager.id}>
                  {manager.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Badge variant="outline">Not applicable</Badge>
        ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <Select
          value={row.status}
          disabled={busyUserId === row.id}
          onValueChange={(value) => updateUser(row, { status: value })}
        >
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={users}
      searchableKeys={["name", "email", "role", "status"]}
      searchPlaceholder="Search users"
      pageSize={10}
    />
  );
}
