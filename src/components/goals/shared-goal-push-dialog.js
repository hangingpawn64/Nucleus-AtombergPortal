"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { GoalService } from "@/services/goal.service";

const UOM_OPTIONS = [
  { value: "timeline", label: "Timeline" },
  { value: "min", label: "Minimum Value" },
  { value: "max", label: "Maximum Value" },
  { value: "zero", label: "Zero Errors" },
];

function personLabel(user) {
  const name = user.name || user.profile?.full_name || user.email;
  return name || "Employee";
}

export function SharedGoalPushDialog({ currentCycle, employees = [] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [primaryOwnerId, setPrimaryOwnerId] = useState("");
  const [values, setValues] = useState({
    title: "",
    thrustArea: "",
    description: "",
    uomType: "timeline",
    targetValue: "",
    deadline: "",
    defaultWeightage: 10,
  });

  const selectedEmployees = useMemo(
    () => employees.filter((employee) => selectedIds.includes(employee.id)),
    [employees, selectedIds],
  );

  function updateValue(field, value) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  function toggleEmployee(employeeId, checked) {
    setSelectedIds((current) => {
      const next = checked
        ? [...current, employeeId]
        : current.filter((id) => id !== employeeId);

      if (checked && !primaryOwnerId) {
        setPrimaryOwnerId(employeeId);
      } else if (!checked && primaryOwnerId === employeeId) {
        setPrimaryOwnerId(next[0] || "");
      }

      return next;
    });
  }

  async function pushSharedGoal() {
    if (!currentCycle?.id) {
      toast.error("No active cycle available");
      return;
    }

    if (!selectedIds.length || !primaryOwnerId) {
      toast.error("Select employees and a primary owner");
      return;
    }

    try {
      setIsSaving(true);
      await GoalService.pushSharedGoal({
        ...values,
        cycleId: currentCycle.id,
        employeeIds: selectedIds,
        primaryOwnerId,
      });
      toast.success("Shared KPI pushed");
      setOpen(false);
      setSelectedIds([]);
      setPrimaryOwnerId("");
      setValues({
        title: "",
        thrustArea: "",
        description: "",
        uomType: "timeline",
        targetValue: "",
        deadline: "",
        defaultWeightage: 10,
      });
      router.refresh();
    } catch (error) {
      toast.error(error.message || "Could not push shared KPI");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      <Button
        type="button"
        disabled={!currentCycle || employees.length === 0}
        onClick={() => setOpen(true)}
      >
        <Share2 className="size-4" />
        Push Shared KPI
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Push Shared KPI</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="shared-title">Goal title</Label>
              <Input
                id="shared-title"
                value={values.title}
                onChange={(event) => updateValue("title", event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="shared-thrust">Thrust area</Label>
              <Input
                id="shared-thrust"
                value={values.thrustArea}
                onChange={(event) => updateValue("thrustArea", event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>UoM type</Label>
              <Select
                value={values.uomType}
                onValueChange={(value) => updateValue("uomType", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UOM_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="shared-target">Target value</Label>
              <Input
                id="shared-target"
                type="number"
                value={values.targetValue}
                onChange={(event) => updateValue("targetValue", event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="shared-weightage">Default weightage</Label>
              <Input
                id="shared-weightage"
                type="number"
                min="10"
                max="100"
                value={values.defaultWeightage}
                onChange={(event) => updateValue("defaultWeightage", event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="shared-deadline">Deadline</Label>
              <Input
                id="shared-deadline"
                type="date"
                value={values.deadline}
                onChange={(event) => updateValue("deadline", event.target.value)}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="shared-description">Description</Label>
              <Textarea
                id="shared-description"
                value={values.description}
                onChange={(event) => updateValue("description", event.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_240px]">
            <div className="space-y-2">
              <Label>Employees</Label>
              <div className="max-h-56 space-y-2 overflow-y-auto rounded-md border p-3">
                {employees.map((employee) => (
                  <label
                    key={employee.id}
                    className="flex items-center gap-3 rounded-md px-2 py-1.5 text-sm hover:bg-muted"
                  >
                    <Checkbox
                      checked={selectedIds.includes(employee.id)}
                      onCheckedChange={(checked) =>
                        toggleEmployee(employee.id, checked === true)
                      }
                    />
                    <span className="min-w-0 flex-1 truncate">{personLabel(employee)}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Primary owner</Label>
              <Select value={primaryOwnerId} onValueChange={setPrimaryOwnerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select owner" />
                </SelectTrigger>
                <SelectContent>
                  {selectedEmployees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {personLabel(employee)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="button" disabled={isSaving} onClick={pushSharedGoal}>
              {isSaving ? "Pushing..." : "Push KPI"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
