import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { TableSkeleton } from "@/components/Skeletons";

export default function AdminAnalytics() {
    const [view, setView] = useState("search");
    const [search, setSearch] = useState(null);
    const [logs, setLogs] = useState(null);

    const load = useCallback(() => {
        api.get("/admin/analytics/search").then(({ data }) => setSearch(data)).catch(() => setSearch({ popular: [], zero_results: [] }));
        api.get("/admin/audit-logs", { params: { limit: 50 } }).then(({ data }) => setLogs(data.items)).catch(() => setLogs([]));
    }, []);
    useEffect(() => { load(); }, [load]);

    return (
        <div className="space-y-5" data-testid="admin-analytics">
            <h1 className="font-display text-2xl font-black">Analytics</h1>
            <div className="flex gap-1 border-b border-border">
                {[["search", "Search Intelligence"], ["audit", "Audit Logs"]].map(([k, l]) => (
                    <button key={k} onClick={() => setView(k)} data-testid={`analytics-tab-${k}`}
                        className={`relative px-4 py-2.5 text-sm font-semibold transition-colors ${view === k ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                        {l}{view === k && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded bg-primary" />}
                    </button>
                ))}
            </div>

            {view === "search" && (!search ? <TableSkeleton rows={5} cols={3} /> : (
                <div className="grid gap-4 xl:grid-cols-2">
                    <div className="sn-card p-5" data-testid="popular-searches">
                        <h3 className="mb-3 font-display font-bold">Popular Searches</h3>
                        <table className="w-full text-sm">
                            <thead><tr className="text-left text-xs uppercase tracking-wider text-muted-foreground"><th className="pb-2">Query</th><th className="pb-2">Searches</th><th className="pb-2">Avg Results</th><th className="pb-2">Clicks</th></tr></thead>
                            <tbody>
                                {search.popular.map((s) => (
                                    <tr key={s._id} className="border-t border-border"><td className="py-2 font-semibold">{s._id}</td><td>{s.searches}</td><td>{Math.round(s.avg_results)}</td><td>{s.clicks}</td></tr>
                                ))}
                                {!search.popular.length && <tr><td colSpan={4} className="py-6 text-center text-muted-foreground">No searches recorded yet.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                    <div className="sn-card p-5" data-testid="zero-result-searches">
                        <h3 className="mb-3 font-display font-bold">Searches With No Results <span className="text-xs font-semibold text-muted-foreground">— stock these!</span></h3>
                        <table className="w-full text-sm">
                            <thead><tr className="text-left text-xs uppercase tracking-wider text-muted-foreground"><th className="pb-2">Query</th><th className="pb-2">Searches</th></tr></thead>
                            <tbody>
                                {search.zero_results.map((s) => (
                                    <tr key={s._id} className="border-t border-border"><td className="py-2 font-semibold text-destructive">{s._id}</td><td>{s.searches}</td></tr>
                                ))}
                                {!search.zero_results.length && <tr><td colSpan={2} className="py-6 text-center text-muted-foreground">Every search found something. Nice.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
            ))}

            {view === "audit" && (!logs ? <TableSkeleton rows={6} cols={5} /> : (
                <div className="sn-card overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead><tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                            <th className="p-3">When</th><th className="p-3">Admin</th><th className="p-3">Action</th><th className="p-3">Entity</th><th className="p-3">Change</th>
                        </tr></thead>
                        <tbody>
                            {logs.map((l) => (
                                <tr key={l.id} className="border-b border-border last:border-0" data-testid={`audit-row-${l.id}`}>
                                    <td className="p-3 text-xs text-muted-foreground">{new Date(l.created_at).toLocaleString("en-IN")}</td>
                                    <td className="p-3">{l.admin_email}</td>
                                    <td className="p-3 font-bold">{l.action}</td>
                                    <td className="p-3">{l.entity} <span className="text-xs text-muted-foreground">#{String(l.entity_id).slice(0, 10)}</span></td>
                                    <td className="max-w-64 truncate p-3 text-xs text-muted-foreground">
                                        {l.previous || l.new ? `${JSON.stringify(l.previous ?? "")} → ${JSON.stringify(l.new ?? "")}` : "—"}
                                    </td>
                                </tr>
                            ))}
                            {!logs.length && <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No admin actions logged yet.</td></tr>}
                        </tbody>
                    </table>
                </div>
            ))}
        </div>
    );
}
