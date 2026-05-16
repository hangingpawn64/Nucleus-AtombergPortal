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
import { normalizeRole } from "@/lib/auth/roles";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { GoalService } from "@/services/goal";
import { UserService } from "@/services/users";

function percent(value, total) {
  if (!total) return "0%";
  return `${Math.round((value / total) * 100)}%`;
}

function SummaryCard({ label, value, helper }) {
  return (
    <Card className="rounded-md">
      <CardHeader>
        <CardTitle className="text-sm text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-semibold">{value}</div>
        <p className="mt-2 text-sm text-muted-foreground">{helper}</p>
      </CardContent>
    </Card>
  );
}

async function getCurrentRole(supabase) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return "employee";

  const { data: userRow } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  return normalizeRole(userRow?.role);
}

async function EmployeeDashboard({ supabase }) {
  const currentCycle = await GoalService.getCurrentCycle(supabase);
  const goalSheet = currentCycle
    ? await GoalService.getMyGoalSheet(currentCycle.id, supabase)
    : null;
  const goals = goalSheet?.goals || [];
  const pendingAction =
    !goalSheet || goalSheet.status === "draft"
      ? "Create and submit goals"
      : goalSheet.status === "rework"
        ? "Update goals from manager feedback"
        : goalSheet.status === "submitted"
          ? "Waiting for manager approval"
          : "Approved";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Employee Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Current cycle status, pending actions, and goal summary.
        </p>
      </div>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Current cycle"
          value={currentCycle?.quarter || "None"}
          helper={currentCycle?.name || "No active cycle"}
        />
        <SummaryCard
          label="Submission status"
          value={<StatusBadge status={goalSheet?.status || "draft"} />}
          helper={pendingAction}
        />
        <SummaryCard
          label="Goals"
          value={goals.length}
          helper={`${goals.reduce((sum, goal) => sum + Number(goal.weightage || 0), 0)}% total weightage`}
        />
        <SummaryCard
          label="Pending action"
          value={goalSheet?.status === "approved" ? "Done" : "Open"}
          helper={pendingAction}
        />
      </section>
      <Card className="rounded-md">
        <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold">My goal sheet</h2>
            <p className="text-sm text-muted-foreground">
              View feedback, edit drafts, or resubmit returned goals.
            </p>
          </div>
          <Button asChild>
            <Link href="/dashboard/goals">
              Open Goals
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

async function ManagerDashboard({ supabase }) {
  const sheets = await GoalService.getTeamGoalSheets({}, supabase);
  const submitted = sheets.filter((sheet) => sheet.status === "submitted").length;
  const rework = sheets.filter((sheet) => sheet.status === "rework").length;
  const approved = sheets.filter((sheet) => sheet.status === "approved").length;
  const teamMembers = new Set(sheets.map((sheet) => sheet.employee_id)).size;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Manager Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Pending approvals, returned work, and team goal coverage.
        </p>
      </div>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Pending approvals" value={submitted} helper="Submitted sheets waiting for review" />
        <SummaryCard label="Rework count" value={rework} helper="Returned to employees" />
        <SummaryCard label="Approved" value={approved} helper="Locked after approval" />
        <SummaryCard label="Team overview" value={teamMembers} helper="Assigned employees with sheets" />
      </section>
      <Card className="rounded-md">
        <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold">Approval queue</h2>
            <p className="text-sm text-muted-foreground">
              Open submitted sheets and record approval or rework notes.
            </p>
          </div>
          <Button asChild>
            <Link href="/dashboard/approvals">
              Review Approvals
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

async function AdminDashboard({ supabase }) {
  const [users, sheets] = await Promise.all([
    UserService.listUsersForAdmin(supabase),
    GoalService.getAllGoalSheets({}, supabase),
  ]);
  const employees = users.filter((user) => user.role === "employee");
  const started = new Set(sheets.map((sheet) => sheet.employee_id)).size;
  const approved = sheets.filter((sheet) => sheet.status === "approved").length;
  const submitted = sheets.filter((sheet) => sheet.status === "submitted").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Admin Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Cycle completion, employee participation, and approval health.
        </p>
      </div>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Cycle completion" value={percent(approved, employees.length)} helper={`${approved} approved sheets`} />
        <SummaryCard label="Participation" value={percent(started, employees.length)} helper={`${started} of ${employees.length} employees`} />
        <SummaryCard label="Pending approval" value={submitted} helper="Manager action needed" />
        <SummaryCard label="Users" value={users.length} helper="Active portal accounts" />
      </section>
      <Card className="rounded-md">
        <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold">Admin controls</h2>
            <p className="text-sm text-muted-foreground">
              Manage users, reporting lines, cycles, and locked sheets.
            </p>
          </div>
          <Button asChild>
            <Link href="/dashboard/admin/goals">
              Open All Goals
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    return (
      <ErrorState
        title="Supabase is not configured"
        description="Connect Supabase before viewing the dashboard."
      />
    );
  }

  const role = await getCurrentRole(supabase);

  if (role === "admin") return <AdminDashboard supabase={supabase} />;
  if (role === "manager") return <ManagerDashboard supabase={supabase} />;
  return <EmployeeDashboard supabase={supabase} />;
}
