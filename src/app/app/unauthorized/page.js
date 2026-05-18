import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata = {
  title: "Unauthorized | Nucleus Portal",
};

export default async function UnauthorizedPage({ searchParams }) {
  const params = await searchParams;
  const attemptedPath = params?.from;

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="w-full max-w-xl rounded-md">
        <CardHeader>
          <div className="flex size-10 items-center justify-center rounded-md bg-destructive/10 text-destructive">
            <ShieldAlert className="size-5" />
          </div>
          <CardTitle>Access restricted</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm leading-6 text-muted-foreground">
            This area is limited to a different workflow role. Your workspace
            navigation only shows the modules available to your current role.
          </p>
          {attemptedPath && (
            <p className="rounded-md border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
              Requested route: {attemptedPath}
            </p>
          )}
          <Button asChild>
            <Link href="/app/dashboard">Back to dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
