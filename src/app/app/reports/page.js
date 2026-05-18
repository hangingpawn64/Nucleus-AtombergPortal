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
import { UserService } from "@/services/users";

export const metadata = {
  title: "Reports | Nucleus Portal",
};

function percent(value, total) {
  if (!total) return "0%";
  return `${Math.round((value / total) * 100)}%`;
}

export default async function ReportsPage() {
  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    return (
      <ErrorState
        title="Supabase is not configured"
        description="Connect Supabase before viewing reports."
      />
    );
  }

  const [users, sheets] = await Promise.all([
    UserService.listUsersForAdmin(supabase),
    GoalService.getAllGoalSheets({}, supabase),
  ]);
  const employees = users.filter((user) => user.role === "employee");
  const submitted = sheets.filter((sheet) => sheet.status === "submitted").length;
  const approved = sheets.filter((sheet) => sheet.status === "approved").length;
  const rework = sheets.filter((sheet) => sheet.status === "rework").length;
  const startedEmployees = new Set(sheets.map((sheet) => sheet.employee_id)).size;

  const reportCards = [
    {
      label: "Employee participation",
      value: percent(startedEmployees, employees.length),
      helper: `${startedEmployees} of ${employees.length} employees have a sheet`,
    },
    {
      label: "Approval rate",
      value: percent(approved, sheets.length),
      helper: `${approved} approved of ${sheets.length} sheets`,
    },
    {
      label: "Pending approvals",
      value: submitted,
      helper: "Submitted sheets waiting for manager action",
    },
    {
      label: "Rework requests",
      value: rework,
      helper: "Sheets currently returned to employees",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
        <p className="text-sm text-muted-foreground">
          Lightweight completion and approval health for the active portal workflow.
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {reportCards.map((card) => (
          <Card key={card.label} className="rounded-md">
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">{card.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">{card.value}</p>
              <p className="mt-2 text-sm text-muted-foreground">{card.helper}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <Card className="rounded-md">
        <CardHeader>
          <CardTitle>Approval Statistics</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-4">
          {["draft", "submitted", "rework", "approved"].map((status) => (
            <div key={status} className="rounded-md border p-4">
              <StatusBadge status={status} />
              <p className="mt-3 text-2xl font-semibold">
                {sheets.filter((sheet) => sheet.status === status).length}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
