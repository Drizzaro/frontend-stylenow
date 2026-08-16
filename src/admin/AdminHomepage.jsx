import { useEffect, useState, useCallback, useRef } from "react";
import { Plus, Trash2, Pencil, ArrowUp, ArrowDown, Upload } from "lucide-react";
import { toast } from "sonner";
import { api, fmtErr, uploadFile } from "@/lib/api";
import { TableSkeleton } from "@/components/Skeletons";
import { Modal } from "@/components/Modal";

const EMPTY_TICKER = { text: "", icon: "tag", link: "", active: true, sort: 0, start_at: "", end_at: "" };
const EMPTY_BANNER = { title: "", subtitle: "", image: "", link: "", active: true, sort: 0 };
const SECTION_TYPES = [["trending", "Trending (auto)"], ["new", "New Arrivals (auto)"], ["category", "Category"], ["products", "Hand-picked Products"]];

export default function AdminHomepage() {
    const [data, setData] = useState(null);
    const [categories, setCategories] = useState([]);
    const [editTicker, setEditTicker] = useState(null);
    const [editBanner, setEditBanner] = useState(null);
    const bannerFileRef = useRef(null);

    const onBannerFile = async (e) => {
        const f = e.target.files?.[0];
        e.target.value = "";
        if (!f) return;
        try {
            const { url } = await uploadFile(f);
            setEditBanner((cur) => ({ ...cur, image: url }));
            toast.success("Image uploaded");
        } catch (err) { toast.error(fmtErr(err, "Upload failed")); }
    };

    const load = useCallback(() => api.get("/admin/homepage").then(({ data }) => setData(data)).catch(() => setData({ ticker: [], banners: [], sections: [] })), []);
    useEffect(() => { load(); api.get("/admin/categories").then(({ data }) => setCategories(data.items)).catch(() => {}); }, [load]);

    const saveTicker = async (e) => {
        e.preventDefault();
        try {
            if (editTicker.id) await api.put(`/admin/homepage/ticker/${editTicker.id}`, editTicker);
            else await api.post("/admin/homepage/ticker", editTicker);
            toast.success("Ticker deal saved"); setEditTicker(null); load();
        } catch (err) { toast.error(fmtErr(err)); }
    };

    const saveBanner = async (e) => {
        e.preventDefault();
        try {
            if (editBanner.id) await api.put(`/admin/homepage/banners/${editBanner.id}`, editBanner);
            else await api.post("/admin/homepage/banners", editBanner);
            toast.success("Banner saved"); setEditBanner(null); load();
        } catch (err) { toast.error(fmtErr(err)); }
    };

    const moveSection = async (i, dir) => {
        const sections = [...data.sections];
        const j = i + dir;
        if (j < 0 || j >= sections.length) return;
        [sections[i], sections[j]] = [sections[j], sections[i]];
        const ordered = sections.map((s, k) => ({ ...s, sort: k + 1 }));
        setData({ ...data, sections: ordered });
        await api.put("/admin/homepage/sections", { sections: ordered });
        toast.success("Section order saved");
    };

    const toggleSection = async (i) => {
        const sections = data.sections.map((s, k) => (k === i ? { ...s, enabled: !s.enabled } : s));
        setData({ ...data, sections });
        await api.put("/admin/homepage/sections", { sections });
    };

    if (!data) return <TableSkeleton rows={6} cols={4} />;

    return (
        <div className="space-y-8" data-testid="admin-homepage">
            <h1 className="font-display text-2xl font-black">Homepage Management</h1>

            <section className="space-y-3">
                <div className="flex items-center justify-between">
                    <h2 className="font-display text-lg font-bold">Top Deal Ticker</h2>
                    <button onClick={() => setEditTicker({ ...EMPTY_TICKER })} data-testid="ticker-create-btn" className="sn-btn-outline !py-2 text-xs"><Plus size={13} /> Add Deal</button>
                </div>
                <div className="sn-card divide-y divide-border">
                    {data.ticker.map((t) => (
                        <div key={t.id} className="flex items-center gap-3 p-3 text-sm" data-testid={`ticker-row-${t.id}`}>
                            <span className="flex-1 font-semibold">{t.text}</span>
                            {t.link && <span className="text-xs text-muted-foreground">{t.link}</span>}
                            <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${t.active ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}>{t.active ? "Live" : "Off"}</span>
                            <button onClick={() => setEditTicker({ ...t })} data-testid={`ticker-edit-${t.id}`} className="p-1.5 text-primary hover:bg-primary/10 rounded-lg"><Pencil size={13} /></button>
                            <button onClick={async () => { await api.delete(`/admin/homepage/ticker/${t.id}`); load(); }} data-testid={`ticker-delete-${t.id}`} className="p-1.5 text-destructive hover:bg-destructive/10 rounded-lg"><Trash2 size={13} /></button>
                        </div>
                    ))}
                    {!data.ticker.length && <p className="p-6 text-center text-sm text-muted-foreground">No ticker deals. The strip is hidden on the storefront.</p>}
                </div>
            </section>

            <section className="space-y-3">
                <div className="flex items-center justify-between">
                    <h2 className="font-display text-lg font-bold">Hero Banners</h2>
                    <button onClick={() => setEditBanner({ ...EMPTY_BANNER })} data-testid="banner-create-btn" className="sn-btn-outline !py-2 text-xs"><Plus size={13} /> Add Banner</button>
                </div>
                <div className="sn-card divide-y divide-border">
                    {data.banners.map((b) => (
                        <div key={b.id} className="flex items-center gap-3 p-3 text-sm" data-testid={`banner-row-${b.id}`}>
                            {b.image && <img src={b.image} alt="" className="h-10 w-16 rounded-lg object-cover" />}
                            <span className="flex-1 font-semibold">{b.title}</span>
                            <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${b.active ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}>{b.active ? "Live" : "Off"}</span>
                            <button onClick={() => setEditBanner({ ...b })} data-testid={`banner-edit-${b.id}`} className="p-1.5 text-primary hover:bg-primary/10 rounded-lg"><Pencil size={13} /></button>
                            <button onClick={async () => { await api.delete(`/admin/homepage/banners/${b.id}`); load(); }} data-testid={`banner-delete-${b.id}`} className="p-1.5 text-destructive hover:bg-destructive/10 rounded-lg"><Trash2 size={13} /></button>
                        </div>
                    ))}
                    {!data.banners.length && <p className="p-6 text-center text-sm text-muted-foreground">No banners — the default StyleNow hero is shown.</p>}
                </div>
            </section>

            <section className="space-y-3">
                <h2 className="font-display text-lg font-bold">Sections (drag-free reorder)</h2>
                <div className="sn-card divide-y divide-border">
                    {data.sections.map((s, i) => (
                        <div key={s.key} className="flex items-center gap-3 p-3 text-sm" data-testid={`section-row-${s.key}`}>
                            <span className="flex-1 font-semibold">{s.title} <span className="ml-2 rounded bg-secondary px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground">{s.type}</span></span>
                            <button onClick={() => moveSection(i, -1)} data-testid={`section-up-${s.key}`} className="p-1.5 hover:bg-secondary rounded-lg" aria-label="Move up"><ArrowUp size={13} /></button>
                            <button onClick={() => moveSection(i, 1)} data-testid={`section-down-${s.key}`} className="p-1.5 hover:bg-secondary rounded-lg" aria-label="Move down"><ArrowDown size={13} /></button>
                            <button onClick={() => toggleSection(i)} data-testid={`section-toggle-${s.key}`}
                                className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${s.enabled ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}>
                                {s.enabled ? "Visible" : "Hidden"}
                            </button>
                        </div>
                    ))}
                    {!data.sections.length && <p className="p-6 text-center text-sm text-muted-foreground">No sections configured.</p>}
                </div>
            </section>

            <Modal open={!!editTicker} onClose={() => setEditTicker(null)} title="Ticker Deal" testId="ticker-modal">
                {editTicker && (
                    <form onSubmit={saveTicker} className="space-y-4">
                        <div><label className="sn-label">Text</label><input className="sn-input" required value={editTicker.text} data-testid="tf-text" onChange={(e) => setEditTicker({ ...editTicker, text: e.target.value })} placeholder="EXTRA 10% OFF TODAY" /></div>
                        <div className="grid grid-cols-2 gap-3">
                            <div><label className="sn-label">Icon</label>
                                <select className="sn-input" value={editTicker.icon} data-testid="tf-icon" onChange={(e) => setEditTicker({ ...editTicker, icon: e.target.value })}>
                                    <option value="tag">Tag</option><option value="truck">Truck</option><option value="zap">Lightning</option><option value="gift">Gift</option>
                                </select>
                            </div>
                            <div><label className="sn-label">Link (optional)</label><input className="sn-input" value={editTicker.link} data-testid="tf-link" onChange={(e) => setEditTicker({ ...editTicker, link: e.target.value })} placeholder="/products" /></div>
                            <div><label className="sn-label">Start (optional)</label><input className="sn-input" type="datetime-local" value={editTicker.start_at?.slice(0, 16) || ""} onChange={(e) => setEditTicker({ ...editTicker, start_at: e.target.value ? new Date(e.target.value).toISOString() : "" })} /></div>
                            <div><label className="sn-label">End (optional)</label><input className="sn-input" type="datetime-local" value={editTicker.end_at?.slice(0, 16) || ""} onChange={(e) => setEditTicker({ ...editTicker, end_at: e.target.value ? new Date(e.target.value).toISOString() : "" })} /></div>
                        </div>
                        <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={editTicker.active} data-testid="tf-active" onChange={(e) => setEditTicker({ ...editTicker, active: e.target.checked })} /> Live</label>
                        <button className="sn-btn-primary w-full" data-testid="tf-save">Save</button>
                    </form>
                )}
            </Modal>

            <Modal open={!!editBanner} onClose={() => setEditBanner(null)} title="Hero Banner" testId="banner-modal">
                {editBanner && (
                    <form onSubmit={saveBanner} className="space-y-4">
                        <div><label className="sn-label">Title</label><input className="sn-input" required value={editBanner.title} data-testid="bf-title" onChange={(e) => setEditBanner({ ...editBanner, title: e.target.value })} /></div>
                        <div><label className="sn-label">Subtitle</label><input className="sn-input" value={editBanner.subtitle} data-testid="bf-subtitle" onChange={(e) => setEditBanner({ ...editBanner, subtitle: e.target.value })} /></div>
                        <div><label className="sn-label">Image</label>
                            <div className="flex gap-2">
                                <input className="sn-input flex-1" required value={editBanner.image} data-testid="bf-image" placeholder="Paste URL or upload →" onChange={(e) => setEditBanner({ ...editBanner, image: e.target.value })} />
                                <button type="button" onClick={() => bannerFileRef.current?.click()} data-testid="bf-upload" className="sn-btn-outline shrink-0 !px-3 !py-2 text-xs"><Upload size={13} /> Upload</button>
                                <input ref={bannerFileRef} type="file" accept="image/*" className="hidden" onChange={onBannerFile} />
                            </div>
                            {editBanner.image && <img src={editBanner.image} alt="" className="mt-2 h-20 w-36 rounded-lg object-cover" />}
                        </div>
                        <div><label className="sn-label">Link</label><input className="sn-input" value={editBanner.link} data-testid="bf-link" onChange={(e) => setEditBanner({ ...editBanner, link: e.target.value })} placeholder="/products" /></div>
                        <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={editBanner.active} data-testid="bf-active" onChange={(e) => setEditBanner({ ...editBanner, active: e.target.checked })} /> Live</label>
                        <button className="sn-btn-primary w-full" data-testid="bf-save">Save Banner</button>
                    </form>
                )}
            </Modal>
        </div>
    );
}
