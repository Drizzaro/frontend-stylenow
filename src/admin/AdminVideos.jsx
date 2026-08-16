import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Clapperboard, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api, uploadFile, fmtErr } from "@/lib/api";
import { TableSkeleton } from "@/components/Skeletons";
import { Modal } from "@/components/Modal";

const EMPTY = { username: "", caption: "", product_id: "", video: "", kind: "review", active: true, sort: 0 };

export default function AdminVideos() {
    const [items, setItems] = useState(null);
    const [products, setProducts] = useState([]);
    const [editing, setEditing] = useState(null);
    const [uploading, setUploading] = useState(false);

    const load = () => {
        api.get("/admin/videos").then(({ data }) => setItems(data.items)).catch(() => setItems([]));
        api.get("/admin/products", { params: { limit: 100 } }).then(({ data }) => setProducts(data.items)).catch(() => {});
    };
    useEffect(() => { load(); }, []);

    const onVideoFile = async (e) => {
        const f = e.target.files?.[0];
        e.target.value = "";
        if (!f) return;
        setUploading(true);
        try {
            const { url, kind } = await uploadFile(f);
            if (kind !== "video") { toast.error("Please upload a video file"); return; }
            setEditing((cur) => ({ ...cur, video: url }));
            toast.success("Video uploaded");
        } catch (err) { toast.error(fmtErr(err)); }
        finally { setUploading(false); }
    };

    const save = async (e) => {
        e.preventDefault();
        if (!editing.video) { toast.error("Upload a video first"); return; }
        try {
            if (editing.id) await api.put(`/admin/videos/${editing.id}`, editing);
            else await api.post("/admin/videos", editing);
            toast.success("Video saved");
            setEditing(null); load();
        } catch (err) { toast.error(fmtErr(err)); }
    };

    if (!items) return <TableSkeleton rows={5} cols={5} />;

    return (
        <div className="space-y-5" data-testid="admin-videos">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-display text-2xl font-black">Video Ads & Reviews</h1>
                    <p className="text-sm text-muted-foreground">Short videos with a creator username, attached to a product. Shown on the homepage and product page.</p>
                </div>
                <button onClick={() => setEditing({ ...EMPTY })} data-testid="video-create-btn" className="sn-btn-primary"><Plus size={15} /> New Video</button>
            </div>
            {items.length === 0 ? (
                <div className="sn-card p-10 text-center text-sm text-muted-foreground">No videos yet. Upload your first review or ad clip.</div>
            ) : (
                <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
                    {items.map((v) => (
                        <div key={v.id} className="sn-card overflow-hidden" data-testid={`video-row-${v.id}`}>
                            <video src={v.video} className="aspect-[9/16] w-full bg-black object-cover" muted loop playsInline
                                onMouseEnter={(e) => e.target.play()} onMouseLeave={(e) => e.target.pause()} />
                            <div className="space-y-1 p-3 text-sm">
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-primary">@{v.username}</span>
                                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${v.kind === "ad" ? "bg-warning/15 text-warning" : "bg-success/15 text-success"}`}>{v.kind}</span>
                                </div>
                                <p className="line-clamp-1 text-xs text-muted-foreground">{v.product_name || "No product attached"}</p>
                                <div className="flex items-center justify-between pt-1">
                                    <button onClick={async () => { await api.put(`/admin/videos/${v.id}`, { ...v, active: !v.active }); load(); }} data-testid={`video-toggle-${v.id}`}
                                        className={`text-xs font-bold ${v.active ? "text-success" : "text-muted-foreground"}`}>
                                        {v.active ? "Live" : "Hidden"}
                                    </button>
                                    <button onClick={async () => { await api.delete(`/admin/videos/${v.id}`); toast.success("Deleted"); load(); }} data-testid={`video-delete-${v.id}`} className="p-1 text-destructive hover:bg-destructive/10 rounded-lg"><Trash2 size={13} /></button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? "Edit Video" : "New Video"} testId="video-modal">
                {editing && (
                    <form onSubmit={save} className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div><label className="sn-label">Creator Username</label><input className="sn-input" required value={editing.username} data-testid="vf-username" placeholder="fashionista_riya" onChange={(e) => setEditing({ ...editing, username: e.target.value.replace(/^@/, "") })} /></div>
                            <div><label className="sn-label">Type</label>
                                <select className="sn-input" value={editing.kind} data-testid="vf-kind" onChange={(e) => setEditing({ ...editing, kind: e.target.value })}>
                                    <option value="review">Customer Review</option><option value="ad">Advertisement</option>
                                </select>
                            </div>
                        </div>
                        <div><label className="sn-label">Caption</label><input className="sn-input" value={editing.caption} data-testid="vf-caption" placeholder="Loved the fit!" onChange={(e) => setEditing({ ...editing, caption: e.target.value })} /></div>
                        <div><label className="sn-label">Attach Product</label>
                            <select className="sn-input" value={editing.product_id} data-testid="vf-product" onChange={(e) => setEditing({ ...editing, product_id: e.target.value })}>
                                <option value="">None</option>
                                {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="sn-label">Video File (mp4/webm, max 80MB)</label>
                            {editing.video ? (
                                <div className="flex items-center gap-3">
                                    <video src={editing.video} className="h-28 w-20 rounded-xl bg-black object-cover" muted />
                                    <label className="sn-btn-outline cursor-pointer !py-2 text-xs" data-testid="vf-replace">
                                        Replace
                                        <input type="file" accept="video/*" className="hidden" onChange={onVideoFile} />
                                    </label>
                                </div>
                            ) : (
                                <label className={`flex cursor-pointer flex-col items-center gap-2 rounded-2xl border border-dashed border-border bg-surface p-8 text-sm text-muted-foreground transition-colors hover:border-primary/50 ${uploading ? "opacity-50" : ""}`} data-testid="vf-upload">
                                    <Clapperboard size={22} className="text-primary" />
                                    {uploading ? "Uploading…" : "Click to upload video"}
                                    <input type="file" accept="video/*" className="hidden" disabled={uploading} onChange={onVideoFile} data-testid="vf-file" />
                                </label>
                            )}
                        </div>
                        <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={editing.active} data-testid="vf-active" onChange={(e) => setEditing({ ...editing, active: e.target.checked })} /> Live on storefront</label>
                        <button className="sn-btn-primary w-full" data-testid="vf-save" disabled={uploading}>Save Video</button>
                    </form>
                )}
            </Modal>
        </div>
    );
}
