import { Suspense } from "react";
import { AuthForm } from "@/components/forms/auth-form";
import { LoadingSkeleton } from "@/components/loaders/loading-skeleton";

export const metadata = {
  title: "Login | Nucleus Portal",
};

export default function LoginPage() {
  return (
    <Suspense fallback={<LoadingSkeleton className="w-full max-w-md" rows={5} />}>
      <AuthForm mode="login" />
    </Suspense>
  );
}
