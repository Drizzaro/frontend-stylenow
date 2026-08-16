import { useEffect, useState, useCallback } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api, fmtErr } from "@/lib/api";
import { TableSkeleton } from "@/components/Skeletons";
import { Modal } from "@/components/Modal";

const EMPTY = { label: "", type: "coupon_flat", value: 50, probability: 10, expiry_days: 7, active: true };
const TYPES = [["coupon_flat", "Coupon ₹ off"], ["coupon_percent", "Coupon % off"], ["points", "StylePoints"], ["free_delivery", "Free Delivery"], ["none", "No Reward"]];

export default function AdminSpin() {
    const [data, setData] = useState(null);
    const [settings, setSettings] = useState(null);
    const [editing, setEditing] = useState(null);

    const load = useCallback(() => {
        api.get("/admin/spin/rewards").then(({ data }) => setData(data)).catch(() => setData({ items: [], recent_spins: [] }));
        api.get("/admin/settings").then(({ data }) => setSettings(data.settings)).catch(() => {});
    }, []);
    useEffect(() => { load(); }, [load]);

    const save = async (e) => {
        e.preventDefault();
        const body = { ...editing, value: Number(editing.value), probability: Number(editing.probability), expiry_days: Number(editing.expiry_days) };
        try {
            if (editing.id) await api.put(`/admin/spin/rewards/${editing.id}`, body);
            else await api.post("/admin/spin/rewards", body);
            toast.success("Reward saved"); setEditing(null); load();
        } catch (err) { toast.error(fmtErr(err)); }
    };

    const saveCost = async (e) => {
        e.preventDefault();
        try {
            await api.put("/admin/settings", { points_per_spin: Number(settings.points_per_spin), spin_enabled: !!settings.spin_enabled });
            toast.success("Spin settings saved"); load();
        } catch (err) { toast.error(fmtErr(err)); }
    };

    if (!data || !settings) return <TableSkeleton rows={6} cols={5} />;
    const totalProb = data.items.reduce((n, r) => n + (r.probability || 0), 0);

    return (
        <div className="space-y-6" data-testid="admin-spin">
            <h1 className="font-display text-2xl font-black">Spin Wheel</h1>

            <form onSubmit={saveCost} className="sn-card flex flex-wrap items-end gap-4 p-5" data-testid="spin-settings">
                <div><label className="sn-label">StylePoints per Spin</label><input className="sn-input w-32" type="number" min={1} value={settings.points_per_spin} data-testid="spin-cost" onChange={(e) => setSettings({ ...settings, points_per_spin: e.target.value })} /></div>
                <label className="flex items-center gap-2 pb-2 text-sm font-semibold"><input type="checkbox" checked={!!settings.spin_enabled} data-testid="spin-enabled" onChange={(e) => setSettings({ ...settings, spin_enabled: e.target.checked })} /> Wheel active</label>
                <button className="sn-btn-primary" data-testid="spin-settings-save">Save Settings</button>
            </form>

            <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-bold">Rewards <span className="ml-2 text-xs font-semibold text-muted-foreground">total weight {totalProb}</span></h2>
                <button onClick={() => setEditing({ ...EMPTY })} data-testid="spin-reward-create" className="sn-btn-outline !py-2 text-xs"><Plus size={13} /> Add Reward</button>
            </div>
            <div className="sn-card overflow-x-auto">
                <table className="w-full text-sm">
                    <thead><tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                        <th className="p-3">Label</th><th className="p-3">Type</th><th className="p-3">Value</th><th className="p-3">Weight</th><th className="p-3">Chance</th><th className="p-3">Status</th><th className="p-3"></th>
                    </tr></thead>
                    <tbody>
                        {data.items.map((r) => (
                            <tr key={r.id} className="border-b border-border last:border-0" data-testid={`spin-row-${r.id}`}>
                                <td className="p-3 font-bold">{r.label}</td>
                                <td className="p-3">{TYPES.find(([k]) => k === r.type)?.[1] || r.type}</td>
                                <td className="p-3">{r.value || "—"}</td>
                                <td className="p-3">{r.probability}</td>
                                <td className="p-3 font-bold text-primary">{totalProb ? ((r.probability / totalProb) * 100).toFixed(1) : 0}%</td>
                                <td className="p-3"><span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${r.active ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}>{r.active ? "Active" : "Off"}</span></td>
                                <td className="p-3"><div className="flex justify-end gap-2">
                                    <button onClick={() => setEditing({ ...r })} data-testid={`spin-edit-${r.id}`} className="p-1.5 text-primary hover:bg-primary/10 rounded-lg"><Pencil size={13} /></button>
                                    <button onClick={async () => { await api.delete(`/admin/spin/rewards/${r.id}`); load(); }} data-testid={`spin-delete-${r.id}`} className="p-1.5 text-destructive hover:bg-destructive/10 rounded-lg"><Trash2 size={13} /></button>
                                </div></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <h2 className="font-display text-lg font-bold">Recent Spins</h2>
            <div className="sn-card divide-y divide-border">
                {data.recent_spins.slice(0, 10).map((s) => (
                    <div key={s.id} className="flex justify-between p-3 text-sm" data-testid={`spin-txn-${s.id}`}>
                        <span className="font-semibold">{s.reward_label}{s.coupon_code ? <span className="ml-2 font-mono text-xs text-primary">{s.coupon_code}</span> : null}</span>
                        <span className="text-xs text-muted-foreground">{new Date(s.created_at).toLocaleString("en-IN")}</span>
                    </div>
                ))}
                {!data.recent_spins.length && <p className="p-6 text-center text-sm text-muted-foreground">No spins yet.</p>}
            </div>

            <Modal open={!!editing} onClose={() => setEditing(null)} title="Spin Reward" testId="spin-reward-modal">
                {editing && (
                    <form onSubmit={save} className="space-y-4">
                        <div><label className="sn-label">Label</label><input className="sn-input" required value={editing.label} data-testid="sf-label" onChange={(e) => setEditing({ ...editing, label: e.target.value })} placeholder="₹50 OFF" /></div>
                        <div className="grid grid-cols-2 gap-3">
                            <div><label className="sn-label">Type</label>
                                <select className="sn-input" value={editing.type} data-testid="sf-type" onChange={(e) => setEditing({ ...editing, type: e.target.value })}>
                                    {TYPES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                                </select>
                            </div>
                            <div><label className="sn-label">Value</label><input className="sn-input" type="number" value={editing.value} data-testid="sf-value" onChange={(e) => setEditing({ ...editing, value: e.target.value })} /></div>
                            <div><label className="sn-label">Probability Weight</label><input className="sn-input" type="number" min={0} value={editing.probability} data-testid="sf-probability" onChange={(e) => setEditing({ ...editing, probability: e.target.value })} /></div>
                            <div><label className="sn-label">Coupon Expiry (days)</label><input className="sn-input" type="number" min={0} value={editing.expiry_days} data-testid="sf-expiry" onChange={(e) => setEditing({ ...editing, expiry_days: e.target.value })} /></div>
                        </div>
                        <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={editing.active} data-testid="sf-active" onChange={(e) => setEditing({ ...editing, active: e.target.checked })} /> Active</label>
                        <p className="text-xs text-muted-foreground">Winners are drawn server-side using these weights — the frontend never decides the result.</p>
                        <button className="sn-btn-primary w-full" data-testid="sf-save">Save Reward</button>
                    </form>
                )}
            </Modal>
        </div>
    );
}
