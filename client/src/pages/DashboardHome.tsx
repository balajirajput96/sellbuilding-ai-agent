import { WorkspacePage } from "@/components/WorkspacePage";
import { Button } from "@/components/ui/button";
import { formatDate, statusTone } from "@/lib/format";
import { trpc } from "@/lib/trpc";
import { ArrowRight, Bot, Image, Play, Workflow } from "lucide-react";
import { useLocation } from "wouter";

const tone = ["from-violet-500/20 to-violet-400/5", "from-sky-500/20 to-sky-400/5", "from-emerald-500/20 to-emerald-400/5"];

export default function DashboardHome() {
  const [, setLocation] = useLocation();
  const { data, isLoading, isError } = trpc.workspace.summary.useQuery();
  const runs = data?.runs ?? [];
  const cards = [
    { label: "AI task runs", value: runs.length, icon: Bot, tone: tone[0] },
    { label: "Generated images", value: data?.images.length ?? 0, icon: Image, tone: tone[1] },
    { label: "Active workflows", value: data?.workflowCount ?? 0, icon: Workflow, tone: tone[2] },
  ];
  const workflowRuns = runs.filter(run => run.type === "workflow");
  return <WorkspacePage eyebrow="Personal workspace" title="Make room for your best work." description="One calm surface for deep thinking, visual creation, and reliable automation." action={<Button onClick={() => setLocation("/ai-chat-agent")} className="gap-2 rounded-xl"><Bot className="size-4" /> Open AI Chat Agent</Button>}>
    <section className="grid gap-4 md:grid-cols-3">
      {cards.map(({ label, value, icon: Icon, tone: itemTone }) => <div key={label} className={`relative overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-br ${itemTone} p-5 shadow-lg shadow-black/10`}>
        <Icon className="absolute right-4 top-4 size-5 text-foreground/50" />
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="mt-5 text-3xl font-bold tracking-[-0.05em]">{isLoading || isError ? "—" : value}</p>
        <p className="mt-1 text-xs text-muted-foreground">{isError ? "Refresh to load workspace data" : "In your private workspace"}</p>
      </div>)}
    </section>
    <section className="grid gap-5 lg:grid-cols-[1.45fr_0.85fr]">
      <div className="rounded-2xl border bg-card/80 p-5 shadow-xl shadow-black/10">
        <div className="flex items-center justify-between"><div><h2 className="font-semibold tracking-tight">Recent activity</h2><p className="mt-1 text-sm text-muted-foreground">Your latest AI task runs and outputs.</p></div><Button variant="ghost" size="sm" onClick={() => setLocation("/task-history")} className="gap-1.5 text-muted-foreground">View history <ArrowRight className="size-3.5" /></Button></div>
        <div className="mt-5 divide-y divide-border/70">{isLoading ? [0, 1, 2].map(index => <div key={index} className="flex items-center gap-3 py-3.5"><div className="size-9 animate-pulse rounded-xl bg-muted" /><div className="flex-1 space-y-2"><div className="h-3 w-40 animate-pulse rounded bg-muted" /><div className="h-2.5 w-24 animate-pulse rounded bg-muted" /></div></div>) : isError ? <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-center text-xs text-destructive">Recent activity could not be loaded. Refresh to try again.</div> : runs.length ? runs.map(run => <div key={run.id} className="flex items-center gap-3 py-3.5"><div className="grid size-9 place-items-center rounded-xl bg-muted"><Play className="size-3.5 text-primary" /></div><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{run.title}</p><p className="mt-0.5 truncate text-xs text-muted-foreground">{run.type} · {formatDate(run.createdAt)}</p></div><span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold capitalize ${statusTone(run.status)}`}>{run.status}</span></div>) : <div className="py-12 text-center"><p className="text-sm font-medium">Your activity will appear here.</p><p className="mt-1 text-xs text-muted-foreground">Start a chat, generate an image, or run a workflow.</p></div>}</div>
      </div>
      <div className="rounded-2xl border bg-card/80 p-5 shadow-xl shadow-black/10"><h2 className="font-semibold tracking-tight">Start something new</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">Choose a focused tool. Everything stays scoped to your workspace.</p><div className="mt-5 grid gap-2">{[{ label: "AI Chat Agent", icon: Bot, href: "/ai-chat-agent" }, { label: "Image Generation", icon: Image, href: "/image-generation" }, { label: "Workflow Automation", icon: Workflow, href: "/workflow-automation" }].map(({ label, icon: Icon, href }) => <button key={label} onClick={() => setLocation(href)} className="group flex items-center gap-3 rounded-xl border border-border/70 bg-background/40 px-3.5 py-3 text-left transition hover:border-primary/40 hover:bg-primary/10"><Icon className="size-4 text-primary" /><span className="flex-1 text-sm font-medium">{label}</span><ArrowRight className="size-3.5 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" /></button>)}</div></div>
    </section>
    <section className="grid gap-5 md:grid-cols-2">
      <div className="rounded-2xl border bg-card/80 p-5 shadow-xl shadow-black/10"><div className="flex items-center justify-between"><div><h2 className="font-semibold tracking-tight">Recent images</h2><p className="mt-1 text-sm text-muted-foreground">Your latest visual outputs.</p></div><Button variant="ghost" size="sm" onClick={() => setLocation("/image-generation")} className="text-muted-foreground">Open gallery</Button></div>{isLoading ? <div className="mt-5 grid grid-cols-3 gap-3">{[0, 1, 2].map(index => <div key={index} className="aspect-square animate-pulse rounded-xl bg-muted" />)}</div> : data ? data.images.length ? <div className="mt-5 grid grid-cols-3 gap-3">{data.images.slice(0, 3).map(image => <button key={image.id} onClick={() => setLocation("/image-generation")} className="group overflow-hidden rounded-xl border bg-background/40 text-left"><img src={image.imageUrl} alt={image.prompt} className="aspect-square w-full object-cover transition duration-300 group-hover:scale-[1.04]" /><p className="line-clamp-1 p-2 text-[10px] text-muted-foreground">{image.prompt}</p></button>)}</div> : <div className="mt-5 grid min-h-36 place-items-center rounded-xl border border-dashed bg-background/20 text-center"><p className="text-xs text-muted-foreground">Your generated images will appear here.</p></div> : <div className="mt-5 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-xs text-destructive">The image activity could not be loaded. Refresh to try again.</div>}</div>
      <div className="rounded-2xl border bg-card/80 p-5 shadow-xl shadow-black/10"><div className="flex items-center justify-between"><div><h2 className="font-semibold tracking-tight">Workflow executions</h2><p className="mt-1 text-sm text-muted-foreground">Recent repeatable AI routines.</p></div><Button variant="ghost" size="sm" onClick={() => setLocation("/workflow-automation")} className="text-muted-foreground">Open workflows</Button></div>{isLoading ? <div className="mt-5 space-y-3">{[0, 1, 2].map(index => <div key={index} className="h-12 animate-pulse rounded-xl bg-muted" />)}</div> : data ? workflowRuns.length ? <div className="mt-4 divide-y divide-border/70">{workflowRuns.slice(0, 3).map(run => <div key={run.id} className="flex items-center gap-3 py-3"><Workflow className="size-4 text-primary" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{run.title}</p><p className="text-[11px] text-muted-foreground">{formatDate(run.createdAt)}</p></div><span className={`rounded-full border px-2 py-1 text-[10px] font-bold capitalize ${statusTone(run.status)}`}>{run.status}</span></div>)}</div> : <div className="mt-5 grid min-h-36 place-items-center rounded-xl border border-dashed bg-background/20 text-center"><p className="text-xs text-muted-foreground">Run a workflow to see its execution here.</p></div> : <div className="mt-5 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-xs text-destructive">Workflow activity could not be loaded. Refresh to try again.</div>}</div>
    </section>
  </WorkspacePage>;
}
