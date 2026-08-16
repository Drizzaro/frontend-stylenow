import { useEffect, useState, useCallback, useRef } from "react";
import { Plus, Pencil, Trash2, PackageSearch, PackageX, X, Upload } from "lucide-react";
import { toast } from "sonner";
import { api, inr, fmtErr, uploadFile } from "@/lib/api";
import { TableSkeleton } from "@/components/Skeletons";
import { Modal } from "@/components/Modal";

const EMPTY_PRODUCT = {
    name: "", description: "", category_id: "", subcategory: "", brand: "", gender: "",
    material: "", fabric: "", tags: [], images: [], seo_title: "", seo_description: "",
    featured: false, active: true,
    variants: [{ id: "", sku: "", color: "", size: "", price: "", mrp: "", stock: 0, images: [] }],
};

export default function AdminProducts() {
    const [data, setData] = useState(null);
    const [categories, setCategories] = useState([]);
    const [q, setQ] = useState("");
    const [editing, setEditing] = useState(null);
    const [tagInput, setTagInput] = useState("");
    const [stockModal, setStockModal] = useState(null);
    const [stockForm, setStockForm] = useState({ change: 1, reason: "manual adjustment" });
    const fileRef = useRef(null);
    const uploadTarget = useRef(null);

    const pickFile = (target) => { uploadTarget.current = target; fileRef.current?.click(); };

    const onFile = async (e) => {
        const f = e.target.files?.[0];
        e.target.value = "";
        if (!f) return;
        try {
            const { url } = await uploadFile(f);
            const t = uploadTarget.current;
            if (t === "product") {
                if ((editing.images || []).length >= 12) { toast.error("Max 12 images per product"); return; }
                setEditing({ ...editing, images: [...(editing.images || []), url] });
            } else {
                const vs = [...editing.variants];
                if ((vs[t].images || []).length >= 12) { toast.error("Max 12 images per variant"); return; }
                vs[t] = { ...vs[t], images: [...(vs[t].images || []), url] };
                setEditing({ ...editing, variants: vs });
            }
            toast.success("Image uploaded");
        } catch (err) { toast.error(fmtErr(err, "Upload failed")); }
    };

    const load = useCallback(() => {
        api.get("/admin/products", { params: { q, limit: 60 } }).then(({ data }) => setData(data)).catch(() => setData({ items: [], total: 0 }));
    }, [q]);
    useEffect(() => { load(); }, [load]);
    useEffect(() => { api.get("/admin/categories").then(({ data }) => setCategories(data.items)).catch(() => {}); }, []);

    const save = async (e) => {
        e.preventDefault();
        const body = {
            ...editing,
            variants: editing.variants.map((v) => ({ ...v, price: Number(v.price), mrp: Number(v.mrp) || Number(v.price), stock: Number(v.stock) })),
        };
        try {
            if (editing.id) await api.put(`/admin/products/${editing.id}`, body);
            else await api.post("/admin/products", body);
            toast.success(editing.id ? "Product updated" : "Product created");
            setEditing(null); load();
        } catch (err) { toast.error(fmtErr(err)); }
    };

    const setVariant = (i, k, v) => {
        const variants = [...editing.variants];
        variants[i] = { ...variants[i], [k]: v };
        setEditing({ ...editing, variants });
    };

    const adjustStock = async (e) => {
        e.preventDefault();
        try {
            await api.post(`/admin/products/${stockModal.productId}/stock`, { variant_id: stockModal.variantId, change: Number(stockForm.change), reason: stockForm.reason });
            toast.success("Stock updated");
            setStockModal(null); load();
        } catch (err) { toast.error(fmtErr(err)); }
    };

    return (
        <div className="space-y-5" data-testid="admin-products">
            <div className="flex items-center justify-between">
                <h1 className="font-display text-2xl font-black">Products & Inventory</h1>
                <button onClick={() => setEditing({ ...EMPTY_PRODUCT })} data-testid="product-create-btn" className="sn-btn-primary"><Plus size={15} /> New Product</button>
            </div>
            <div className="flex items-center gap-2">
                <PackageSearch size={16} className="text-muted-foreground" />
                <input className="sn-input max-w-xs !py-2" placeholder="Search name, tag, brand…" value={q} data-testid="product-search" onChange={(e) => setQ(e.target.value)} />
            </div>
            {!data ? <TableSkeleton rows={6} cols={6} /> : (
                <div className="sn-card overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead><tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                            <th className="p-3">Product</th><th className="p-3">Category</th><th className="p-3">Variants</th><th className="p-3">Price From</th><th className="p-3">Stock</th><th className="p-3">Tags</th><th className="p-3">Status</th><th className="p-3"></th>
                        </tr></thead>
                        <tbody>
                            {data.items.map((p) => {
                                const stock = (p.variants || []).reduce((n, v) => n + (v.stock || 0), 0);
                                const price = Math.min(...(p.variants || []).map((v) => v.price || 0), Infinity);
                                return (
                                    <tr key={p.id} className="border-b border-border last:border-0 hover:bg-surface" data-testid={`product-row-${p.id}`}>
                                        <td className="p-3"><span className="font-bold">{p.name}</span><br /><span className="text-xs text-muted-foreground">{p.brand || "—"}</span></td>
                                        <td className="p-3">{p.category_name || "—"}</td>
                                        <td className="p-3">{p.variants?.length || 0}</td>
                                        <td className="p-3 font-bold">{price === Infinity ? "—" : inr(price)}</td>
                                        <td className="p-3"><span className={`font-bold ${stock === 0 ? "text-destructive" : stock <= 5 ? "text-warning" : ""}`}>{stock}</span></td>
                                        <td className="p-3"><span className="text-xs text-muted-foreground">{(p.tags || []).slice(0, 3).join(", ")}{(p.tags || []).length > 3 ? "…" : ""}</span></td>
                                        <td className="p-3"><span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${!p.active ? "bg-destructive/15 text-destructive" : p.out_of_stock ? "bg-warning/15 text-warning" : "bg-success/15 text-success"}`}>{!p.active ? "Hidden" : p.out_of_stock ? "Out of Stock" : "Active"}</span></td>
                                        <td className="p-3">
                                            <div className="flex gap-2 justify-end">
                                                <button onClick={async () => { await api.put(`/admin/products/${p.id}/availability`, { out_of_stock: !p.out_of_stock }); toast.success(p.out_of_stock ? "Product back in stock" : "Whole product marked out of stock"); load(); }}
                                                    data-testid={`product-oos-${p.id}`} title={p.out_of_stock ? "Mark in stock" : "Mark whole product out of stock"}
                                                    className={`rounded-lg p-1.5 ${p.out_of_stock ? "text-success hover:bg-success/10" : "text-warning hover:bg-warning/10"}`} aria-label="Toggle out of stock"><PackageX size={14} /></button>
                                                <button onClick={() => setEditing({ ...p, tags: [...(p.tags || [])], variants: p.variants.map((v) => ({ images: [], ...v })) })} data-testid={`product-edit-${p.id}`} className="rounded-lg p-1.5 text-primary hover:bg-primary/10" aria-label="Edit"><Pencil size={14} /></button>
                                                {p.active && <button onClick={async () => { await api.delete(`/admin/products/${p.id}`); toast.success("Product hidden"); load(); }} data-testid={`product-delete-${p.id}`} className="rounded-lg p-1.5 text-destructive hover:bg-destructive/10" aria-label="Hide"><Trash2 size={14} /></button>}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {!data.items.length && <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">No products yet. Create your first product to open the store.</td></tr>}
                        </tbody>
                    </table>
                </div>
            )}

            <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? "Edit Product" : "New Product"} testId="product-modal" wide>
                {editing && (
                    <form onSubmit={save} className="space-y-4 text-sm">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="col-span-2"><label className="sn-label">Name</label><input className="sn-input" required value={editing.name} data-testid="pf-name" onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></div>
                            <div><label className="sn-label">Category</label>
                                <select className="sn-input" value={editing.category_id} data-testid="pf-category" onChange={(e) => setEditing({ ...editing, category_id: e.target.value })}>
                                    <option value="">Select…</option>
                                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div><label className="sn-label">Brand</label><input className="sn-input" value={editing.brand} data-testid="pf-brand" onChange={(e) => setEditing({ ...editing, brand: e.target.value })} /></div>
                            <div><label className="sn-label">Gender</label>
                                <select className="sn-input" value={editing.gender} data-testid="pf-gender" onChange={(e) => setEditing({ ...editing, gender: e.target.value })}>
                                    <option value="">—</option><option value="men">Men</option><option value="women">Women</option><option value="kids">Kids</option><option value="unisex">Unisex</option>
                                </select>
                            </div>
                            <div><label className="sn-label">Material / Fabric</label><input className="sn-input" value={editing.material} data-testid="pf-material" onChange={(e) => setEditing({ ...editing, material: e.target.value })} /></div>
                            <div className="col-span-2"><label className="sn-label">Description</label><textarea className="sn-input" rows={3} value={editing.description} data-testid="pf-description" onChange={(e) => setEditing({ ...editing, description: e.target.value })} /></div>
                            <div className="col-span-2">
                                <label className="sn-label">Product Images (max 12) — upload or paste URLs</label>
                                <div className="mb-2 flex flex-wrap items-center gap-2">
                                    {(editing.images || []).map((im, i) => (
                                        <div key={i} className="relative h-16 w-14 overflow-hidden rounded-lg border border-border">
                                            <img src={im} alt="" className="h-full w-full object-cover" />
                                            <button type="button" onClick={() => setEditing({ ...editing, images: editing.images.filter((_, j) => j !== i) })}
                                                className="absolute right-0.5 top-0.5 rounded-full bg-black/70 p-0.5 text-white"><X size={10} /></button>
                                        </div>
                                    ))}
                                    <button type="button" onClick={() => pickFile("product")} data-testid="pf-upload"
                                        className="flex h-16 w-14 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary">
                                        <Upload size={14} /><span className="text-[9px] font-bold">Upload</span>
                                    </button>
                                </div>
                                <textarea className="sn-input font-mono text-xs" rows={2} value={(editing.images || []).join("\n")} data-testid="pf-images"
                                    onChange={(e) => setEditing({ ...editing, images: e.target.value.split("\n").map((s) => s.trim()).filter(Boolean).slice(0, 12) })} />
                            </div>
                            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} data-testid="pf-file-input" />
                            <div className="col-span-2">
                                <label className="sn-label">Search Tags (press Enter to add — hidden from customers, powers search)</label>
                                <div className="flex flex-wrap items-center gap-2 rounded-xl border border-input bg-surface-elevated p-2" data-testid="pf-tags">
                                    {editing.tags.map((t, i) => (
                                        <span key={i} className="flex items-center gap-1 rounded-full bg-primary/15 px-2.5 py-1 text-xs font-bold text-primary">
                                            {t}<button type="button" onClick={() => setEditing({ ...editing, tags: editing.tags.filter((_, j) => j !== i) })}><X size={11} /></button>
                                        </span>
                                    ))}
                                    <input className="min-w-28 flex-1 bg-transparent px-1 py-1 text-xs outline-none" placeholder="oversized, baggy, black tee…" value={tagInput} data-testid="pf-tag-input"
                                        onChange={(e) => setTagInput(e.target.value)}
                                        onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); const t = tagInput.trim().toLowerCase(); if (t && !editing.tags.includes(t)) setEditing({ ...editing, tags: [...editing.tags, t] }); setTagInput(""); } }} />
                                </div>
                            </div>
                        </div>
                        <div>
                            <div className="mb-2 flex items-center justify-between">
                                <label className="sn-label !mb-0">Variants</label>
                                <button type="button" onClick={() => setEditing({ ...editing, variants: [...editing.variants, { id: "", sku: "", color: "", size: "", price: "", mrp: "", stock: 0, images: [] }] })} data-testid="variant-add" className="text-xs font-bold text-primary">+ Add Variant</button>
                            </div>
                            <div className="space-y-2">
                                {editing.variants.map((v, i) => (
                                    <div key={i} className="grid grid-cols-7 items-end gap-2 rounded-xl border border-border p-3" data-testid={`variant-row-${i}`}>
                                        <div><label className="sn-label">SKU</label><input className="sn-input !px-2 !py-1.5 text-xs" value={v.sku} data-testid={`variant-sku-${i}`} onChange={(e) => setVariant(i, "sku", e.target.value)} /></div>
                                        <div><label className="sn-label">Color</label><input className="sn-input !px-2 !py-1.5 text-xs" value={v.color} data-testid={`variant-color-${i}`} onChange={(e) => setVariant(i, "color", e.target.value)} /></div>
                                        <div><label className="sn-label">Size</label><input className="sn-input !px-2 !py-1.5 text-xs" value={v.size} data-testid={`variant-size-${i}`} onChange={(e) => setVariant(i, "size", e.target.value)} /></div>
                                        <div><label className="sn-label">Price ₹</label><input className="sn-input !px-2 !py-1.5 text-xs" type="number" required value={v.price} data-testid={`variant-price-${i}`} onChange={(e) => setVariant(i, "price", e.target.value)} /></div>
                                        <div><label className="sn-label">MRP ₹</label><input className="sn-input !px-2 !py-1.5 text-xs" type="number" value={v.mrp} data-testid={`variant-mrp-${i}`} onChange={(e) => setVariant(i, "mrp", e.target.value)} /></div>
                                        <div><label className="sn-label">Stock</label><input className="sn-input !px-2 !py-1.5 text-xs" type="number" value={v.stock} data-testid={`variant-stock-${i}`} onChange={(e) => setVariant(i, "stock", e.target.value)} /></div>
                                        <button type="button" onClick={() => setEditing({ ...editing, variants: editing.variants.filter((_, j) => j !== i) })} className="rounded-lg p-2 text-destructive hover:bg-destructive/10" aria-label="Remove variant"><X size={14} /></button>
                                        <div className="col-span-7 flex items-center gap-2">
                                            <input className="sn-input !py-1.5 flex-1 font-mono text-xs" placeholder="Variant image URLs (comma separated, max 12)" value={(v.images || []).join(", ")} data-testid={`variant-images-${i}`}
                                                onChange={(e) => setVariant(i, "images", e.target.value.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 12))} />
                                            <button type="button" onClick={() => pickFile(i)} data-testid={`variant-upload-${i}`}
                                                className="flex shrink-0 items-center gap-1 rounded-lg border border-dashed border-border px-2.5 py-1.5 text-[10px] font-bold text-muted-foreground transition-colors hover:border-primary hover:text-primary">
                                                <Upload size={11} /> Upload
                                            </button>
                                        </div>
                                        <div className="col-span-7 flex items-center gap-3">
                                            <label className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[10px] font-bold transition-colors ${v.out_of_stock ? "border-destructive/50 bg-destructive/10 text-destructive" : "border-border text-muted-foreground"}`}>
                                                <input type="checkbox" checked={!!v.out_of_stock} data-testid={`variant-oos-${i}`}
                                                    onChange={(e) => setVariant(i, "out_of_stock", e.target.checked)} />
                                                Out of stock
                                            </label>
                                            <span className="text-[10px] text-muted-foreground">Stock number is preserved — the variant just becomes unavailable on the storefront.</span>
                                        </div>
                                        <div className="col-span-7 flex flex-wrap gap-1.5">
                                            {(v.images || []).map((im, k) => (
                                                <div key={k} className="relative h-10 w-8 overflow-hidden rounded-md border border-border">
                                                    <img src={im} alt="" className="h-full w-full object-cover" />
                                                    <button type="button" onClick={() => setVariant(i, "images", v.images.filter((_, j) => j !== k))}
                                                        className="absolute right-0 top-0 rounded-bl bg-black/70 p-0.5 text-white"><X size={8} /></button>
                                                </div>
                                            ))}
                                            <span className="self-center text-[10px] text-muted-foreground">{(v.images || []).length}/12</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div><label className="sn-label">SEO Title</label><input className="sn-input" value={editing.seo_title} data-testid="pf-seo-title" onChange={(e) => setEditing({ ...editing, seo_title: e.target.value })} /></div>
                            <div><label className="sn-label">SEO Description</label><input className="sn-input" value={editing.seo_description} data-testid="pf-seo-desc" onChange={(e) => setEditing({ ...editing, seo_description: e.target.value })} /></div>
                        </div>
                        <label className="flex items-center gap-2 text-sm font-semibold">
                            <input type="checkbox" checked={editing.featured} data-testid="pf-featured" onChange={(e) => setEditing({ ...editing, featured: e.target.checked })} /> Featured product
                        </label>
                        <button className="sn-btn-primary w-full" data-testid="pf-save">{editing.id ? "Save Changes" : "Create Product"}</button>
                    </form>
                )}
            </Modal>

            <Modal open={!!stockModal} onClose={() => setStockModal(null)} title="Adjust Stock" testId="stock-modal">
                {stockModal && (
                    <form onSubmit={adjustStock} className="space-y-4">
                        <p className="text-sm text-muted-foreground">{stockModal.label}</p>
                        <div><label className="sn-label">Change (+ add / − remove)</label><input className="sn-input" type="number" required value={stockForm.change} data-testid="stock-change" onChange={(e) => setStockForm({ ...stockForm, change: e.target.value })} /></div>
                        <div><label className="sn-label">Reason</label><input className="sn-input" value={stockForm.reason} data-testid="stock-reason" onChange={(e) => setStockForm({ ...stockForm, reason: e.target.value })} /></div>
                        <button className="sn-btn-primary w-full" data-testid="stock-save">Update Stock</button>
                    </form>
                )}
            </Modal>
        </div>
    );
}
