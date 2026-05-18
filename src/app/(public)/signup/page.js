import { Suspense } from "react";
import { AuthForm } from "@/components/forms/auth-form";
import { LoadingSkeleton } from "@/components/loaders/loading-skeleton";

export const metadata = {
  title: "Signup | Nucleus Portal",
};

export default function SignupPage() {
  return (
    <Suspense fallback={<LoadingSkeleton className="w-full max-w-md" rows={6} />}>
      <AuthForm mode="signup" />
    </Suspense>
  );
}
