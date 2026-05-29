import * as z from "zod";

export const goalSchema = z.object({
  id: z.string().uuid().optional(),
  shared_goal_id: z.string().uuid().nullable().optional(),
  shared_goal_primary: z.boolean().optional(),
  thrust_area: z.string().min(1, "Thrust area is required"),
  title: z.string().min(3, "Title must be at least 3 characters").max(100, "Title is too long"),
  description: z.string().optional(),
  uom_type: z.enum(["min", "max", "timeline", "zero"], {
    required_error: "Unit of measurement is required",
  }),
  target_value: z.coerce.number().min(0, "Target value must be positive").optional(),
  weightage: z.coerce.number().min(10, "Minimum weightage per goal is 10%").max(100, "Maximum weightage is 100%"),
  status: z.enum(["not_started", "on_track", "completed"]).default("not_started"),
  deadline: z.string().optional(),
});

export const goalSheetSchema = z.object({
  id: z.string().uuid().optional(),
  goals: z.array(goalSchema)
    .max(8, "Maximum 8 goals allowed per employee")
    .refine((goals) => {
      if (goals.length === 0) return true; // Draft can be empty
      const totalWeightage = goals.reduce((acc, curr) => acc + (curr.weightage || 0), 0);
      return totalWeightage === 100;
    }, {
      message: "Total weightage across all goals must equal 100%",
      path: ["goals"],
    }),
});
