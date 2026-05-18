import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ErrorState } from "@/components/shared/error-state";
import { EmptyState } from "@/components/shared/empty-state";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/utils";
import { listNotifications } from "@/services/notifications";

export const metadata = {
  title: "Notifications | Nucleus Portal",
};

export default async function NotificationsPage() {
  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    return (
      <ErrorState
        title="Supabase is not configured"
        description="Connect Supabase before viewing notifications."
      />
    );
  }

  const notifications = await listNotifications(null, supabase);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Notifications</h1>
        <p className="text-sm text-muted-foreground">
          Submission, approval, rework, and unlock updates.
        </p>
      </div>
      {notifications.length === 0 ? (
        <EmptyState
          title="No notifications"
          description="Workflow alerts will appear here when goal sheets move through approval."
        />
      ) : (
        <div className="grid gap-3">
          {notifications.map((notification) => (
            <Card key={notification.id} className="rounded-md">
              <CardHeader>
                <CardTitle className="text-base">{notification.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {notification.body && (
                  <p className="text-sm leading-6">{notification.body}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  {formatDateTime(notification.created_at)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
