import { redirect } from "next/navigation";

export default function SettingsRedirectPage() {
  redirect("/app/profile");
}
