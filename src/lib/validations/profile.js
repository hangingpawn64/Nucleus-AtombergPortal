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

export function passwordStrengthChecks(password = "") {
  return [
    {
      id: "length",
      label: "At least 8 characters",
      passed: password.length >= 8,
    },
    {
      id: "case",
      label: "Upper and lower case letters",
      passed: /[a-z]/.test(password) && /[A-Z]/.test(password),
    },
    {
      id: "number",
      label: "At least one number",
      passed: /\d/.test(password),
    },
    {
      id: "symbol",
      label: "At least one symbol",
      passed: /[^A-Za-z0-9]/.test(password),
    },
  ];
}

export function passwordStrengthScore(password = "") {
  return passwordStrengthChecks(password).filter((check) => check.passed).length;
}

export const strongPasswordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .refine(
    (value) => passwordStrengthScore(value) >= 4,
    "Use upper and lower case letters, a number, and a symbol.",
  );

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password."),
    newPassword: strongPasswordSchema,
    confirmPassword: z.string().min(1, "Confirm your new password."),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });
