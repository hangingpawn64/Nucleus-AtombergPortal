import { AnalyticsChart } from "@/components/charts/analytics-chart";
import { StatsCard } from "@/components/dashboard/stats-card";
import { chartData, stats } from "@/constants/mock-data";

export const metadata = {
  title: "Admin | Portal Starter",
};

export default function AdminPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Admin</h1>
        <p className="text-sm text-muted-foreground">
          Foundation views for future admin workflows.
        </p>
      </div>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => (
          <StatsCard key={item.label} {...item} />
        ))}
      </section>
      <AnalyticsChart data={chartData} />
    </div>
  );
}
