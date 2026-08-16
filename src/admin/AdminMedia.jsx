import { useEffect, useState, useCallback, useRef } from "react";
import { Upload, Trash2, Copy, Film, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { api, uploadFile, fmtErr } from "@/lib/api";
import { Skeleton } from "@/components/Skeletons";

export default function AdminMedia() {
    const [items, setItems] = useState(null);
    const [kind, setKind] = useState("");
    const [uploading, setUploading] = useState(false);
    const fileRef = useRef(null);

    const load = useCallback(() => {
        api.get("/admin/files", { params: { kind } }).then(({ data }) => setItems(data.items)).catch(() => setItems([]));
    }, [kind]);
    useEffect(() => { load(); }, [load]);

    const onFiles = async (e) => {
        const files = Array.from(e.target.files || []);
        e.target.value = "";
        if (!files.length) return;
        setUploading(true);
        for (const f of files) {
            try {
                await uploadFile(f);
                toast.success(`${f.name} uploaded`);
            } catch (err) { toast.error(fmtErr(err, `${f.name} failed`)); }
        }
        setUploading(false);
        load();
    };

    const copyUrl = (f) => {
        navigator.clipboard.writeText(`${window.location.origin}${f.url}`).then(() => toast.success("URL copied"));
    };

    const remove = async (f) => {
        await api.delete(`/admin/files/${f.id}`);
        toast.success("File removed");
        load();
    };

    return (
        <div className="space-y-5" data-testid="admin-media">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-display text-2xl font-black">Media Library</h1>
                    <p className="text-sm text-muted-foreground">All uploaded images & videos. Stored in cloud object storage, tracked in the database.</p>
                </div>
                <button onClick={() => fileRef.current?.click()} disabled={uploading} data-testid="media-upload-btn" className="sn-btn-primary">
                    <Upload size={15} /> {uploading ? "Uploading…" : "Upload Files"}
                </button>
                <input ref={fileRef} type="file" multiple accept="image/*,video/*" className="hidden" onChange={onFiles} data-testid="media-file-input" />
            </div>

            <div className="flex gap-1 border-b border-border">
                {[["", "All"], ["image", "Images"], ["video", "Videos"]].map(([k, l]) => (
                    <button key={k} onClick={() => setKind(k)} data-testid={`media-tab-${k || "all"}`}
                        className={`relative px-4 py-2.5 text-sm font-semibold transition-colors ${kind === k ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                        {l}{kind === k && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded bg-primary" />}
                    </button>
                ))}
            </div>

            {!items ? (
                <div className="grid grid-cols-3 gap-4 xl:grid-cols-6">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="aspect-square rounded-2xl" />)}</div>
            ) : items.length === 0 ? (
                <div className="sn-card p-10 text-center text-sm text-muted-foreground" data-testid="media-empty">No files yet. Upload product images or video clips.</div>
            ) : (
                <div className="grid grid-cols-3 gap-4 xl:grid-cols-6">
                    {items.map((f) => (
                        <div key={f.id} className="group sn-card overflow-hidden" data-testid={`media-item-${f.id}`}>
                            <div className="relative aspect-square bg-surface">
                                {f.kind === "video" ? (
                                    <video src={f.url} muted loop playsInline preload="metadata" className="h-full w-full object-cover"
                                        onMouseEnter={(e) => e.target.play()} onMouseLeave={(e) => e.target.pause()} />
                                ) : (
                                    <img src={f.url} alt={f.original_filename} loading="lazy" className="h-full w-full object-cover" />
                                )}
                                <span className="absolute left-2 top-2 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-bold text-white">
                                    {f.kind === "video" ? <Film size={10} className="mr-1 inline" /> : <ImageIcon size={10} className="mr-1 inline" />}
                                    {(f.size / 1024 / 1024).toFixed(1)}MB
                                </span>
                            </div>
                            <div className="space-y-1 p-2.5">
                                <p className="truncate text-xs font-semibold" title={f.original_filename}>{f.original_filename}</p>
                                <div className="flex items-center justify-between">
                                    <button onClick={() => copyUrl(f)} data-testid={`media-copy-${f.id}`} className="flex items-center gap-1 text-[11px] font-bold text-primary hover:underline"><Copy size={11} /> Copy URL</button>
                                    <button onClick={() => remove(f)} data-testid={`media-delete-${f.id}`} className="p-1 text-destructive hover:bg-destructive/10 rounded-lg" aria-label="Delete"><Trash2 size={13} /></button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
