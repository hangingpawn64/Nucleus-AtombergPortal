import { GoalReviewClient } from "@/components/goals/goal-review-client";
import { ErrorState } from "@/components/shared/error-state";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { GoalService } from "@/services/goal";

export const metadata = {
  title: "Goal Review | AtomQuest Portal",
};

export default async function GoalReviewPage({ params }) {
  const { sheetId } = await params;
  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    return (
      <ErrorState
        title="Supabase is not configured"
        description="Connect Supabase before reviewing goal sheets."
      />
    );
  }

  const sheet = await GoalService.getGoalSheetById(sheetId, supabase);

  if (!sheet) {
    return (
      <ErrorState
        title="Goal sheet not found"
        description="This sheet is unavailable or you do not have access to it."
      />
    );
  }

  return <GoalReviewClient sheet={sheet} />;
}
