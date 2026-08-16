import { useEffect, useState, useCallback } from "react";
import { Plus, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { api, inr, fmtErr } from "@/lib/api";
import { TableSkeleton } from "@/components/Skeletons";
import { Modal } from "@/components/Modal";

const EMPTY_COUPON = { code: "", label: "", type: "percent", value: 10, min_order: 0, max_discount: "", usage_limit: "", per_user_limit: 1, expires_at: "", active: true, first_order_only: false };
const EMPTY_DEAL = { title: "", discount_pct: 10, product_ids: [], category_id: "", start_at: "", end_at: "", active: true };

export default function AdminCoupons() {
    const [view, setView] = useState("coupons");
    const [coupons, setCoupons] = useState(null);
    const [deals, setDeals] = useState(null);
    const [editing, setEditing] = useState(null);
    const [editingDeal, setEditingDeal] = useState(null);

    const loadCoupons = useCallback(() => api.get("/admin/coupons").then(({ data }) => setCoupons(data.items)).catch(() => setCoupons([])), []);
    const loadDeals = useCallback(() => api.get("/admin/deals").then(({ data }) => setDeals(data.items)).catch(() => setDeals([])), []);
    useEffect(() => { loadCoupons(); loadDeals(); }, [loadCoupons, loadDeals]);

    const saveCoupon = async (e) => {
        e.preventDefault();
        const body = { ...editing, value: Number(editing.value), min_order: Number(editing.min_order), max_discount: editing.max_discount ? Number(editing.max_discount) : null, usage_limit: editing.usage_limit ? Number(editing.usage_limit) : null, per_user_limit: editing.per_user_limit ? Number(editing.per_user_limit) : null };
        try {
            if (editing.id) await api.put(`/admin/coupons/${editing.id}`, body);
            else await api.post("/admin/coupons", body);
            toast.success("Coupon saved"); setEditing(null); loadCoupons();
        } catch (err) { toast.error(fmtErr(err)); }
    };

    const saveDeal = async (e) => {
        e.preventDefault();
        const body = { ...editingDeal, discount_pct: Number(editingDeal.discount_pct), product_ids: (editingDeal.product_ids || []).filter(Boolean) };
        try {
            if (editingDeal.id) await api.put(`/admin/deals/${editingDeal.id}`, body);
            else await api.post("/admin/deals", body);
            toast.success("Deal saved"); setEditingDeal(null); loadDeals();
        } catch (err) { toast.error(fmtErr(err)); }
    };

    return (
        <div className="space-y-5" data-testid="admin-coupons">
            <div className="flex items-center justify-between">
                <h1 className="font-display text-2xl font-black">Offers & Coupons</h1>
                {view === "coupons"
                    ? <button onClick={() => setEditing({ ...EMPTY_COUPON })} data-testid="coupon-create-btn" className="sn-btn-primary"><Plus size={15} /> New Coupon</button>
                    : <button onClick={() => setEditingDeal({ ...EMPTY_DEAL })} data-testid="deal-create-btn" className="sn-btn-primary"><Plus size={15} /> New Deal</button>}
            </div>
            <div className="flex gap-1 border-b border-border">
                {[["coupons", "Coupons"], ["deals", "Flash Deals"]].map(([k, l]) => (
                    <button key={k} onClick={() => setView(k)} data-testid={`offers-tab-${k}`}
                        className={`relative px-4 py-2.5 text-sm font-semibold transition-colors ${view === k ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                        {l}{view === k && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded bg-primary" />}
                    </button>
                ))}
            </div>

            {view === "coupons" && (!coupons ? <TableSkeleton rows={5} cols={6} /> : (
                <div className="sn-card overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead><tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                            <th className="p-3">Code</th><th className="p-3">Discount</th><th className="p-3">Min Order</th><th className="p-3">Used</th><th className="p-3">Expires</th><th className="p-3">Status</th><th className="p-3"></th>
                        </tr></thead>
                        <tbody>
                            {coupons.map((c) => (
                                <tr key={c.id} className="border-b border-border last:border-0" data-testid={`coupon-row-${c.code}`}>
                                    <td className="p-3 font-mono font-extrabold text-primary">{c.code}{c.user_id ? <span className="ml-2 rounded bg-secondary px-1.5 text-[10px] text-muted-foreground">user-specific</span> : null}</td>
                                    <td className="p-3 font-bold">{c.type === "percent" ? `${c.value}%` : c.type === "flat" ? inr(c.value) : "Free Delivery"}{c.max_discount ? ` (max ${inr(c.max_discount)})` : ""}</td>
                                    <td className="p-3">{c.min_order ? inr(c.min_order) : "—"}</td>
                                    <td className="p-3">{c.used_count}{c.usage_limit ? `/${c.usage_limit}` : ""}</td>
                                    <td className="p-3 text-xs text-muted-foreground">{c.expires_at ? new Date(c.expires_at).toLocaleDateString("en-IN") : "Never"}</td>
                                    <td className="p-3"><span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${c.active ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}>{c.active ? "Active" : "Inactive"}</span></td>
                                    <td className="p-3 text-right"><button onClick={() => setEditing({ ...EMPTY_COUPON, ...c, max_discount: c.max_discount ?? "", usage_limit: c.usage_limit ?? "", per_user_limit: c.per_user_limit ?? "" })} data-testid={`coupon-edit-${c.code}`} className="text-xs font-bold text-primary hover:underline">Edit</button></td>
                                </tr>
                            ))}
                            {!coupons.length && <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No coupons yet.</td></tr>}
                        </tbody>
                    </table>
                </div>
            ))}

            {view === "deals" && (!deals ? <TableSkeleton rows={4} cols={5} /> : (
                <div className="sn-card overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead><tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                            <th className="p-3">Deal</th><th className="p-3">Discount</th><th className="p-3">Window</th><th className="p-3">Status</th><th className="p-3"></th>
                        </tr></thead>
                        <tbody>
                            {deals.map((d) => (
                                <tr key={d.id} className="border-b border-border last:border-0" data-testid={`deal-row-${d.id}`}>
                                    <td className="p-3 font-bold">{d.title}</td>
                                    <td className="p-3">{d.discount_pct}%</td>
                                    <td className="p-3 text-xs text-muted-foreground">{d.start_at ? new Date(d.start_at).toLocaleString("en-IN") : "—"} → {d.end_at ? new Date(d.end_at).toLocaleString("en-IN") : "—"}</td>
                                    <td className="p-3"><span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${d.active ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}>{d.active ? "Active" : "Inactive"}</span></td>
                                    <td className="p-3 text-right">
                                        <button onClick={() => setEditingDeal({ ...d })} data-testid={`deal-edit-${d.id}`} className="mr-3 text-xs font-bold text-primary hover:underline">Edit</button>
                                        <button onClick={async () => { await api.delete(`/admin/deals/${d.id}`); loadDeals(); }} data-testid={`deal-delete-${d.id}`} className="text-xs font-bold text-destructive hover:underline">Delete</button>
                                    </td>
                                </tr>
                            ))}
                            {!deals.length && <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No deals yet.</td></tr>}
                        </tbody>
                    </table>
                </div>
            ))}

            <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? "Edit Coupon" : "New Coupon"} testId="coupon-modal">
                {editing && (
                    <form onSubmit={saveCoupon} className="space-y-4">
                        <div className="flex items-end gap-2">
                            <div className="flex-1"><label className="sn-label">Code</label><input className="sn-input font-mono uppercase" required value={editing.code} data-testid="cf-code" onChange={(e) => setEditing({ ...editing, code: e.target.value.toUpperCase() })} /></div>
                            <button type="button" onClick={async () => { const { data } = await api.post("/admin/coupons/generate"); setEditing({ ...editing, code: data.code }); }} data-testid="coupon-generate-btn" className="sn-btn-outline !py-2.5 text-xs"><Sparkles size={13} /> Generate</button>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div><label className="sn-label">Type</label>
                                <select className="sn-input" value={editing.type} data-testid="cf-type" onChange={(e) => setEditing({ ...editing, type: e.target.value })}>
                                    <option value="percent">Percentage %</option><option value="flat">Flat ₹</option><option value="free_delivery">Free Delivery</option>
                                </select>
                            </div>
                            <div><label className="sn-label">Value</label><input className="sn-input" type="number" value={editing.value} data-testid="cf-value" onChange={(e) => setEditing({ ...editing, value: e.target.value })} /></div>
                            <div><label className="sn-label">Min Order ₹</label><input className="sn-input" type="number" value={editing.min_order} data-testid="cf-min-order" onChange={(e) => setEditing({ ...editing, min_order: e.target.value })} /></div>
                            <div><label className="sn-label">Max Discount ₹</label><input className="sn-input" type="number" value={editing.max_discount} data-testid="cf-max-discount" onChange={(e) => setEditing({ ...editing, max_discount: e.target.value })} /></div>
                            <div><label className="sn-label">Usage Limit (total)</label><input className="sn-input" type="number" value={editing.usage_limit} data-testid="cf-usage-limit" onChange={(e) => setEditing({ ...editing, usage_limit: e.target.value })} /></div>
                            <div><label className="sn-label">Per-User Limit</label><input className="sn-input" type="number" value={editing.per_user_limit} data-testid="cf-per-user" onChange={(e) => setEditing({ ...editing, per_user_limit: e.target.value })} /></div>
                        </div>
                        <div><label className="sn-label">Expires At</label><input className="sn-input" type="datetime-local" value={editing.expires_at?.slice(0, 16) || ""} data-testid="cf-expires" onChange={(e) => setEditing({ ...editing, expires_at: e.target.value ? new Date(e.target.value).toISOString() : "" })} /></div>
                        <div className="flex gap-6">
                            <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={editing.active} data-testid="cf-active" onChange={(e) => setEditing({ ...editing, active: e.target.checked })} /> Active</label>
                            <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={editing.first_order_only} data-testid="cf-first-order" onChange={(e) => setEditing({ ...editing, first_order_only: e.target.checked })} /> First order only</label>
                        </div>
                        <button className="sn-btn-primary w-full" data-testid="cf-save">Save Coupon</button>
                    </form>
                )}
            </Modal>

            <Modal open={!!editingDeal} onClose={() => setEditingDeal(null)} title={editingDeal?.id ? "Edit Deal" : "New Deal"} testId="deal-modal">
                {editingDeal && (
                    <form onSubmit={saveDeal} className="space-y-4">
                        <div><label className="sn-label">Title</label><input className="sn-input" required value={editingDeal.title} data-testid="df-title" onChange={(e) => setEditingDeal({ ...editingDeal, title: e.target.value })} /></div>
                        <div><label className="sn-label">Discount %</label><input className="sn-input" type="number" value={editingDeal.discount_pct} data-testid="df-discount" onChange={(e) => setEditingDeal({ ...editingDeal, discount_pct: e.target.value })} /></div>
                        <div><label className="sn-label">Product IDs (comma separated, optional)</label>
                            <input className="sn-input font-mono text-xs" value={(editingDeal.product_ids || []).join(", ")} data-testid="df-products"
                                onChange={(e) => setEditingDeal({ ...editingDeal, product_ids: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div><label className="sn-label">Starts</label><input className="sn-input" type="datetime-local" value={editingDeal.start_at?.slice(0, 16) || ""} data-testid="df-start" onChange={(e) => setEditingDeal({ ...editingDeal, start_at: e.target.value ? new Date(e.target.value).toISOString() : "" })} /></div>
                            <div><label className="sn-label">Ends</label><input className="sn-input" type="datetime-local" value={editingDeal.end_at?.slice(0, 16) || ""} data-testid="df-end" onChange={(e) => setEditingDeal({ ...editingDeal, end_at: e.target.value ? new Date(e.target.value).toISOString() : "" })} /></div>
                        </div>
                        <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={editingDeal.active} data-testid="df-active" onChange={(e) => setEditingDeal({ ...editingDeal, active: e.target.checked })} /> Active</label>
                        <p className="text-xs text-muted-foreground">Deals outside their time window automatically disappear from the storefront.</p>
                        <button className="sn-btn-primary w-full" data-testid="df-save">Save Deal</button>
                    </form>
                )}
            </Modal>
        </div>
    );
}
