import { Settings } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata = {
  title: "Settings | Portal Starter",
};

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Account and workspace preferences will live here.
        </p>
      </div>
      <Card>
        <CardHeader>
          <div className="flex size-10 items-center justify-center rounded-md bg-muted">
            <Settings className="size-5 text-muted-foreground" />
          </div>
          <CardTitle>Settings placeholder</CardTitle>
          <CardDescription>
            This route is wired for navigation without adding domain-specific settings yet.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Add reusable preferences here when the portal needs them.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
