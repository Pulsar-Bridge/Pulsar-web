const COLORS: Record<string, string> = {
  pending: "bg-[var(--warning)]/15 text-[var(--warning)]",
  processing: "bg-[var(--accent)]/15 text-[var(--accent)]",
  completed: "bg-[var(--success)]/15 text-[var(--success)]",
  failed: "bg-[var(--danger)]/15 text-[var(--danger)]",
};

export function StatusBadge({ status }: { status: string }) {
  const key = status.toLowerCase();
  const className = COLORS[key] ?? "bg-[var(--border)]/40 text-[var(--foreground)]/70";
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium capitalize ${className}`}>
      {status}
    </span>
  );
}
