import { AchievementReportsClient } from "@/components/reports/achievement-reports-client";
import { ErrorState } from "@/components/empty-states/error-state";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ReportService } from "@/services/report.service";

export const metadata = {
  title: "Achievement Reports | Nucleus Portal",
};

export default async function ReportsPage() {
  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    return (
      <ErrorState
        title="Supabase is not configured"
        description="Connect Supabase before viewing achievement reports."
      />
    );
  }

  const reportData = await ReportService.getAchievementReportData(supabase);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Achievement Reports
        </h1>
        <p className="text-sm text-muted-foreground">
          Compare planned targets with latest actual achievements across goals,
          cycles, and employees.
        </p>
      </div>

      <AchievementReportsClient
        rows={reportData.rows}
        filters={reportData.filters}
        currentUser={reportData.currentUser}
      />
    </div>
  );
}
