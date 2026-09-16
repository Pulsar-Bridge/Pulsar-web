export type DataSource = "live" | "mock" | "error";

/**
 * Makes it explicit to the user which data they're looking at. Per the
 * security checklist, a failed relay/contract call must never silently fall
 * back to mock data without saying so.
 */
export function DataSourceBanner({ source, detail }: { source: DataSource; detail?: string }) {
  if (source === "live") return null;

  const isError = source === "error";
  return (
    <div
      className={`mb-3 rounded-md border px-3 py-2 text-xs ${
        isError
          ? "border-[var(--danger)]/40 bg-[var(--danger)]/10 text-[var(--danger)]"
          : "border-[var(--warning)]/40 bg-[var(--warning)]/10 text-[var(--warning)]"
      }`}
    >
      {isError
        ? `Live data unavailable${detail ? ` (${detail})` : ""} — showing mock data instead.`
        : "Showing mock data — connect a wallet and configure the contract/relay to see live data."}
    </div>
  );
}
