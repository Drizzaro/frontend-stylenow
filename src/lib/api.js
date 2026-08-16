import axios from "axios";

export const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export function guestId() {
    let g = localStorage.getItem("sn-guest");
    if (!g) {
        g = Math.random().toString(36).slice(2) + Date.now().toString(36);
        localStorage.setItem("sn-guest", g);
    }
    return g;
}

export const api = axios.create({ baseURL: API, withCredentials: true });

api.interceptors.request.use((cfg) => {
    cfg.headers["X-Guest-Id"] = guestId();
    return cfg;
});

export const inr = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

export function fmtErr(e, fallback = "Something went wrong. Please try again.") {
    const d = e?.response?.data?.detail;
    if (!d) return e?.message && !e?.response ? e.message : fallback;
    if (typeof d === "string") return d;
    if (Array.isArray(d)) return d.map((x) => x?.msg || "").filter(Boolean).join(" ") || fallback;
    return String(d);
}

export const ORDER_STEPS = ["placed", "confirmed", "preparing", "packed", "out_for_delivery", "delivered"];

export const STATUS_LABELS = {
    placed: "Placed", confirmed: "Confirmed", preparing: "Preparing", packed: "Packed",
    rider_assigned: "Rider Assigned", out_for_delivery: "Out for Delivery", delivered: "Delivered",
    cancelled: "Cancelled", returned: "Returned", refunded: "Refunded",
};

export const STATUS_COLORS = {
    placed: "bg-info/15 text-info", confirmed: "bg-info/15 text-info",
    preparing: "bg-warning/15 text-warning", packed: "bg-warning/15 text-warning",
    out_for_delivery: "bg-primary/20 text-primary", delivered: "bg-success/15 text-success",
    cancelled: "bg-destructive/15 text-destructive", returned: "bg-destructive/15 text-destructive",
    refunded: "bg-destructive/15 text-destructive",
};

export const PAYMENT_LABELS = { paid: "Paid", pending: "Payment Pending", cod: "Cash on Delivery", refunded: "Refunded" };

export async function uploadFile(file) {
    const fd = new FormData();
    fd.append("file", file);
    const { data } = await api.post("/admin/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
    return data;
}

export async function uploadUserFile(file) {
    const fd = new FormData();
    fd.append("file", file);
    const { data } = await api.post("/uploads", fd, { headers: { "Content-Type": "multipart/form-data" } });
    return data;
}
