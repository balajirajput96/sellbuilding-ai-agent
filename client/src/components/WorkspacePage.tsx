import DashboardLayout from "@/components/DashboardLayout";
import { Sparkles } from "lucide-react";
import type { ReactNode } from "react";

export function WorkspacePage({ eyebrow, title, description, action, children }: { eyebrow: string; title: string; description: string; action?: ReactNode; children: ReactNode }) {
  return (
    <DashboardLayout>
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-7">
        <header className="flex flex-col justify-between gap-5 border-b border-border/70 pb-6 sm:flex-row sm:items-end">
          <div className="min-w-0">
            <div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-primary"><Sparkles className="size-3.5" /> {eyebrow}</div>
            <h1 className="text-3xl font-bold tracking-[-0.045em] text-foreground sm:text-[2.15rem]">{title}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </header>
        {children}
      </div>
    </DashboardLayout>
  );
}
