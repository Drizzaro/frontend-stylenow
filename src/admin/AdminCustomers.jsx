import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { api, inr, fmtErr } from "@/lib/api";
import { TableSkeleton } from "@/components/Skeletons";
import { Modal } from "@/components/Modal";

export default function AdminCustomers() {
    const [data, setData] = useState(null);
    const [q, setQ] = useState("");
    const [pointsModal, setPointsModal] = useState(null);
    const [points, setPoints] = useState(0);
    const [note, setNote] = useState("");

    const load = useCallback(() => {
        api.get("/admin/customers", { params: { q, limit: 50 } }).then(({ data }) => setData(data)).catch(() => setData({ items: [], total: 0 }));
    }, [q]);
    useEffect(() => { load(); }, [load]);

    const toggle = async (u) => {
        try {
            await api.put(`/admin/customers/${u.id}/status`, { disabled: !u.disabled });
            toast.success(u.disabled ? "Account enabled" : "Account disabled");
            load();
        } catch (e) { toast.error(fmtErr(e)); }
    };

    const givePoints = async (e) => {
        e.preventDefault();
        try {
            await api.post(`/admin/customers/${pointsModal.id}/points`, { points: Number(points), note });
            toast.success("Points updated"); setPointsModal(null); load();
        } catch (err) { toast.error(fmtErr(err)); }
    };

    return (
        <div className="space-y-5" data-testid="admin-customers">
            <div className="flex items-center justify-between">
                <h1 className="font-display text-2xl font-black">Customers & Users</h1>
                <input className="sn-input max-w-xs !py-2" placeholder="Search name, phone, email…" value={q} data-testid="customer-search" onChange={(e) => setQ(e.target.value)} />
            </div>
            {!data ? <TableSkeleton rows={6} cols={7} /> : (
                <div className="sn-card overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead><tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                            <th className="p-3">Customer</th><th className="p-3">Phone</th><th className="p-3">Joined</th><th className="p-3">Orders</th><th className="p-3">Spent</th><th className="p-3">Points</th><th className="p-3">Status</th><th className="p-3"></th>
                        </tr></thead>
                        <tbody>
                            {data.items.map((u) => (
                                <tr key={u.id} className="border-b border-border last:border-0" data-testid={`customer-row-${u.id}`}>
                                    <td className="p-3 font-bold">{u.name || "—"}</td>
                                    <td className="p-3">{u.phone}</td>
                                    <td className="p-3 text-xs text-muted-foreground">{u.created_at ? new Date(u.created_at).toLocaleDateString("en-IN") : "—"}</td>
                                    <td className="p-3">{u.total_orders}</td>
                                    <td className="p-3 font-bold">{inr(u.total_spent)}</td>
                                    <td className="p-3"><span className="font-bold text-primary">{u.points}</span></td>
                                    <td className="p-3"><span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${u.disabled ? "bg-destructive/15 text-destructive" : "bg-success/15 text-success"}`}>{u.disabled ? "Disabled" : "Active"}</span></td>
                                    <td className="p-3"><div className="flex justify-end gap-3">
                                        <button onClick={() => { setPointsModal(u); setPoints(0); setNote(""); }} data-testid={`customer-points-${u.id}`} className="text-xs font-bold text-primary hover:underline">Points</button>
                                        <button onClick={() => toggle(u)} data-testid={`customer-toggle-${u.id}`} className={`text-xs font-bold hover:underline ${u.disabled ? "text-success" : "text-destructive"}`}>{u.disabled ? "Enable" : "Disable"}</button>
                                    </div></td>
                                </tr>
                            ))}
                            {!data.items.length && <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">No customers yet.</td></tr>}
                        </tbody>
                    </table>
                </div>
            )}
            <Modal open={!!pointsModal} onClose={() => setPointsModal(null)} title={`Adjust Points — ${pointsModal?.name || pointsModal?.phone || ""}`} testId="points-modal">
                <form onSubmit={givePoints} className="space-y-4">
                    <div><label className="sn-label">Points (+ credit / − debit)</label><input className="sn-input" type="number" required value={points} data-testid="points-value" onChange={(e) => setPoints(e.target.value)} /></div>
                    <div><label className="sn-label">Note</label><input className="sn-input" value={note} data-testid="points-note" onChange={(e) => setNote(e.target.value)} placeholder="Promotional bonus" /></div>
                    <button className="sn-btn-primary w-full" data-testid="points-save">Apply</button>
                </form>
            </Modal>
        </div>
    );
}
