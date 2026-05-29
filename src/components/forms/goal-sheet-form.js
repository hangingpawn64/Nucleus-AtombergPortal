"use client";

import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { goalSheetSchema } from "@/lib/validations/goal-schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, AlertCircle, Save, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { GoalService } from "@/services/goal.service";
import { useRouter } from "next/navigation";
import { useState } from "react";

const DEFAULT_GOAL = {
  thrust_area: "",
  title: "",
  description: "",
  uom_type: "timeline",
  target_value: "",
  weightage: 10,
  status: "not_started",
};

const GOAL_STATUS_OPTIONS = [
  { value: "not_started", label: "Not Started" },
  { value: "on_track", label: "On Track" },
  { value: "completed", label: "Completed" },
];

export function GoalSheetForm({ cycle, initialData = null }) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isLocked =
    Boolean(initialData?.locked) ||
    initialData?.status === "submitted" ||
    initialData?.status === "approved";
  const submitLabel = initialData?.status === "rework" ? "Resubmit Goals" : "Submit Goals";

  const form = useForm({
    resolver: zodResolver(goalSheetSchema),
    defaultValues: {
      goals: initialData?.goals?.length > 0
        ? initialData.goals.map((goal) => ({
            ...goal,
            status: goal.status || "not_started",
          }))
        : [{ ...DEFAULT_GOAL }],
    },
    mode: "onChange",
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "goals",
  });

  const watchGoals = useWatch({
    control: form.control,
    name: "goals",
  }) || [];
  const totalWeightage = watchGoals.reduce((sum, goal) => sum + (Number(goal.weightage) || 0), 0);
  const remainingWeightage = 100 - totalWeightage;
  const isWeightageValid = totalWeightage === 100;

  const handleSaveDraft = async () => {
    try {
      setIsSaving(true);
      const currentGoals = form.getValues("goals");
      await GoalService.saveDraft(cycle.id, currentGoals);
      toast.success("Draft saved successfully");
      router.refresh();
    } catch (error) {
      toast.error(error.message || "Failed to save draft");
    } finally {
      setIsSaving(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      setIsSubmitting(true);
      await GoalService.submitGoalSheet(cycle.id, data.goals);
      toast.success("Goal sheet submitted successfully!");
      router.push("/app/goals");
      router.refresh();
    } catch (error) {
      toast.error(error.message || "Failed to submit goal sheet");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Live Validation UX */}
      <div className="bg-card text-card-foreground p-4 rounded-lg border shadow-sm sticky top-4 z-10">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-sm">Weightage Summary</h3>
          <span className={`text-sm font-medium ${isWeightageValid ? "text-green-600" : "text-amber-600"}`}>
            {totalWeightage}% / 100%
          </span>
        </div>
        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
          <div 
            className={`h-2.5 rounded-full transition-all duration-500 ${isWeightageValid ? "bg-green-500" : totalWeightage > 100 ? "bg-red-500" : "bg-amber-500"}`}
            style={{ width: `${Math.min(totalWeightage, 100)}%` }}
          ></div>
        </div>
        {!isWeightageValid && (
          <p className="text-xs text-amber-600 mt-2 flex items-center">
            <AlertCircle className="w-3 h-3 mr-1" />
            {remainingWeightage > 0 
              ? `Remaining Weightage: ${remainingWeightage}%` 
              : `You are over by ${Math.abs(remainingWeightage)}%.`}
          </p>
        )}
      </div>

      <form 
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-8"
        noValidate
      >
        {fields.map((field, index) => {
          const isSharedGoal = Boolean(field.shared_goal_id);

          return (
          <div key={field.id} className="bg-card text-card-foreground p-6 rounded-lg border shadow-sm relative group">
            <div className="flex justify-between items-center mb-4">
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="font-medium flex items-center gap-2">
                  <span className="bg-primary/10 text-primary w-6 h-6 rounded-full flex items-center justify-center text-xs">
                    {index + 1}
                  </span>
                  Goal Details
                </h4>
                {isSharedGoal && <Badge variant="outline">Pushed KPI</Badge>}
              </div>
              {!isLocked && !isSharedGoal && fields.length > 1 && (
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  onClick={() => remove(index)}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Remove
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 md:col-span-2">
                <Label>Title <span className="text-red-500">*</span></Label>
                <Input 
                  {...form.register(`goals.${index}.title`)} 
                  placeholder="e.g., Increase Q3 Sales by 15%" 
                  disabled={isLocked || isSharedGoal}
                />
                {form.formState.errors.goals?.[index]?.title && (
                  <p className="text-sm text-red-500">{form.formState.errors.goals[index].title.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Thrust Area <span className="text-red-500">*</span></Label>
                <Input 
                  {...form.register(`goals.${index}.thrust_area`)} 
                  placeholder="e.g., Revenue, Operations" 
                  disabled={isLocked || isSharedGoal}
                />
                {form.formState.errors.goals?.[index]?.thrust_area && (
                  <p className="text-sm text-red-500">{form.formState.errors.goals[index].thrust_area.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Weightage (%) <span className="text-red-500">*</span></Label>
                <Input 
                  type="number"
                  {...form.register(`goals.${index}.weightage`, { valueAsNumber: true })} 
                  placeholder="10-100" 
                  disabled={isLocked}
                  min="10"
                  max="100"
                />
                {form.formState.errors.goals?.[index]?.weightage && (
                  <p className="text-sm text-red-500">{form.formState.errors.goals[index].weightage.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>UoM Type <span className="text-red-500">*</span></Label>
                <Select 
                  disabled={isLocked || isSharedGoal}
                  onValueChange={(val) => form.setValue(`goals.${index}.uom_type`, val)}
                  defaultValue={field.uom_type}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="timeline">Timeline</SelectItem>
                    <SelectItem value="min">Minimum Value</SelectItem>
                    <SelectItem value="max">Maximum Value</SelectItem>
                    <SelectItem value="zero">Zero Errors</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Status <span className="text-red-500">*</span></Label>
                <Select
                  disabled={isLocked || isSharedGoal}
                  onValueChange={(val) => form.setValue(`goals.${index}.status`, val, { shouldValidate: true })}
                  defaultValue={field.status || "not_started"}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {GOAL_STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Target Value</Label>
                <Input 
                  type="number"
                  {...form.register(`goals.${index}.target_value`)} 
                  placeholder="e.g., 100000" 
                  disabled={isLocked || isSharedGoal}
                />
              </div>

              <div className="space-y-2">
                <Label>Deadline</Label>
                <Input 
                  type="date"
                  {...form.register(`goals.${index}.deadline`)} 
                  disabled={isLocked || isSharedGoal}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>Description</Label>
                <Input 
                  {...form.register(`goals.${index}.description`)} 
                  placeholder="Brief description of how to achieve this" 
                  disabled={isLocked || isSharedGoal}
                />
              </div>
            </div>
          </div>
          );
        })}

        {!isLocked && fields.length < 8 && (
          <Button 
            type="button" 
            variant="outline" 
            className="w-full border-dashed py-8 border-2"
            onClick={() => append({ ...DEFAULT_GOAL })}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Goal
          </Button>
        )}

        {form.formState.errors.goals?.root && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            {form.formState.errors.goals.root.message}
          </div>
        )}

        {!isLocked && (
          <div className="flex gap-4 justify-end border-t pt-6 mt-8">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleSaveDraft}
              disabled={isSaving || isSubmitting}
            >
              {isSaving ? "Saving..." : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Draft
                </>
              )}
            </Button>
            <Button 
              type="submit"
              disabled={!isWeightageValid || isSaving || isSubmitting}
              className={isWeightageValid ? "bg-primary" : "bg-slate-400"}
            >
              {isSubmitting ? "Submitting..." : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {submitLabel}
                </>
              )}
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}
