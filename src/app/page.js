import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  ClipboardCheck,
  FileText,
  ShieldCheck,
  Target,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const workflows = [
  {
    title: "Employees",
    description: "Create goal sheets, submit for approval, and update quarterly progress.",
    icon: Target,
  },
  {
    title: "Managers",
    description: "Review team goals, manage approvals, and coach progress through check-ins.",
    icon: ClipboardCheck,
  },
  {
    title: "Admins",
    description: "Configure cycles, manage hierarchy, monitor completion, and audit activity.",
    icon: ShieldCheck,
  },
];

const features = [
  {
    title: "Role-aware workspaces",
    description: "Each role lands in the workflow modules that match their responsibilities.",
    icon: Users,
  },
  {
    title: "Approval continuity",
    description: "Goal submissions, rework notes, locks, and unlocks stay connected.",
    icon: BadgeCheck,
  },
  {
    title: "Completion metrics",
    description: "Leaders can track participation, approval health, and cycle progress.",
    icon: BarChart3,
  },
  {
    title: "Audit activity",
    description: "Important goal workflow events remain visible for governance.",
    icon: FileText,
  },
];

function ProductPreview() {
  return (
    <div className="pointer-events-none relative mt-10 rounded-md border bg-background/90 p-3 shadow-xl lg:absolute lg:inset-x-4 lg:bottom-0 lg:mt-0 lg:translate-y-12 lg:p-4">
      <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
        <div className="space-y-2 border-r pr-4">
          {["Dashboard", "My Goals", "Check-ins", "Approvals"].map((item, index) => (
            <div
              key={item}
              className={`h-9 rounded-md border px-3 py-2 text-xs font-medium ${
                index === 0 ? "bg-accent text-accent-foreground" : "bg-muted/50"
              }`}
            >
              {item}
            </div>
          ))}
        </div>
        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-4">
            {["Cycle completion", "Pending approvals", "Check-ins", "Audit events"].map(
              (label, index) => (
                <div key={label} className="rounded-md border bg-card p-3">
                  <p className="text-[11px] text-muted-foreground">{label}</p>
                  <p className="mt-2 text-xl font-semibold">
                    {["84%", "12", "67%", "128"][index]}
                  </p>
                </div>
              ),
            )}
          </div>
          <div className="rounded-md border bg-card">
            {["Goal submitted", "Manager feedback added", "Q2 check-in submitted"].map(
              (item) => (
                <div key={item} className="flex items-center justify-between border-b px-4 py-3 last:border-b-0">
                  <span className="text-sm font-medium">{item}</span>
                  <span className="text-xs text-muted-foreground">Today</span>
                </div>
              ),
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <main className="min-h-dvh bg-background">
      <header className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="flex size-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <BadgeCheck className="size-5" />
          </span>
          AtomQuest Goals
        </Link>
        <nav className="flex items-center gap-2">
          <Button asChild variant="ghost">
            <Link href="/login">Login</Link>
          </Button>
          <Button asChild>
            <Link href="/signup">Get Started</Link>
          </Button>
        </nav>
      </header>

      <section className="relative isolate overflow-hidden border-y bg-muted/30">
        <div className="absolute inset-x-0 bottom-0 h-28 bg-background" />
        <div className="relative mx-auto max-w-7xl px-4 py-16 md:px-6 lg:min-h-[620px] lg:py-24">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase text-primary">
              Enterprise goal setting and tracking
            </p>
            <h1 className="mt-5 text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
              AtomQuest Goal Setting Portal
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
              A focused performance workflow for setting goals, approving plans,
              capturing check-ins, and monitoring cycle completion across the organization.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/signup">
                  Get Started
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/login">Login</Link>
              </Button>
            </div>
          </div>
          <ProductPreview />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 md:px-6">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-semibold tracking-tight">Why Goal Tracking Matters</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Clear goals help employees understand expectations, give managers a
            reliable review workflow, and give HR teams visibility into cycle health.
          </p>
        </div>
      </section>

      <section className="border-y bg-muted/25">
        <div className="mx-auto max-w-7xl px-4 py-16 md:px-6">
          <div className="grid gap-4 md:grid-cols-3">
            {workflows.map((workflow) => {
              const Icon = workflow.icon;
              return (
                <Card key={workflow.title} className="rounded-md">
                  <CardHeader>
                    <div className="flex size-10 items-center justify-center rounded-md bg-accent text-accent-foreground">
                      <Icon className="size-5" />
                    </div>
                    <CardTitle>{workflow.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-6 text-muted-foreground">
                      {workflow.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 md:px-6">
        <div className="mb-8 max-w-2xl">
          <h2 className="text-2xl font-semibold tracking-tight">Key Features</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Built around the performance management workflow, not a generic dashboard template.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card key={feature.title} className="rounded-md">
                <CardHeader>
                  <Icon className="size-5 text-primary" />
                  <CardTitle className="text-base">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-6 text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <footer className="border-t">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-8 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between md:px-6">
          <p>AtomQuest Goal Setting & Tracking Portal</p>
          <div className="flex gap-4">
            <Link href="/login" className="hover:text-foreground">Login</Link>
            <Link href="/signup" className="hover:text-foreground">Get Started</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
