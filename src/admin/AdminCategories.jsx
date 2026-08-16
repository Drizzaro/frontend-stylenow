import { useEffect, useState, useCallback, useRef } from "react";
import { Plus, Pencil, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { api, fmtErr, uploadFile } from "@/lib/api";
import { TableSkeleton } from "@/components/Skeletons";
import { Modal } from "@/components/Modal";

const EMPTY = { name: "", image: "", active: true, sort: 0 };

export default function AdminCategories() {
    const [items, setItems] = useState(null);
    const [editing, setEditing] = useState(null);
    const catFileRef = useRef(null);

    const onCatFile = async (e) => {
        const f = e.target.files?.[0];
        e.target.value = "";
        if (!f) return;
        try {
            const { url } = await uploadFile(f);
            setEditing((cur) => ({ ...cur, image: url }));
            toast.success("Image uploaded");
        } catch (err) { toast.error(fmtErr(err, "Upload failed")); }
    };

    const load = useCallback(() => api.get("/admin/categories").then(({ data }) => setItems(data.items)).catch(() => setItems([])), []);
    useEffect(() => { load(); }, [load]);

    const save = async (e) => {
        e.preventDefault();
        try {
            if (editing.id) await api.put(`/admin/categories/${editing.id}`, editing);
            else await api.post("/admin/categories", editing);
            toast.success("Category saved");
            setEditing(null); load();
        } catch (err) { toast.error(fmtErr(err)); }
    };

    return (
        <div className="space-y-5" data-testid="admin-categories">
            <div className="flex items-center justify-between">
                <h1 className="font-display text-2xl font-black">Categories</h1>
                <button onClick={() => setEditing({ ...EMPTY })} data-testid="category-create-btn" className="sn-btn-primary"><Plus size={15} /> New Category</button>
            </div>
            {!items ? <TableSkeleton rows={4} cols={4} /> : (
                <div className="sn-card overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead><tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                            <th className="p-3">Name</th><th className="p-3">Slug</th><th className="p-3">Image</th><th className="p-3">Status</th><th className="p-3"></th>
                        </tr></thead>
                        <tbody>
                            {items.map((c) => (
                                <tr key={c.id} className="border-b border-border last:border-0" data-testid={`category-row-${c.id}`}>
                                    <td className="p-3 font-bold">{c.name}</td>
                                    <td className="p-3 text-muted-foreground">{c.slug}</td>
                                    <td className="p-3">{c.image ? <img src={c.image} alt="" className="h-9 w-9 rounded-lg object-cover" /> : "—"}</td>
                                    <td className="p-3"><span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${c.active ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}>{c.active ? "Active" : "Hidden"}</span></td>
                                    <td className="p-3">
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => setEditing({ ...c })} data-testid={`category-edit-${c.id}`} className="rounded-lg p-1.5 text-primary hover:bg-primary/10"><Pencil size={14} /></button>
                                            <button onClick={async () => { await api.delete(`/admin/categories/${c.id}`); toast.success("Deleted"); load(); }} data-testid={`category-delete-${c.id}`} className="rounded-lg p-1.5 text-destructive hover:bg-destructive/10"><Trash2 size={14} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {!items.length && <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No categories yet.</td></tr>}
                        </tbody>
                    </table>
                </div>
            )}
            <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? "Edit Category" : "New Category"} testId="category-modal">
                {editing && (
                    <form onSubmit={save} className="space-y-4">
                        <div><label className="sn-label">Name</label><input className="sn-input" required value={editing.name} data-testid="cf-name" onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></div>
                        <div><label className="sn-label">Image</label>
                            <div className="flex gap-2">
                                <input className="sn-input flex-1" value={editing.image} data-testid="cf-image" placeholder="Paste URL or upload →" onChange={(e) => setEditing({ ...editing, image: e.target.value })} />
                                <button type="button" onClick={() => catFileRef.current?.click()} data-testid="cf-upload" className="sn-btn-outline shrink-0 !px-3 !py-2 text-xs"><Upload size={13} /> Upload</button>
                                <input ref={catFileRef} type="file" accept="image/*" className="hidden" onChange={onCatFile} />
                            </div>
                            {editing.image && <img src={editing.image} alt="" className="mt-2 h-16 w-16 rounded-lg object-cover" />}
                        </div>
                        <div><label className="sn-label">Sort Order</label><input className="sn-input" type="number" value={editing.sort} data-testid="cf-sort" onChange={(e) => setEditing({ ...editing, sort: Number(e.target.value) })} /></div>
                        <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={editing.active} data-testid="cf-active" onChange={(e) => setEditing({ ...editing, active: e.target.checked })} /> Active</label>
                        <button className="sn-btn-primary w-full" data-testid="cf-save">Save Category</button>
                    </form>
                )}
            </Modal>
        </div>
    );
}
