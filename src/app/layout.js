import { AuthProvider } from "@/providers/auth-provider";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";
import { SpeedInsights } from "@vercel/speed-insights/next";


export const metadata = {
  title: "Nucleus Goal Setting Portal",
  description: "Enterprise goal setting, approval, and check-in workflow portal",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <body className="min-h-full bg-background text-foreground">
        <AuthProvider>
          {children}
          <Toaster />
          <SpeedInsights />
        </AuthProvider>
      </body>
    </html>
  );
}
