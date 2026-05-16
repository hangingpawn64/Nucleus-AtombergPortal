import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ErrorState } from "@/components/shared/error-state";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { listActivityLogs } from "@/services/activity";
import { GoalService } from "@/services/goal";
import { UserService } from "@/services/users";

export const metadata = {
  title: "Admin | AtomQuest Portal",
};

function percent(value, total) {
  if (!total) return "0%";
  return `${Math.round((value / total) * 100)}%`;
}

export default async function AdminPage() {
  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    return (
      <ErrorState
        title="Supabase is not configured"
        description="Connect Supabase before viewing the admin dashboard."
      />
    );
  }

  const [users, sheets, activity] = await Promise.all([
    UserService.listUsersForAdmin(supabase),
    GoalService.getAllGoalSheets({}, supabase),
    listActivityLogs({ limit: 10 }, supabase),
  ]);
  const employees = users.filter((user) => user.role === "employee");
  const approved = sheets.filter((sheet) => sheet.status === "approved").length;
  const submitted = sheets.filter((sheet) => sheet.status === "submitted").length;
  const withSheet = new Set(sheets.map((sheet) => sheet.employee_id)).size;

  const cards = [
    {
      label: "Cycle completion",
      value: percent(approved, employees.length),
      helper: `${approved} approved sheets`,
    },
    {
      label: "Participation",
      value: percent(withSheet, employees.length),
      helper: `${withSheet} employees started`,
    },
    {
      label: "Pending approval",
      value: submitted,
      helper: "Submitted to managers",
    },
    {
      label: "Audit events",
      value: activity.length,
      helper: "Recent workflow events",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Admin</h1>
        <p className="text-sm text-muted-foreground">
          HR oversight for users, cycles, approvals, and audit activity.
        </p>
      </div>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
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
    </div>
  );
}
