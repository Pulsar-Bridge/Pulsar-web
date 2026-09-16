import { ABI_ENDPOINTS, RELAY_ENDPOINTS, type AbiMutability } from "../../lib/constants";

const MUTABILITY_LABEL: Record<AbiMutability, string> = {
  read: "Read",
  write: "Write",
  admin: "Admin",
};

const MUTABILITY_COLOR: Record<AbiMutability, string> = {
  read: "bg-[var(--success)]/15 text-[var(--success)]",
  write: "bg-[var(--accent)]/15 text-[var(--accent)]",
  admin: "bg-[var(--danger)]/15 text-[var(--danger)]",
};

export function DocsTab() {
  return (
    <div className="space-y-8">
      <section>
        <h3 className="mb-2 text-sm font-medium text-[var(--foreground)]/70">
          SynapseCoreContract ABI
        </h3>
        <p className="mb-3 text-xs text-[var(--foreground)]/50">
          Sourced from pulsar-core-contracts/src/lib.rs. Update this table the same PR the contract
          adds or changes an entry point.
        </p>
        <div className="space-y-2">
          {ABI_ENDPOINTS.map((endpoint) => (
            <div key={endpoint.name} className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3">
              <div className="flex flex-wrap items-center gap-2">
                <code className="text-sm font-semibold">{endpoint.name}</code>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${MUTABILITY_COLOR[endpoint.mutability]}`}>
                  {MUTABILITY_LABEL[endpoint.mutability]}
                </span>
              </div>
              <code className="mt-1 block text-xs text-[var(--foreground)]/60">{endpoint.signature}</code>
              <p className="mt-1 text-xs text-[var(--foreground)]/70">{endpoint.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h3 className="mb-2 text-sm font-medium text-[var(--foreground)]/70">Relay API (via this dashboard)</h3>
        <p className="mb-3 text-xs text-[var(--foreground)]/50">
          Proxied through /api/relay/* so the tenant/admin API keys never reach the browser. Sourced
          from pulsar-core/src/lib.rs create_app.
        </p>
        <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
          <table className="w-full text-left text-sm">
            <thead className="bg-[var(--surface)] text-xs uppercase text-[var(--foreground)]/60">
              <tr>
                <th className="px-4 py-2">Method</th>
                <th className="px-4 py-2">Path</th>
                <th className="px-4 py-2">Description</th>
              </tr>
            </thead>
            <tbody>
              {RELAY_ENDPOINTS.map((e) => (
                <tr key={e.path} className="border-t border-[var(--border)]">
                  <td className="px-4 py-2 font-mono text-xs">{e.method}</td>
                  <td className="px-4 py-2 font-mono text-xs">{e.path}</td>
                  <td className="px-4 py-2 text-[var(--foreground)]/70">{e.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
