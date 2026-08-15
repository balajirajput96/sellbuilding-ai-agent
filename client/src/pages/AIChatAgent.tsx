import { AIChatBox, type Message } from "@/components/AIChatBox";
import { WorkspacePage } from "@/components/WorkspacePage";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { trpc } from "@/lib/trpc";
import { MessageSquarePlus, PanelLeft, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

function authHeaders(): Record<string, string> {
  try {
    const raw = sessionStorage.getItem("manus-cookie");
    const token = raw?.split(";").find(value => value.trim().startsWith("app_session_id="))?.trim().slice("app_session_id=".length);
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch { return {}; }
}

export default function AIChatAgent() {
  const utils = trpc.useUtils();
  const conversations = trpc.chat.conversations.useQuery();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const messagesQuery = trpc.chat.messages.useQuery({ conversationId: selectedId ?? 1 }, { enabled: Boolean(selectedId) });
  const [liveMessages, setLiveMessages] = useState<Message[] | null>(null);
  const feedbackPreview = typeof window === "undefined" ? null : new URLSearchParams(window.location.search).get("feedbackPreview");
  const previewHistoryLoading = feedbackPreview === "history-loading";
  const previewHistoryError = feedbackPreview === "history-error";
  useEffect(() => { if (!selectedId && conversations.data?.[0]) setSelectedId(conversations.data[0].id); }, [conversations.data, selectedId]);
  useEffect(() => { setLiveMessages(null); }, [selectedId]);
  const displayedMessages = useMemo(() => liveMessages ?? (messagesQuery.data ?? []).map(message => ({ role: message.role, content: message.content })), [liveMessages, messagesQuery.data]);

  const send = async (prompt: string) => {
    const base = [...displayedMessages, { role: "user" as const, content: prompt }, { role: "assistant" as const, content: "" }];
    setLiveMessages(base);
    try {
      const response = await fetch("/api/ai/chat/stream", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json", ...authHeaders() }, body: JSON.stringify({ prompt, ...(selectedId ? { conversationId: selectedId } : {}) }) });
      if (!response.ok || !response.body) throw new Error((await response.json().catch(() => ({ error: "Unable to start AI Chat Agent" }))).error);
      const reader = response.body.getReader(); const decoder = new TextDecoder(); let buffer = "";
      while (true) { const { value, done } = await reader.read(); if (done) break; buffer += decoder.decode(value, { stream: true }); const frames = buffer.split("\n\n"); buffer = frames.pop() ?? ""; for (const frame of frames) { const line = frame.split("\n").find(part => part.startsWith("data:")); if (!line) continue; const event = JSON.parse(line.slice(5)); if (event.type === "delta") setLiveMessages(current => current ? [...current.slice(0, -1), { role: "assistant", content: `${current.at(-1)?.content ?? ""}${event.delta}` }] : current); if (event.type === "done") { setSelectedId(event.conversationId); await Promise.all([utils.chat.conversations.invalidate(), utils.chat.messages.invalidate()]); setLiveMessages(null); } if (event.type === "error") throw new Error(event.message); } }
    } catch (error) { setLiveMessages(null); toast.error(error instanceof Error ? error.message : "AI Chat Agent could not complete the request."); }
  };
  return <WorkspacePage eyebrow="Reasoning space" title="AI Chat Agent" description="Ask, plan, write, code, and explore with responses streamed directly into your private conversation history." action={<Button variant="outline" onClick={() => { setSelectedId(null); setLiveMessages([]); }} className="gap-2 rounded-xl"><MessageSquarePlus className="size-4" /> New conversation</Button>}>
    <div className="grid min-h-[650px] overflow-hidden rounded-2xl border bg-card/75 shadow-2xl shadow-black/15 lg:grid-cols-[250px_1fr]">
      <aside className="hidden border-r border-border/70 bg-background/30 lg:block"><div className="flex items-center gap-2 border-b border-border/70 p-4 text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground"><PanelLeft className="size-3.5" /> Conversations</div><ScrollArea className="h-[590px]"><div className="space-y-1.5 p-3">{previewHistoryLoading || conversations.isLoading ? [0, 1, 2].map(index => <div key={index} className="h-14 animate-pulse rounded-xl bg-muted" />) : previewHistoryError || conversations.isError ? <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-center text-xs text-destructive">Conversations could not be loaded.</p> : conversations.data?.map(item => <button key={item.id} onClick={() => setSelectedId(item.id)} className={`w-full rounded-xl px-3 py-2.5 text-left transition ${item.id === selectedId ? "bg-primary/15 text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}><p className="truncate text-sm font-medium">{item.title}</p><p className="mt-1 text-[11px] opacity-70">Private conversation</p></button>)}{!previewHistoryLoading && !previewHistoryError && !conversations.isLoading && !conversations.isError && !conversations.data?.length && <p className="px-3 py-8 text-center text-xs leading-5 text-muted-foreground">Your conversations will be saved here.</p>}</div></ScrollArea></aside>
      <div className="min-w-0 p-3 sm:p-4">{previewHistoryLoading || (messagesQuery.isLoading && selectedId) ? <div role="status" className="mb-3 rounded-xl border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">Loading conversation history…</div> : null}{previewHistoryError || messagesQuery.isError ? <div role="alert" className="mb-3 rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">This conversation could not be loaded. Choose another conversation or refresh.</div> : null}<AIChatBox messages={displayedMessages} onSendMessage={send} isLoading={Boolean(liveMessages?.at(-1)?.role === "assistant" && !liveMessages.at(-1)?.content)} height="610px" className="border-0 bg-transparent shadow-none" emptyStateMessage="Your focused AI workspace is ready." suggestedPrompts={["Create a concise project plan", "Review this code for edge cases", "Turn notes into a clear brief"]} /><div className="flex items-center gap-2 px-4 pb-1 text-[11px] text-muted-foreground"><Sparkles className="size-3 text-primary" /> Responses are saved to your personal workspace.</div></div>
    </div>
  </WorkspacePage>;
}
