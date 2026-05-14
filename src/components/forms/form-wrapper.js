"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function FormWrapper({
  schema,
  defaultValues,
  onSubmit,
  children,
  submitLabel = "Submit",
  className,
}) {
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues,
  });

  return (
    <form
      className={cn("space-y-4", className)}
      onSubmit={form.handleSubmit(onSubmit)}
      noValidate
    >
      {children(form)}
      <Button className="w-full" type="submit" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? "Please wait..." : submitLabel}
      </Button>
    </form>
  );
}
