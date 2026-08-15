export function formatDate(value: Date | string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(date);
}

export function statusTone(status: string) {
  if (status === "completed") return "bg-emerald-400/10 text-emerald-300 border-emerald-400/20";
  if (status === "failed") return "bg-rose-400/10 text-rose-300 border-rose-400/20";
  if (status === "running") return "bg-sky-400/10 text-sky-300 border-sky-400/20";
  return "bg-amber-400/10 text-amber-200 border-amber-400/20";
}
