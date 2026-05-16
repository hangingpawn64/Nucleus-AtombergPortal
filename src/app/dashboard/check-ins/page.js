import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ErrorState } from "@/components/shared/error-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { GoalService } from "@/services/goal";

export const metadata = {
  title: "Check-ins | AtomQuest Portal",
};

export default async function CheckInsPage() {
  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    return (
      <ErrorState
        title="Supabase is not configured"
        description="Connect Supabase before viewing check-ins."
      />
    );
  }

  const currentCycle = await GoalService.getCurrentCycle(supabase);
  const goalSheet = currentCycle
    ? await GoalService.getMyGoalSheet(currentCycle.id, supabase)
    : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Check-ins</h1>
        <p className="text-sm text-muted-foreground">
          Quarterly achievement capture will use the approved goals from the active cycle.
        </p>
      </div>

      <Card className="rounded-md">
        <CardHeader>
          <CardTitle>Current cycle readiness</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-muted-foreground">Goal sheet status</span>
            <StatusBadge status={goalSheet?.status || "draft"} />
          </div>
          <p className="text-sm leading-6 text-muted-foreground">
            Check-ins open after goals are approved and locked. Use this area to
            confirm whether your current sheet is ready for quarterly progress updates.
          </p>
          <Button asChild variant="outline">
            <Link href="/dashboard/goals">
              View Goals
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
