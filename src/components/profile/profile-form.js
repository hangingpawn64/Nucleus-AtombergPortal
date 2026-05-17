"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircle,
  CalendarDays,
  Camera,
  CheckCircle2,
  CloudUpload,
  KeyRound,
  Loader2,
  Mail,
  ShieldCheck,
  Smartphone,
  UserRound,
  Users,
} from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { UserAvatar } from "@/components/profile/user-avatar";
import { useRealtimeSubscription } from "@/hooks/use-realtime";
import {
  changePasswordSchema,
  passwordStrengthChecks,
  passwordStrengthScore,
  profileSchema,
} from "@/lib/validations/profile";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { notify } from "@/lib/toast";
import { cn, formatDate } from "@/lib/utils";
import {
  MAX_AVATAR_SIZE_BYTES,
  getProfileDisplayName,
  updateCurrentUserProfile,
  updateCurrentUserProfilePreferences,
  uploadCurrentUserAvatar,
  validateAvatarFile,
} from "@/services/profile";

const defaultNotificationPreferences = {
  goalUpdates: true,
  approvalAlerts: true,
  checkinReminders: true,
  weeklyDigest: false,
};

const completionItems = [
  {
    key: "first_name",
    label: "Add your first name",
    isComplete: (profile) => Boolean(profile?.first_name),
  },
  {
    key: "last_name",
    label: "Add your last name",
    isComplete: (profile) => Boolean(profile?.last_name),
  },
  {
    key: "mobile_number",
    label: "Add a mobile number",
    isComplete: (profile) => Boolean(profile?.mobile_number),
  },
  {
    key: "avatar_url",
    label: "Add a profile picture",
    isComplete: (profile) => Boolean(profile?.avatar_url),
  },
  {
    key: "password",
    label: "Configure password access",
    isComplete: (_profile, accountInfo) => Boolean(accountInfo?.passwordConfigured),
  },
];

function getCompletion(profile, accountInfo) {
  const completed = completionItems.filter((item) =>
    item.isComplete(profile, accountInfo),
  ).length;

  return Math.round((completed / completionItems.length) * 100);
}

function getMissingItems(profile, accountInfo) {
  return completionItems.filter((item) => !item.isComplete(profile, accountInfo));
}

function preferencesFromProfile(profile) {
  return {
    ...defaultNotificationPreferences,
    ...(profile?.metadata?.notification_preferences || {}),
  };
}

function providerLabel(provider) {
  if (provider === "google") return "Google";
  if (provider === "email") return "Email/password";
  return provider || "Password";
}

function CompletionCard({ profile, accountInfo }) {
  const completion = useMemo(
    () => getCompletion(profile, accountInfo),
    [profile, accountInfo],
  );
  const missingItems = useMemo(
    () => getMissingItems(profile, accountInfo),
    [profile, accountInfo],
  );

  return (
    <Card className="rounded-md">
      <CardHeader>
        <CardTitle>Profile completion</CardTitle>
        <CardDescription>
          Complete your account so collaborators can recognize and contact you.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-3xl font-semibold">{completion}%</span>
          <Badge variant={completion === 100 ? "default" : "secondary"}>
            {completion === 100 ? "Complete" : "In progress"}
          </Badge>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${completion}%` }}
          />
        </div>
        {missingItems.length > 0 ? (
          <div className="space-y-2">
            {missingItems.slice(0, 3).map((item) => (
              <div key={item.key} className="flex items-center gap-2 text-sm">
                <AlertCircle className="size-4 text-amber-600" />
                <span>{item.label} to complete your profile.</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle2 className="size-4 text-green-600" />
            Your profile has all recommended account details.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ProfilePictureSection({ profile, email, onProfileChange }) {
  const router = useRouter();
  const inputRef = useRef(null);
  const previewUrlRef = useRef("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const displayName = getProfileDisplayName(profile, email);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  function clearSelectedFile() {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = "";
    }

    setPreviewUrl("");
    setSelectedFile(null);
  }

  function chooseFile(file) {
    const validationError = validateAvatarFile(file);

    if (validationError) {
      setError(validationError);
      clearSelectedFile();
      return;
    }

    setError("");
    clearSelectedFile();
    const objectUrl = URL.createObjectURL(file);
    previewUrlRef.current = objectUrl;
    setPreviewUrl(objectUrl);
    setSelectedFile(file);
  }

  async function saveAvatar() {
    if (!selectedFile) return;

    try {
      setIsUploading(true);
      const nextProfile = await uploadCurrentUserAvatar(selectedFile);
      onProfileChange(nextProfile);
      clearSelectedFile();
      notify.success("Profile picture updated");
      router.refresh();
    } catch (uploadError) {
      notify.error(uploadError.message || "Could not upload profile picture.");
      setError(uploadError.message || "Could not upload profile picture.");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <Card className="rounded-md">
      <CardHeader>
        <CardTitle>Profile Picture</CardTitle>
        <CardDescription>
          Upload a PNG, JPG, JPEG, or WEBP image up to {MAX_AVATAR_SIZE_BYTES / 1024 / 1024} MB.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-5 lg:grid-cols-[160px_minmax(0,1fr)]">
        <div className="flex flex-col items-center gap-3">
          <div className="group relative">
            <UserAvatar
              profile={previewUrl ? { ...profile, avatar_url: previewUrl } : profile}
              email={email}
              size="2xl"
              className="ring-2 ring-background transition-transform duration-200 group-hover:scale-[1.03]"
              priority
            />
            <button
              type="button"
              className="absolute inset-0 flex items-center justify-center rounded-full bg-black/0 text-white opacity-0 transition-all group-hover:bg-black/35 group-hover:opacity-100"
              onClick={() => inputRef.current?.click()}
            >
              <Camera className="size-5" />
              <span className="sr-only">Choose profile picture</span>
            </button>
          </div>
          <p className="max-w-40 truncate text-sm font-medium">{displayName}</p>
        </div>

        <div className="space-y-4">
          <div
            className={cn(
              "flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-md border border-dashed bg-muted/25 p-6 text-center transition-colors",
              isDragging && "border-primary bg-accent/40",
              error && "border-destructive bg-destructive/5",
            )}
            onClick={() => inputRef.current?.click()}
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(event) => {
              event.preventDefault();
              setIsDragging(false);
              chooseFile(event.dataTransfer.files?.[0]);
            }}
          >
            <CloudUpload className="mb-3 size-8 text-muted-foreground" />
            <p className="text-sm font-medium">
              Drop your image here or click to browse
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Square images work best. Large images are rejected before upload.
            </p>
            <input
              ref={inputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
              className="sr-only"
              onChange={(event) => chooseFile(event.target.files?.[0])}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          {selectedFile && (
            <div className="flex flex-col gap-3 rounded-md border bg-card p-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 text-sm">
                <p className="truncate font-medium">{selectedFile.name}</p>
                <p className="text-muted-foreground">
                  {Math.round(selectedFile.size / 1024)} KB ready to upload
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isUploading}
                  onClick={clearSelectedFile}
                >
                  Clear
                </Button>
                <Button type="button" disabled={isUploading} onClick={saveAvatar}>
                  {isUploading && <Loader2 className="animate-spin" />}
                  Save Picture
                </Button>
              </div>
            </div>
          )}
          {isUploading && (
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div className="h-full w-2/3 animate-pulse rounded-full bg-primary" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function PersonalInformationSection({ profile, email, onProfileChange }) {
  const router = useRouter();
  const form = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      first_name: profile?.first_name || "",
      last_name: profile?.last_name || "",
      mobile_number: profile?.mobile_number || "",
    },
  });

  useEffect(() => {
    form.reset({
      first_name: profile?.first_name || "",
      last_name: profile?.last_name || "",
      mobile_number: profile?.mobile_number || "",
    });
  }, [form, profile]);

  async function onSubmit(values) {
    try {
      const nextProfile = await updateCurrentUserProfile(values);
      onProfileChange(nextProfile);
      notify.success("Profile updated");
      router.refresh();
    } catch (error) {
      notify.error(error.message || "Could not update profile.");
    }
  }

  return (
    <Card className="rounded-md">
      <CardHeader>
        <CardTitle>Personal Information</CardTitle>
        <CardDescription>
          Keep your identity and contact details accurate for goal workflows.
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
          <div className="flex justify-end border-t pt-5">
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting && <Loader2 className="animate-spin" />}
              Save Information
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function PasswordStrengthMeter({ password }) {
  const checks = passwordStrengthChecks(password);
  const score = passwordStrengthScore(password);

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-4 gap-1">
        {checks.map((check, index) => (
          <div
            key={check.id}
            className={cn(
              "h-1.5 rounded-full bg-muted transition-colors",
              index < score && score < 4 && "bg-amber-500",
              index < score && score === 4 && "bg-green-600",
            )}
          />
        ))}
      </div>
      <div className="grid gap-1 sm:grid-cols-2">
        {checks.map((check) => (
          <p
            key={check.id}
            className={cn(
              "flex items-center gap-1 text-xs text-muted-foreground",
              check.passed && "text-green-700",
            )}
          >
            <CheckCircle2 className="size-3" />
            {check.label}
          </p>
        ))}
      </div>
    </div>
  );
}

function SecuritySection({ user, accountInfo }) {
  const router = useRouter();
  const email = user?.email || "";
  const [isSendingReset, setIsSendingReset] = useState(false);
  const providers = accountInfo?.providers || [];
  const hasPassword = Boolean(accountInfo?.passwordConfigured);
  const oauthOnly = providers.length > 0 && !hasPassword;
  const form = useForm({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });
  const newPassword =
    useWatch({
      control: form.control,
      name: "newPassword",
    }) || "";

  async function sendResetEmail() {
    const supabase = createBrowserSupabaseClient();

    if (!supabase) {
      notify.error("Add Supabase URL and anon key to your environment first.");
      return;
    }

    try {
      setIsSendingReset(true);
      const redirectTo = `${window.location.origin}/auth/callback?next=/reset-password`;
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });

      if (error) throw error;
      notify.success("Password reset email sent");
    } catch (error) {
      notify.error(error.message || "Could not send reset email.");
    } finally {
      setIsSendingReset(false);
    }
  }

  async function onSubmit(values) {
    const supabase = createBrowserSupabaseClient();

    if (!supabase) {
      notify.error("Add Supabase URL and anon key to your environment first.");
      return;
    }

    try {
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email,
        password: values.currentPassword,
      });

      if (verifyError) {
        form.setError("currentPassword", {
          message: "Current password is incorrect.",
        });
        return;
      }

      const { error } = await supabase.auth.updateUser({
        password: values.newPassword,
      });

      if (error) throw error;
      form.reset();
      notify.success("Password updated");
      router.refresh();
    } catch (error) {
      notify.error(error.message || "Could not update password.");
    }
  }

  return (
    <Card className="rounded-md">
      <CardHeader>
        <CardTitle>Security</CardTitle>
        <CardDescription>
          Manage password access and recovery for this account.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="rounded-md border bg-muted/25 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <ShieldCheck className="size-4 text-muted-foreground" />
            <span className="text-sm font-medium">Sign-in methods</span>
            {providers.length > 0 ? (
              providers.map((provider) => (
                <Badge key={provider} variant="secondary">
                  {providerLabel(provider)}
                </Badge>
              ))
            ) : (
              <Badge variant="secondary">Email/password</Badge>
            )}
          </div>
          {oauthOnly && (
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              This account currently signs in through Google. Password login may
              not apply unless you create one through a secure reset email.
            </p>
          )}
          <p className="mt-3 text-xs text-muted-foreground">
            Password reset emails are protected by Supabase rate limits.
          </p>
        </div>

        {hasPassword ? (
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)} noValidate>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  autoComplete="current-password"
                  aria-invalid={Boolean(form.formState.errors.currentPassword)}
                  {...form.register("currentPassword")}
                />
                {form.formState.errors.currentPassword && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.currentPassword.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">New password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  autoComplete="new-password"
                  aria-invalid={Boolean(form.formState.errors.newPassword)}
                  {...form.register("newPassword")}
                />
                {form.formState.errors.newPassword && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.newPassword.message}
                  </p>
                )}
              </div>
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
            </div>
            <PasswordStrengthMeter password={newPassword} />
            <div className="flex flex-col gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
              <Button
                type="button"
                variant="outline"
                disabled={isSendingReset || form.formState.isSubmitting}
                onClick={sendResetEmail}
              >
                {isSendingReset && <Loader2 className="animate-spin" />}
                Send Reset Email
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="animate-spin" />}
                Change Password
              </Button>
            </div>
          </form>
        ) : (
          <div className="flex flex-col gap-3 rounded-md border p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium">Password login is not configured</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Send a secure email link to create or reset password access.
              </p>
            </div>
            <Button type="button" disabled={isSendingReset} onClick={sendResetEmail}>
              {isSendingReset && <Loader2 className="animate-spin" />}
              Send Setup Email
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function NotificationPreferencesSection({ profile, onProfileChange }) {
  const router = useRouter();
  const [preferences, setPreferences] = useState(() =>
    preferencesFromProfile(profile),
  );
  const [isSaving, setIsSaving] = useState(false);

  function updatePreference(key, checked) {
    setPreferences((current) => ({
      ...current,
      [key]: Boolean(checked),
    }));
  }

  async function savePreferences() {
    try {
      setIsSaving(true);
      const nextProfile = await updateCurrentUserProfilePreferences(preferences);
      onProfileChange(nextProfile);
      notify.success("Notification preferences updated");
      router.refresh();
    } catch (error) {
      notify.error(error.message || "Could not update notification preferences.");
    } finally {
      setIsSaving(false);
    }
  }

  const options = [
    {
      key: "goalUpdates",
      label: "Goal status updates",
      description: "Submission, approval, rework, and unlock notifications.",
    },
    {
      key: "approvalAlerts",
      label: "Approval alerts",
      description: "Manager review reminders and employee submission alerts.",
    },
    {
      key: "checkinReminders",
      label: "Check-in reminders",
      description: "Quarterly progress reminders and feedback notifications.",
    },
    {
      key: "weeklyDigest",
      label: "Weekly digest",
      description: "A lightweight summary of performance workflow activity.",
    },
  ];

  return (
    <Card className="rounded-md">
      <CardHeader>
        <CardTitle>Notification Preferences</CardTitle>
        <CardDescription>
          Choose the profile-level alerts you want emphasized in the portal.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          {options.map((option) => (
            <label
              key={option.key}
              className="flex cursor-pointer gap-3 rounded-md border p-4 transition-colors hover:bg-muted/30"
            >
              <Checkbox
                checked={preferences[option.key]}
                onCheckedChange={(checked) =>
                  updatePreference(option.key, checked)
                }
              />
              <span className="space-y-1">
                <span className="block text-sm font-medium">{option.label}</span>
                <span className="block text-sm leading-5 text-muted-foreground">
                  {option.description}
                </span>
              </span>
            </label>
          ))}
        </div>
        <div className="flex justify-end border-t pt-4">
          <Button type="button" disabled={isSaving} onClick={savePreferences}>
            {isSaving && <Loader2 className="animate-spin" />}
            Save Preferences
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function AccountInfoCard({ profile, user, accountInfo }) {
  const email = user?.email || "";
  const displayName = getProfileDisplayName(profile, email);

  const rows = [
    {
      icon: Mail,
      label: "Email",
      value: email,
    },
    {
      icon: ShieldCheck,
      label: "Role",
      value: accountInfo?.roleLabel || "Employee",
    },
    {
      icon: CalendarDays,
      label: "Joined",
      value: formatDate(user?.created_at || accountInfo?.createdAt),
    },
    {
      icon: KeyRound,
      label: "Password",
      value: accountInfo?.passwordConfigured ? "Configured" : "Not configured",
    },
  ];

  if (accountInfo?.managerName) {
    rows.push({
      icon: UserRound,
      label: "Manager",
      value: accountInfo.managerName,
    });
  }

  if (accountInfo?.teamSize != null) {
    rows.push({
      icon: Users,
      label: "Team size",
      value: `${accountInfo.teamSize} employee${accountInfo.teamSize === 1 ? "" : "s"}`,
    });
  }

  return (
    <Card className="rounded-md">
      <CardHeader className="items-center text-center">
        <UserAvatar profile={profile} email={email} size="xl" priority />
        <div>
          <CardTitle>{displayName}</CardTitle>
          <CardDescription className="mt-1 break-all">{email}</CardDescription>
        </div>
        <Badge variant="secondary">{accountInfo?.roleLabel || "Employee"}</Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <Separator />
        <div className="space-y-3 text-sm">
          {rows.map((row) => {
            const Icon = row.icon;
            return (
              <div key={row.label} className="flex items-start gap-3">
                <Icon className="mt-0.5 size-4 text-muted-foreground" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">{row.label}</p>
                  <p className="truncate font-medium">{row.value}</p>
                </div>
              </div>
            );
          })}
          <div className="flex items-start gap-3">
            <Smartphone className="mt-0.5 size-4 text-muted-foreground" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Mobile</p>
              <p className="truncate font-medium">
                {profile?.mobile_number || "Not added"}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function ProfileForm({ initialProfile, user, accountInfo }) {
  const email = user?.email || "";
  const [profile, setProfile] = useState(initialProfile);

  const handleRealtimeProfileChange = useCallback((payload) => {
    if (payload?.new) {
      setProfile(payload.new);
    }
  }, []);

  useRealtimeSubscription({
    table: "profiles",
    filter: user?.id ? `user_id=eq.${user.id}` : undefined,
    onChange: user?.id ? handleRealtimeProfileChange : undefined,
  });

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-6">
        <PersonalInformationSection
          profile={profile}
          email={email}
          onProfileChange={setProfile}
        />
        <ProfilePictureSection
          profile={profile}
          email={email}
          onProfileChange={setProfile}
        />
        <SecuritySection user={user} accountInfo={accountInfo} />
        <NotificationPreferencesSection
          key={profile?.updated_at || profile?.id || "preferences"}
          profile={profile}
          onProfileChange={setProfile}
        />
      </div>
      <aside className="space-y-6 xl:sticky xl:top-20 xl:self-start">
        <AccountInfoCard profile={profile} user={user} accountInfo={accountInfo} />
        <CompletionCard profile={profile} accountInfo={accountInfo} />
      </aside>
    </div>
  );
}
