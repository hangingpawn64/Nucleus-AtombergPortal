import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { StatsCard } from "@/components/dashboard/stats-card";
import { AnalyticsChart } from "@/components/charts/analytics-chart";
import { activityFeed, chartData, stats } from "@/constants/mock-data";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Reusable portal shell ready for the problem statement.
        </p>
      </div>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => (
          <StatsCard key={item.label} {...item} />
        ))}
      </section>
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <AnalyticsChart data={chartData} />
        <ActivityFeed items={activityFeed} />
      </section>
    </div>
  );
}
