import { z } from "zod";

const optionalText = (max, label) =>
  z
    .string()
    .trim()
    .max(max, `${label} must be ${max} characters or fewer.`)
    .optional()
    .or(z.literal(""));

export const profileSchema = z.object({
  first_name: z
    .string()
    .trim()
    .min(1, "First name is required.")
    .max(80, "First name must be 80 characters or fewer."),
  last_name: z
    .string()
    .trim()
    .min(1, "Last name is required.")
    .max(80, "Last name must be 80 characters or fewer."),
  mobile_number: optionalText(30, "Mobile number").refine(
    (value) => !value || /^[+()\-\s\d]{7,30}$/.test(value),
    "Enter a valid mobile number.",
  ),
});
