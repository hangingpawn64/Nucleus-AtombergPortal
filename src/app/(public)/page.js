import Link from "next/link";
import {
  BadgeCheck,
  Clock,
  Check,
  TrendingUp,
  Target,
  Compass,
  ArrowRight,
} from "lucide-react";

export default function HomePage() {
  return (
    <main className="h-screen w-screen max-h-screen overflow-hidden p-3 md:p-4 bg-background flex flex-col transition-colors duration-500 font-sans">
      {/* Main Canvas Card */}
      <div className="flex-1 w-full bg-card rounded-[2.5rem] border border-border shadow-[0_20px_50px_rgba(0,0,0,0.03)] flex flex-col relative overflow-hidden bg-grid-dots">
        
        {/* Floating Background Accent Gradients */}
        <div className="absolute top-1/4 left-1/4 size-96 rounded-full bg-[#66f4ff]/10 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 size-96 rounded-full bg-[#66c4ff]/10 blur-[120px] pointer-events-none" />

        {/* ---------------- FLOATERS (Hidden on smaller screens, fits perfectly on laptops/desktops) ---------------- */}

        {/* Top-Left Floater: Sticky Note + Floating Check */}
        <div className="absolute top-20 left-10 hidden xl:flex items-start gap-4 z-10 select-none animate-[bounce_5s_ease-in-out_infinite]">
          {/* Yellow sticky card */}
          <div className="bg-[#fef08a] text-slate-800 p-5 rounded-sm shadow-[0_10px_25px_rgba(234,179,8,0.15)] w-48 -rotate-3 border-t-[6px] border-[#facc15] font-sans">
            <p className="text-[11px] leading-relaxed font-semibold">
              Set goals to keep track of crucial progress, and align with your team effortlessly.
            </p>
          </div>
          {/* 3D Checkbox card */}
          <div className="bg-white dark:bg-slate-800 shadow-[0_15px_30px_rgba(0,0,0,0.05)] border border-slate-100 dark:border-slate-700/60 rounded-2xl p-3.5 size-14 flex items-center justify-center rotate-6 mt-6">
            <span className="flex size-7 items-center justify-center rounded-lg bg-gradient-brand text-slate-900 shadow-sm">
              <Check className="size-4 stroke-[3px]" />
            </span>
          </div>
        </div>

        {/* Top-Right Floater: Reminders + Floating Clock */}
        <div className="absolute top-20 right-10 hidden xl:flex items-start gap-4 z-10 select-none animate-[bounce_6s_ease-in-out_infinite_0.5s]">
          {/* Alarm Clock Card */}
          <div className="bg-white dark:bg-slate-800 shadow-[0_15px_30px_rgba(0,0,0,0.05)] border border-slate-100 dark:border-slate-700/60 rounded-2xl p-3.5 size-14 flex items-center justify-center -rotate-12 mt-6">
            <Clock className="size-6 text-[#66c4ff] animate-pulse" />
          </div>
          {/* Reminders Card */}
          <div className="bg-white dark:bg-slate-800 border border-border shadow-[0_15px_30px_rgba(0,0,0,0.05)] rounded-2xl p-4 w-52 rotate-2">
            <div className="flex items-center gap-2 mb-2">
              <span className="size-2 rounded-full bg-emerald-500" />
              <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Reminders</p>
            </div>
            <p className="text-xs font-bold text-foreground truncate">Today&apos;s Check-in</p>
            <p className="text-[10px] text-muted-foreground truncate mb-2">Goal Cycle alignment review</p>
            <span className="inline-flex items-center rounded-full bg-[#66c4ff]/10 dark:bg-[#66c4ff]/20 px-2 py-0.5 text-[9px] font-semibold text-[#007399] dark:text-[#66c4ff]">
              14:00 - 14:30
            </span>
          </div>
        </div>

        {/* Bottom-Left Floater: Goal Progress Card */}
        <div className="absolute bottom-16 left-12 hidden xl:block z-10 select-none animate-[bounce_5.5s_ease-in-out_infinite_0.3s]">
          <div className="bg-white dark:bg-slate-800 border border-border shadow-[0_20px_40px_rgba(0,0,0,0.06)] rounded-2xl p-5 w-60 rotate-2">
            <div className="flex items-center justify-between mb-3.5">
              <p className="text-xs font-bold text-foreground">Active Goals</p>
              <TrendingUp className="size-4 text-emerald-500" />
            </div>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-[10px] font-semibold mb-1">
                  <span className="text-muted-foreground truncate max-w-32">Q2 Growth Campaign</span>
                  <span className="text-foreground">60%</span>
                </div>
                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-brand rounded-full" style={{ width: "60%" }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[10px] font-semibold mb-1">
                  <span className="text-muted-foreground truncate max-w-32">System Reliability v2</span>
                  <span className="text-foreground">85%</span>
                </div>
                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-brand rounded-full" style={{ width: "85%" }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom-Right Floater: Modules / Integrations */}
        <div className="absolute bottom-16 right-12 hidden xl:block z-10 select-none animate-[bounce_6.5s_ease-in-out_infinite_0.8s]">
          <div className="bg-white dark:bg-slate-800 border border-border shadow-[0_20px_40px_rgba(0,0,0,0.06)] rounded-2xl p-4 w-52 -rotate-2">
            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-2.5">Goal Modules</p>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-slate-50 dark:bg-slate-900 border border-border size-12 rounded-xl flex items-center justify-center shadow-sm">
                <Target className="size-5 text-[#007399] dark:text-[#66c4ff]" />
              </div>
              <div className="bg-slate-50 dark:bg-slate-900 border border-border size-12 rounded-xl flex items-center justify-center shadow-sm">
                <Compass className="size-5 text-amber-500" />
              </div>
              <div className="bg-slate-50 dark:bg-slate-900 border border-border size-12 rounded-xl flex items-center justify-center shadow-sm">
                <BadgeCheck className="size-5 text-emerald-500" />
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground mt-2 text-center font-medium">Role-based modules enabled</p>
          </div>
        </div>

        {/* ---------------- HEADER ---------------- */}
        <header className="h-20 px-6 md:px-12 flex items-center justify-between border-b border-border/50 relative z-30 select-none">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <img src="/favicon.ico" alt="Nucleus Logo" className="size-5 transition-transform group-hover:rotate-12 duration-300" />
            <span className="font-bold text-lg tracking-tight text-foreground">Nucleus</span>
          </Link>

          {/* Action CTAs */}
          <div className="flex items-center gap-4 select-none">
            <Link href="/login" className="text-sm font-semibold text-foreground hover:text-[#007399] dark:hover:text-[#66c4ff] transition-colors">
              Sign in
            </Link>
            <Link href="/signup" className="hidden sm:inline-flex px-4.5 py-2 border border-border text-foreground hover:bg-muted font-bold text-xs rounded-full transition-all">
              Get started
            </Link>
          </div>
        </header>

        {/* ---------------- CENTERED HERO SECTION ---------------- */}
        <div className="flex-1 flex flex-col justify-center items-center text-center max-w-4xl mx-auto px-6 relative z-20">
          
          {/* Centered 3D Squircle Logo */}
          <div className="flex size-16 items-center justify-center rounded-[1.25rem] bg-card text-card-foreground shadow-[0_12px_35px_rgba(0,0,0,0.06)] border mb-6.5 transition-all transform hover:scale-105 duration-300">
            <img src="/favicon.ico" alt="Nucleus Logo" className="size-8" />
          </div>

          {/* Heading Title (Think, plan, track style) */}
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-foreground leading-[1.12] mb-4.5">
            Set, track, and achieve<br />
            <span className="text-slate-400 dark:text-slate-500 font-semibold">all in one place</span>
          </h1>

          {/* Subtitle Description */}
          <p className="text-sm md:text-base text-muted-foreground max-w-lg mb-8 leading-relaxed font-medium">
            An elegant, role-aware workflow for configuring goal sheets, managing check-ins, and monitoring cycle progress across the organization.
          </p>

          {/* Core Call to Actions */}
          <div className="flex items-center gap-3.5 select-none">
            <Link href="/signup" className="px-7 py-3 rounded-full bg-gradient-brand text-slate-900 hover:text-slate-950 font-bold text-sm shadow-[0_4px_20px_rgba(102,244,255,0.25)] hover:shadow-[0_6px_25px_rgba(102,244,255,0.4)] transition-all transform hover:-translate-y-0.5 flex items-center gap-2 group">
              Get Started for Free
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1 duration-200" />
            </Link>
          </div>
        </div>

        {/* ---------------- FOOTER ---------------- */}
        <footer className="h-14 px-6 md:px-12 flex items-center justify-between border-t border-border/50 text-[10px] text-muted-foreground font-semibold relative z-30 select-none">
          <p>Nucleus Goal Setting & Tracking Portal</p>
          <div className="flex gap-6">
            <Link href="/login" className="hover:text-foreground transition-colors">Workspace Login</Link>
            <p>© 2026 Nucleus, Inc.</p>
          </div>
        </footer>

      </div>
    </main>
  );
}
