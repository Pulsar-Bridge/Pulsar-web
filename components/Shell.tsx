"use client";

import { useState } from "react";
import { AdminTab } from "./admin/AdminTab";
import { DocsTab } from "./docs/DocsTab";
import { SettlementsTab } from "./settlements/SettlementsTab";
import { StatsTab } from "./stats/StatsTab";
import { TransactionsTab } from "./transactions/TransactionsTab";
import { TabErrorBoundary } from "./ui/TabErrorBoundary";

// New tab checklist (see README): add the key here, add the render branch
// below, wrap the component in TabErrorBoundary.
const TABS = ["Transactions", "Settlements", "Stats", "Admin", "Docs"] as const;
type Tab = (typeof TABS)[number];

export function Shell() {
  const [active, setActive] = useState<Tab>("Transactions");

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-lg font-semibold">Pulsar Bridge</h1>
      </header>

      <nav className="mb-6 flex gap-1 border-b border-[var(--border)]">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActive(tab)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              active === tab
                ? "border-b-2 border-[var(--accent)] text-[var(--foreground)]"
                : "text-[var(--foreground)]/50 hover:text-[var(--foreground)]/80"
            }`}
          >
            {tab}
          </button>
        ))}
      </nav>

      <main>
        {active === "Transactions" && (
          <TabErrorBoundary tabName="Transactions">
            <TransactionsTab />
          </TabErrorBoundary>
        )}
        {active === "Settlements" && (
          <TabErrorBoundary tabName="Settlements">
            <SettlementsTab />
          </TabErrorBoundary>
        )}
        {active === "Stats" && (
          <TabErrorBoundary tabName="Stats">
            <StatsTab />
          </TabErrorBoundary>
        )}
        {active === "Admin" && (
          <TabErrorBoundary tabName="Admin">
            <AdminTab />
          </TabErrorBoundary>
        )}
        {active === "Docs" && (
          <TabErrorBoundary tabName="Docs">
            <DocsTab />
          </TabErrorBoundary>
        )}
      </main>
    </div>
  );
}
