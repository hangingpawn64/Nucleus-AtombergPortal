"use client";

import { useState } from "react";
import { toast } from "sonner";
import { CalendarPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/shared/status-badge";
import { CycleService } from "@/services/cycles";
import { formatDate } from "@/lib/utils";

const statusOptions = ["draft", "active", "closed", "archived"];

export function CycleManagementClient({ initialCycles = [] }) {
  const [cycles, setCycles] = useState(initialCycles);
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState({
    name: "",
    quarter: "Q1",
    start_date: "",
    end_date: "",
    status: "draft",
  });

  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function createCycle(event) {
    event.preventDefault();

    try {
      setIsCreating(true);
      const cycle = await CycleService.createCycle(form);
      setCycles((current) => [cycle, ...current]);
      setForm({
        name: "",
        quarter: "Q1",
        start_date: "",
        end_date: "",
        status: "draft",
      });
      toast.success("Cycle created");
    } catch (error) {
      toast.error(error.message || "Could not create cycle");
    } finally {
      setIsCreating(false);
    }
  }

  async function updateCycleStatus(cycle, status) {
    try {
      const updatedCycle = await CycleService.updateCycle(cycle.id, { status });
      setCycles((current) =>
        current.map((item) => (item.id === cycle.id ? updatedCycle : item)),
      );
      toast.success("Cycle status updated");
    } catch (error) {
      toast.error(error.message || "Could not update cycle");
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
      <Card className="rounded-md">
        <CardHeader>
          <CardTitle>Create Cycle</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={createCycle}>
            <div className="space-y-2">
              <Label htmlFor="cycle_name">Name</Label>
              <Input
                id="cycle_name"
                value={form.name}
                onChange={(event) => updateForm("name", event.target.value)}
                placeholder="FY 2026 Goal Cycle"
                required
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Quarter</Label>
                <Select value={form.quarter} onValueChange={(value) => updateForm("quarter", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["Q1", "Q2", "Q3", "Q4"].map((quarter) => (
                      <SelectItem key={quarter} value={quarter}>
                        {quarter}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(value) => updateForm("status", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="start_date">Start date</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={form.start_date}
                  onChange={(event) => updateForm("start_date", event.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_date">End date</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={form.end_date}
                  onChange={(event) => updateForm("end_date", event.target.value)}
                  required
                />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={isCreating}>
              <CalendarPlus className="size-4" />
              {isCreating ? "Creating..." : "Create Cycle"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {cycles.map((cycle) => (
          <Card key={cycle.id} className="rounded-md">
            <CardContent className="grid gap-4 p-5 lg:grid-cols-[minmax(0,1fr)_180px] lg:items-center">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-semibold">{cycle.name}</h2>
                  <StatusBadge status={cycle.status} />
                </div>
                <p className="text-sm text-muted-foreground">
                  {cycle.quarter} - {formatDate(cycle.start_date)} to {formatDate(cycle.end_date)}
                </p>
              </div>
              <Select
                value={cycle.status}
                onValueChange={(value) => updateCycleStatus(cycle, value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
