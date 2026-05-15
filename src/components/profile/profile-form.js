"use client";

import { useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarDays, CheckCircle2, Loader2, Mail, ShieldCheck } from "lucide-react";
import { useForm } from "react-hook-form";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
import { profileSchema } from "@/lib/validations/profile";
import { notify } from "@/lib/toast";
import { formatDate } from "@/lib/utils";
import {
  getProfileDisplayName,
  getProfileInitials,
  updateCurrentUserProfile,
} from "@/services/profile";

function getCompletion(profile, email) {
  const fields = [
    profile?.first_name,
    profile?.last_name,
    profile?.mobile_number,
    profile?.avatar_url,
    email,
  ];
  const completed = fields.filter(Boolean).length;

  return Math.round((completed / fields.length) * 100);
}

export function ProfileForm({ initialProfile, user }) {
  const [profile, setProfile] = useState(initialProfile);
  const email = user?.email || "";
  const displayName = getProfileDisplayName(profile, email);
  const initials = getProfileInitials(profile, email);
  const completion = useMemo(() => getCompletion(profile, email), [profile, email]);

  const form = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      first_name: profile?.first_name || "",
      last_name: profile?.last_name || "",
      mobile_number: profile?.mobile_number || "",
    },
  });

  async function onSubmit(values) {
    try {
      const nextProfile = await updateCurrentUserProfile(values);
      setProfile(nextProfile);
      form.reset({
        first_name: nextProfile.first_name || "",
        last_name: nextProfile.last_name || "",
        mobile_number: nextProfile.mobile_number || "",
      });
      notify.success("Profile updated");
    } catch (error) {
      notify.error(error.message || "Could not update profile.");
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
      <Card>
        <CardHeader>
          <CardTitle>Profile details</CardTitle>
          <CardDescription>
            Keep your personal information accurate for this portal.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)} noValidate>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="first_name">First name</Label>
                <Input
                  id="first_name"
                  autoComplete="given-name"
                  aria-invalid={Boolean(form.formState.errors.first_name)}
                  {...form.register("first_name")}
                />
                {form.formState.errors.first_name && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.first_name.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Last name</Label>
                <Input
                  id="last_name"
                  autoComplete="family-name"
                  aria-invalid={Boolean(form.formState.errors.last_name)}
                  {...form.register("last_name")}
                />
                {form.formState.errors.last_name && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.last_name.message}
                  </p>
                )}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="mobile_number">Mobile number</Label>
                <Input
                  id="mobile_number"
                  type="tel"
                  autoComplete="tel"
                  placeholder="+1 555 010 1234"
                  aria-invalid={Boolean(form.formState.errors.mobile_number)}
                  {...form.register("mobile_number")}
                />
                {form.formState.errors.mobile_number && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.mobile_number.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} readOnly disabled />
              </div>
            </div>
            <div className="flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                Changes are saved to your Supabase profile row.
              </p>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="animate-spin" />}
                Save changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card>
          <CardHeader className="items-center text-center">
            <Avatar className="size-20">
              <AvatarImage src={profile?.avatar_url || undefined} alt={displayName} />
              <AvatarFallback className="text-xl">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle>{displayName}</CardTitle>
              <CardDescription className="mt-1 break-all">{email}</CardDescription>
            </div>
            <Badge variant="secondary">Avatar upload ready</Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Profile completion</span>
                <span className="text-muted-foreground">{completion}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${completion}%` }}
                />
              </div>
            </div>
            <Separator />
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <Mail className="size-4 text-muted-foreground" />
                <span className="min-w-0 flex-1 truncate">{email}</span>
              </div>
              <div className="flex items-center gap-3">
                <ShieldCheck className="size-4 text-muted-foreground" />
                <span>{user?.email_confirmed_at ? "Email verified" : "Email pending"}</span>
              </div>
              <div className="flex items-center gap-3">
                <CalendarDays className="size-4 text-muted-foreground" />
                <span>Joined {formatDate(user?.created_at)}</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="size-4 text-muted-foreground" />
                <span>Last login {formatDate(user?.last_sign_in_at)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
