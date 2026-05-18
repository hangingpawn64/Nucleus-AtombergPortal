import Link from "next/link";

export default function AuthLayout({ children }) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-background bg-grid-dots px-4 py-10 relative overflow-hidden select-none">
      {/* Brand logo at the top */}
      <Link href="/" className="flex items-center gap-3 mb-8 group relative z-10">
        <div className="grid grid-cols-2 gap-1.5 size-5 transition-transform group-hover:rotate-12 duration-300">
          <span className="size-2 rounded-full bg-[#66f4ff] dark:bg-[#66c4ff]" />
          <span className="size-2 rounded-full bg-slate-900 dark:bg-slate-100/90" />
          <span className="size-2 rounded-full bg-slate-900 dark:bg-slate-100/90" />
          <span className="size-2 rounded-full bg-slate-900 dark:bg-slate-100/90" />
          <span className="size-2 rounded-full bg-slate-900 dark:bg-slate-100/90" />
          <span className="size-2 rounded-full bg-slate-900 dark:bg-slate-100/90" />
        </div>
        <span className="font-bold text-xl tracking-tight text-foreground">Nucleus</span>
      </Link>
      
      {/* Centered card contents */}
      <div className="relative z-10 w-full max-w-md">
        {children}
      </div>

      {/* Decorative Blur Backgrounds */}
      <div className="absolute top-1/3 left-1/4 size-72 rounded-full bg-[#66f4ff]/5 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/4 size-72 rounded-full bg-[#66c4ff]/5 blur-[100px] pointer-events-none" />
    </main>
  );
}
