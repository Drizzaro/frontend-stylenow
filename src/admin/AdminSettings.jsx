import { useEffect, useState, useCallback } from "react";
import { Plus, Trash2 } from "lucide-react";import { toast } from "sonner";
import { api, fmtErr } from "@/lib/api";
import { TableSkeleton } from "@/components/Skeletons";

export default function AdminSettings() {
    const [settings, setSettings] = useState(null);
    const [synonyms, setSynonyms] = useState(null);
    const [syn, setSyn] = useState({ keyword: "", synonyms: "" });

    const load = useCallback(() => {
        api.get("/admin/settings").then(({ data }) => setSettings(data.settings)).catch(() => setSettings({}));
        api.get("/admin/synonyms").then(({ data }) => setSynonyms(data.items)).catch(() => setSynonyms([]));
    }, []);
    useEffect(() => { load(); }, [load]);

    if (!settings || !synonyms) return <TableSkeleton rows={6} cols={3} />;

    const num = (k) => (e) => setSettings({ ...settings, [k]: e.target.value });

    const save = async (e) => {
        e?.preventDefault();
        try {
            await api.put("/admin/settings", {
                delivery_fee: Number(settings.delivery_fee), delivery_eta_min: Number(settings.delivery_eta_min),
                delivery_eta_max: Number(settings.delivery_eta_max), points_per_spin: Number(settings.points_per_spin),
                points_per_rupee: Number(settings.points_per_rupee), points_value_rupee: Number(settings.points_value_rupee), low_stock_threshold: Number(settings.low_stock_threshold),
                spin_enabled: !!settings.spin_enabled, city: settings.city, brand_accent: settings.brand_accent,
                social_links: settings.social_links || {},
                contact_phones: (settings.contact_phones || []).filter((p) => p.number && p.number.trim()),
                try_at_doorstep_threshold: Number(settings.try_at_doorstep_threshold ?? 499),
                try_at_doorstep_fee: Number(settings.try_at_doorstep_fee ?? 50),
                try_at_doorstep_enabled: !!settings.try_at_doorstep_enabled,
            });
            toast.success("Settings saved");
        } catch (err) { toast.error(fmtErr(err)); }
    };

    const addSynonym = async (e) => {
        e.preventDefault();
        try {
            await api.post("/admin/synonyms", { keyword: syn.keyword, synonyms: syn.synonyms.split(",").map((s) => s.trim()).filter(Boolean) });
            toast.success("Synonym group added"); setSyn({ keyword: "", synonyms: "" }); load();
        } catch (err) { toast.error(fmtErr(err)); }
    };

    return (
        <div className="max-w-3xl space-y-8" data-testid="admin-settings">
            <h1 className="font-display text-2xl font-black">Settings</h1>

            <form onSubmit={save} className="sn-card space-y-4 p-6" data-testid="settings-form">
                <h2 className="font-display font-bold">Store & Delivery</h2>
                <div className="grid grid-cols-2 gap-4">
                    <div><label className="sn-label">City</label><input className="sn-input" value={settings.city || ""} data-testid="set-city" onChange={(e) => setSettings({ ...settings, city: e.target.value })} /></div>
                    <div><label className="sn-label">Delivery Fee ₹ (0 = free)</label><input className="sn-input" type="number" min={0} value={settings.delivery_fee ?? 0} data-testid="set-delivery-fee" onChange={num("delivery_fee")} /></div>
                    <div><label className="sn-label">ETA Min (minutes)</label><input className="sn-input" type="number" value={settings.delivery_eta_min ?? 30} data-testid="set-eta-min" onChange={num("delivery_eta_min")} /></div>
                    <div><label className="sn-label">ETA Max (minutes)</label><input className="sn-input" type="number" value={settings.delivery_eta_max ?? 60} data-testid="set-eta-max" onChange={num("delivery_eta_max")} /></div>
                    <div><label className="sn-label">Points per ₹1 spent</label><input className="sn-input" type="number" step="0.01" value={settings.points_per_rupee ?? 0.05} data-testid="set-points-rupee" onChange={num("points_per_rupee")} /></div>
                    <div><label className="sn-label">Points per Spin</label><input className="sn-input" type="number" value={settings.points_per_spin ?? 50} data-testid="set-points-spin" onChange={num("points_per_spin")} /></div>
                    <div><label className="sn-label">₹ value per StylePoint</label><input className="sn-input" type="number" step="0.1" value={settings.points_value_rupee ?? 1} data-testid="set-points-value" onChange={num("points_value_rupee")} /></div>
                    <div><label className="sn-label">Low Stock Threshold</label><input className="sn-input" type="number" value={settings.low_stock_threshold ?? 5} data-testid="set-low-stock" onChange={num("low_stock_threshold")} /></div>
                    <div><label className="sn-label">Try-at-Doorstep Free Above ₹</label><input className="sn-input" type="number" value={settings.try_at_doorstep_threshold ?? 499} data-testid="set-try-threshold" onChange={num("try_at_doorstep_threshold")} /></div>
                    <div><label className="sn-label">Try-at-Doorstep Fee ₹</label><input className="sn-input" type="number" value={settings.try_at_doorstep_fee ?? 50} data-testid="set-try-fee" onChange={num("try_at_doorstep_fee")} /></div>
                    <div><label className="sn-label">Brand Accent</label><input className="sn-input" value={settings.brand_accent || "#BD8EE4"} data-testid="set-accent" onChange={(e) => setSettings({ ...settings, brand_accent: e.target.value })} /></div>
                </div>
                <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={!!settings.try_at_doorstep_enabled} data-testid="set-try-enabled" onChange={(e) => setSettings({ ...settings, try_at_doorstep_enabled: e.target.checked })} /> Enable Try at Doorstep</label>
                <button className="sn-btn-primary" data-testid="settings-save">Save Settings</button>
            </form>

            <div className="sn-card space-y-4 p-6" data-testid="social-settings">
                <h2 className="font-display font-bold">Social Links & Contact Numbers</h2>
                <p className="text-xs text-muted-foreground">Shown in the storefront footer. Leave a social URL empty to hide its icon.</p>
                <div className="grid grid-cols-2 gap-4">
                    {[["facebook", "Facebook URL"], ["instagram", "Instagram URL"], ["x", "X (Twitter) URL"], ["youtube", "YouTube URL"], ["pinterest", "Pinterest URL"], ["whatsapp", "WhatsApp (number or wa.me link)"]].map(([k, label]) => (
                        <div key={k}><label className="sn-label">{label}</label>
                            <input className="sn-input" value={(settings.social_links || {})[k] || ""} data-testid={`set-social-${k}`}
                                onChange={(e) => setSettings({ ...settings, social_links: { ...(settings.social_links || {}), [k]: e.target.value } })} />
                        </div>
                    ))}
                </div>
                <div>
                    <div className="mb-2 flex items-center justify-between">
                        <label className="sn-label !mb-0">Contact Numbers (Call popup in footer)</label>
                        <button type="button" onClick={() => setSettings({ ...settings, contact_phones: [...(settings.contact_phones || []), { label: "", number: "" }] })} data-testid="add-phone-btn" className="text-xs font-bold text-primary">+ Add Number</button>
                    </div>
                    <div className="space-y-2">
                        {(settings.contact_phones || []).map((p, i) => (
                            <div key={i} className="flex items-center gap-2" data-testid={`phone-row-${i}`}>
                                <input className="sn-input !w-44" placeholder="Label" value={p.label} data-testid={`phone-label-${i}`}
                                    onChange={(e) => { const ph = [...settings.contact_phones]; ph[i] = { ...ph[i], label: e.target.value }; setSettings({ ...settings, contact_phones: ph }); }} />
                                <input className="sn-input flex-1" placeholder="+91 98765 43210" value={p.number} data-testid={`phone-number-${i}`}
                                    onChange={(e) => { const ph = [...settings.contact_phones]; ph[i] = { ...ph[i], number: e.target.value }; setSettings({ ...settings, contact_phones: ph }); }} />
                                <button type="button" onClick={() => setSettings({ ...settings, contact_phones: settings.contact_phones.filter((_, j) => j !== i) })} data-testid={`phone-remove-${i}`}
                                    className="rounded-lg p-2 text-destructive hover:bg-destructive/10"><Trash2 size={14} /></button>
                            </div>
                        ))}
                    </div>
                </div>
                <button type="button" onClick={save} data-testid="social-save" className="sn-btn-primary">Save Social Links & Numbers</button>
            </div>

            <div className="sn-card space-y-4 p-6" data-testid="synonyms-panel">
                <h2 className="font-display font-bold">Search Synonyms</h2>
                <p className="text-xs text-muted-foreground">Groups of equivalent terms. Searching any word matches the whole group.</p>
                <div className="space-y-2">
                    {synonyms.map((s) => (
                        <div key={s.id} className="flex items-center gap-3 rounded-xl bg-surface px-3 py-2.5 text-sm" data-testid={`synonym-row-${s.id}`}>
                            <span className="font-extrabold text-primary">{s.keyword}</span>
                            <span className="text-muted-foreground">→ {s.synonyms.join(", ") || "—"}</span>
                            <button onClick={async () => { await api.delete(`/admin/synonyms/${s.id}`); load(); }} data-testid={`synonym-delete-${s.id}`} className="ml-auto p-1 text-destructive hover:bg-destructive/10 rounded-lg"><Trash2 size={13} /></button>
                        </div>
                    ))}
                </div>
                <form onSubmit={addSynonym} className="flex flex-wrap items-end gap-3">
                    <div><label className="sn-label">Keyword</label><input className="sn-input !w-40" required value={syn.keyword} data-testid="syn-keyword" onChange={(e) => setSyn({ ...syn, keyword: e.target.value })} placeholder="baggy" /></div>
                    <div className="flex-1"><label className="sn-label">Synonyms (comma separated)</label><input className="sn-input" value={syn.synonyms} data-testid="syn-list" onChange={(e) => setSyn({ ...syn, synonyms: e.target.value })} placeholder="oversized, loose fit, relaxed fit" /></div>
                    <button className="sn-btn-outline !py-2.5 text-xs" data-testid="syn-add"><Plus size={13} /> Add</button>
                </form>
            </div>
        </div>
    );
}
