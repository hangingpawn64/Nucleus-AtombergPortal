"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { notify } from "@/lib/toast";
import { loginSchema, signupSchema } from "@/lib/validations/auth";

function safeRedirectTo(value) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/app/dashboard";
  }

  if (value === "/dashboard") return "/app/dashboard";
  if (value === "/dashboard/admin") return "/app/dashboard";
  if (value.startsWith("/dashboard/admin/activity")) {
    return value.replace("/dashboard/admin/activity", "/app/audit");
  }
  if (value.startsWith("/dashboard/admin/cycles")) {
    return value.replace("/dashboard/admin/cycles", "/app/cycles");
  }
  if (value.startsWith("/dashboard/admin/goals")) {
    return value.replace("/dashboard/admin/goals", "/app/goal-progress");
  }
  if (value.startsWith("/dashboard/admin/reports")) {
    return value.replace("/dashboard/admin/reports", "/app/reports");
  }
  if (value.startsWith("/dashboard/admin/users")) {
    return value.replace("/dashboard/admin/users", "/app/users");
  }
  if (value.startsWith("/dashboard/check-ins")) {
    return value.replace("/dashboard/check-ins", "/app/checkins");
  }
  if (value.startsWith("/dashboard/settings")) {
    return value.replace("/dashboard/settings", "/app/profile");
  }
  if (value.startsWith("/dashboard/")) {
    return value.replace("/dashboard", "/app");
  }

  return value;
}

export function AuthForm({ mode = "login" }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isSignup = mode === "signup";
  const schema = isSignup ? signupSchema : loginSchema;
  const redirectTo = safeRedirectTo(searchParams.get("redirectTo"));
  const [isOAuthLoading, setIsOAuthLoading] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    const authError = searchParams.get("auth_error");
    const reset = searchParams.get("reset");

    if (authError) {
      notify.error(authError);
    }

    if (reset === "complete") {
      notify.success("Password updated. Sign in with your new password.");
    }
  }, [searchParams]);

  async function signInWithGoogle() {
    const supabase = createBrowserSupabaseClient();

    if (!supabase) {
      notify.error("Add Supabase URL and anon key to your environment first.");
      return;
    }

    setIsOAuthLoading(true);

    const callbackUrl = new URL("/auth/callback", window.location.origin);
    callbackUrl.searchParams.set("next", redirectTo);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: callbackUrl.toString(),
      },
    });

    if (error) {
      setIsOAuthLoading(false);
      notify.error(error.message);
    }
  }

  async function onSubmit(values) {
    const supabase = createBrowserSupabaseClient();

    if (!supabase) {
      notify.error("Add Supabase URL and anon key to your environment first.");
      return;
    }

    if (isSignup) {
      const { error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
        },
      });

      if (error) {
        notify.error(error.message);
        return;
      }

      notify.success("Account created. Check your email if confirmations are enabled.");
      setIsNavigating(true);
      router.push("/app/dashboard");
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });

    if (error) {
      notify.error(error.message);
      return;
    }

    notify.success("Welcome back");
    setIsNavigating(true);
    router.push(redirectTo);
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>{isSignup ? "Create your account" : "Sign in"}</CardTitle>
        <CardDescription>
          {isSignup
            ? "Start with a reusable portal account."
            : "Access the protected portal workspace."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              aria-invalid={Boolean(form.formState.errors.email)}
              {...form.register("email")}
            />
            {form.formState.errors.email && (
              <p className="text-sm text-destructive">
                {form.formState.errors.email.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete={isSignup ? "new-password" : "current-password"}
              aria-invalid={Boolean(form.formState.errors.password)}
              {...form.register("password")}
            />
            {form.formState.errors.password && (
              <p className="text-sm text-destructive">
                {form.formState.errors.password.message}
              </p>
            )}
          </div>
          {isSignup && (
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm password</Label>
              <Input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                aria-invalid={Boolean(form.formState.errors.confirmPassword)}
                {...form.register("confirmPassword")}
              />
              {form.formState.errors.confirmPassword && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.confirmPassword.message}
                </p>
              )}
            </div>
          )}
          <Button className="w-full" type="submit" disabled={form.formState.isSubmitting || isNavigating}>
            {(form.formState.isSubmitting || isNavigating) && <Loader2 className="animate-spin" />}
            {isSignup ? "Create account" : "Sign in"}
          </Button>
        </form>
        <div className="my-5 flex items-center gap-3">
          <Separator className="flex-1" />
          <span className="text-xs font-medium uppercase text-muted-foreground">
            Or
          </span>
          <Separator className="flex-1" />
        </div>
        <Button
          className="w-full"
          type="button"
          variant="outline"
          disabled={form.formState.isSubmitting || isOAuthLoading || isNavigating}
          onClick={signInWithGoogle}
        >
          {isOAuthLoading ? (
            <Loader2 className="animate-spin" />
          ) : (
            <LogIn />
          )}
          Continue with Google
        </Button>
        {!isSignup && (
          <p className="mt-4 text-center text-sm">
            <Link
              className="font-medium text-primary underline-offset-4 hover:underline"
              href="/forgot-password"
            >
              Forgot password?
            </Link>
          </p>
        )}
        <p className="mt-6 text-center text-sm text-muted-foreground">
          {isSignup ? "Already have an account?" : "Need an account?"}{" "}
          <Link
            className="font-medium text-primary underline-offset-4 hover:underline"
            href={isSignup ? "/login" : "/signup"}
          >
            {isSignup ? "Sign in" : "Sign up"}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
