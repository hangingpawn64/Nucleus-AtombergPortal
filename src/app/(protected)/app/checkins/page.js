import Link from "next/link";
import { BarChart3 } from "lucide-react";
import { EmployeeCheckinsClient } from "@/components/checkins/employee-checkins-client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ErrorState } from "@/components/empty-states/error-state";
import { getCurrentPortalUser } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { CheckinService } from "@/services/checkin.service";

export const metadata = {
  title: "My Check-ins | Nucleus Portal",
};

export default async function MyCheckinsPage() {
  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    return (
      <ErrorState
        title="Supabase is not configured"
        description="Connect Supabase before viewing check-ins."
      />
    );
  }

  const portalUser = await getCurrentPortalUser(supabase);

  if (portalUser?.role === "admin") {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Check-in Monitoring</h1>
          <p className="text-sm text-muted-foreground">
            Admins monitor completion and reporting instead of submitting operational check-ins.
          </p>
        </div>
        <Card className="rounded-md">
          <CardHeader>
            <div className="flex size-10 items-center justify-center rounded-md bg-muted">
              <BarChart3 className="size-5 text-muted-foreground" />
            </div>
            <CardTitle>Use oversight reports</CardTitle>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/app/reports">Open Reports</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { currentCycle, goalSheet } =
    await CheckinService.getEmployeeWorkspace(supabase);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">My Check-ins</h1>
        <p className="text-sm text-muted-foreground">
          Update progress against your approved goals and review manager feedback.
        </p>
      </div>
      <EmployeeCheckinsClient currentCycle={currentCycle} goalSheet={goalSheet} />
    </div>
  );
}
