import { AuthProvider } from "@/components/shared/auth-provider";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";
import { SpeedInsights } from "@vercel/speed-insights/next";


export const metadata = {
  title: "Portal Starter",
  description: "Reusable hackathon-ready portal foundation",
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
