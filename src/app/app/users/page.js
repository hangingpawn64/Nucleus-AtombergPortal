import { UserManagementClient } from "@/components/admin/user-management-client";
import { ErrorState } from "@/components/shared/error-state";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { UserService } from "@/services/users";

export const metadata = {
  title: "Users | Nucleus Portal",
};

export default async function UsersPage() {
  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    return (
      <ErrorState
        title="Supabase is not configured"
        description="Connect Supabase before managing users."
      />
    );
  }

  const users = await UserService.listUsersForAdmin(supabase);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">User management</h1>
        <p className="text-sm text-muted-foreground">
          Assign employee, manager, and admin roles and maintain reporting lines.
        </p>
      </div>
      <UserManagementClient initialUsers={users} />
    </div>
  );
}
