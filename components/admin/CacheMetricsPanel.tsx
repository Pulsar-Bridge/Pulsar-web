"use client";

import { useEffect, useState } from "react";
import { getCacheMetrics, RelayApiError } from "../../lib/api/relay-client";
import { MOCK_CACHE_METRICS } from "../../lib/mock-data";
import type { RelayCombinedCacheMetrics } from "../../lib/types";
import { DataSourceBanner, type DataSource } from "../ui/DataSourceBanner";

export function CacheMetricsPanel() {
  const [metrics, setMetrics] = useState<RelayCombinedCacheMetrics>(MOCK_CACHE_METRICS);
  const [source, setSource] = useState<DataSource>("mock");
  const [detail, setDetail] = useState<string | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    getCacheMetrics()
      .then((res) => {
        if (cancelled) return;
        setMetrics(res);
        setSource("live");
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setMetrics(MOCK_CACHE_METRICS);
        setSource(err instanceof RelayApiError && err.status === 503 ? "mock" : "error");
        setDetail(err instanceof Error ? err.message : undefined);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const { query_cache } = metrics;

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
      <h3 className="mb-2 text-sm font-medium text-[var(--foreground)]/70">Query cache</h3>
      <DataSourceBanner source={source} detail={detail} />
      <div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
        <Stat label="Hit rate" value={`${query_cache.hit_rate.toFixed(1)}%`} />
        <Stat label="Hits / misses" value={`${query_cache.hits} / ${query_cache.misses}`} />
        <Stat label="Memory hit rate" value={`${query_cache.memory_hit_rate.toFixed(1)}%`} />
        <Stat
          label="Memory hits / misses"
          value={`${query_cache.memory_hits} / ${query_cache.memory_misses}`}
        />
      </div>
      <p className="mt-3 text-[10px] text-[var(--foreground)]/40">
        Idempotency cache counters aren&apos;t wired up server-side yet (always reported as 0), so
        they&apos;re omitted here.
      </p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-[var(--border)] bg-[var(--background)] p-2">
      <p className="text-[10px] uppercase text-[var(--foreground)]/50">{label}</p>
      <p className="mt-1 font-mono text-sm text-[var(--foreground)]">{value}</p>
    </div>
  );
}
