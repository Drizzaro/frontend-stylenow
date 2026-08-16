import { useEffect, useState, useCallback } from "react";
import { Star, Check, X, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api, inr, fmtErr } from "@/lib/api";
import { TableSkeleton } from "@/components/Skeletons";

export default function AdminOps() {
    const [view, setView] = useState("returns");
    const [returns, setReturns] = useState(null);
    const [reviews, setReviews] = useState(null);

    const load = useCallback(() => {
        api.get("/admin/returns").then(({ data }) => setReturns(data.items)).catch(() => setReturns([]));
        api.get("/admin/reviews").then(({ data }) => setReviews(data.items)).catch(() => setReviews([]));
    }, []);
    useEffect(() => { load(); }, [load]);

    const act = async (id, action) => {
        try {
            await api.put(`/admin/returns/${id}`, { action });
            toast.success(`Return ${action}`);
            load();
        } catch (e) { toast.error(fmtErr(e)); }
    };

    const moderate = async (id, approved) => {
        await api.put(`/admin/reviews/${id}`, { approved });
        toast.success(approved ? "Review approved" : "Review hidden");
        load();
    };

    return (
        <div className="space-y-5" data-testid="admin-ops">
            <h1 className="font-display text-2xl font-black">Reviews & Returns</h1>
            <div className="flex gap-1 border-b border-border">
                {[["returns", "Returns & Refunds"], ["reviews", "Reviews"]].map(([k, l]) => (
                    <button key={k} onClick={() => setView(k)} data-testid={`ops-tab-${k}`}
                        className={`relative px-4 py-2.5 text-sm font-semibold transition-colors ${view === k ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                        {l}{view === k && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded bg-primary" />}
                    </button>
                ))}
            </div>

            {view === "returns" && (!returns ? <TableSkeleton rows={4} cols={5} /> : (
                <div className="sn-card overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead><tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                            <th className="p-3">Return</th><th className="p-3">Order</th><th className="p-3">Reason</th><th className="p-3">Amount</th><th className="p-3">Refund To</th><th className="p-3">Status</th><th className="p-3"></th>
                        </tr></thead>
                        <tbody>
                            {returns.map((r) => (
                                <tr key={r.id} className="border-b border-border last:border-0" data-testid={`return-row-${r.id}`}>
                                    <td className="p-3 font-bold">{r.id}</td>
                                    <td className="p-3">{r.order_id}</td>
                                    <td className="max-w-52 truncate p-3">{r.reason}</td>
                                    <td className="p-3 font-bold">{inr(r.amount)}</td>
                                    <td className="p-3 text-xs" data-testid={`return-refund-${r.id}`}>
                                        {r.refund_method === "upi" ? <span>UPI: <b className="font-mono">{r.refund_details?.upi_id}</b></span>
                                            : r.refund_method === "bank" ? <span>Bank: <b>{r.refund_details?.account_holder}</b> · A/C <b className="font-mono">{r.refund_details?.account_number}</b> · IFSC <b className="font-mono">{r.refund_details?.ifsc}</b></span>
                                            : <span className="font-semibold">Cash on pickup</span>}
                                    </td>
                                    <td className="p-3"><span className={`rounded-full px-2 py-0.5 text-[11px] font-bold capitalize ${r.status === "refunded" ? "bg-success/15 text-success" : r.status === "rejected" ? "bg-destructive/15 text-destructive" : "bg-warning/15 text-warning"}`}>{r.status}</span></td>
                                    <td className="p-3"><div className="flex justify-end gap-2">
                                        {r.status === "requested" && <>
                                            <button onClick={() => act(r.id, "approved")} data-testid={`return-approve-${r.id}`} className="text-xs font-bold text-success hover:underline">Approve</button>
                                            <button onClick={() => act(r.id, "rejected")} data-testid={`return-reject-${r.id}`} className="text-xs font-bold text-destructive hover:underline">Reject</button>
                                        </>}
                                        {r.status === "approved" && <button onClick={() => act(r.id, "refunded")} data-testid={`return-refund-${r.id}`} className="text-xs font-bold text-primary hover:underline">Process Refund</button>}
                                    </div></td>
                                </tr>
                            ))}
                            {!returns.length && <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No return requests.</td></tr>}
                        </tbody>
                    </table>
                </div>
            ))}

            {view === "reviews" && (!reviews ? <TableSkeleton rows={4} cols={4} /> : (
                <div className="space-y-3">
                    {reviews.map((r) => (
                        <div key={r.id} className="sn-card flex items-start gap-4 p-4" data-testid={`admin-review-${r.id}`}>
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                    <span className="flex">{Array.from({ length: 5 }).map((_, i) => <Star key={i} size={13} className={i < r.rating ? "fill-warning text-warning" : "text-border"} />)}</span>
                                    <span className="text-sm font-bold">{r.user_name}</span>
                                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${r.approved ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}>{r.approved ? "Live" : "Hidden"}</span>
                                </div>
                                <p className="mt-1 text-sm text-muted-foreground">{r.comment}</p>
                                <p className="mt-1 text-xs text-muted-foreground">Product: {r.product_id}</p>
                            </div>
                            <div className="flex gap-1">
                                <button onClick={() => moderate(r.id, !r.approved)} data-testid={`review-toggle-${r.id}`}
                                    className={`rounded-full p-2 ${r.approved ? "text-warning hover:bg-warning/10" : "text-success hover:bg-success/10"}`} aria-label="Toggle review">
                                    {r.approved ? <X size={15} /> : <Check size={15} />}
                                </button>
                                <button onClick={async () => { await api.delete(`/admin/reviews/${r.id}`); toast.success("Review deleted"); load(); }} data-testid={`review-delete-${r.id}`}
                                    className="rounded-full p-2 text-destructive hover:bg-destructive/10" aria-label="Delete review">
                                    <Trash2 size={15} />
                                </button>
                            </div>
                        </div>
                    ))}
                    {!reviews.length && <p className="sn-card p-8 text-center text-sm text-muted-foreground">No reviews yet.</p>}
                </div>
            ))}
        </div>
    );
}
