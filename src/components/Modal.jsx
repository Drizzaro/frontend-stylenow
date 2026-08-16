import { X } from "lucide-react";

export function Modal({ open, onClose, title, children, testId = "modal", wide = false }) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center p-0 sm:p-6" data-testid={testId}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-scale-in" onClick={onClose} />
            <div className={`relative w-full ${wide ? "sm:max-w-3xl" : "sm:max-w-md"} max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl border border-border bg-card p-6 shadow-2xl animate-fade-up`}>
                <div className="mb-4 flex items-center justify-between">
                    <h3 className="font-display text-lg font-bold">{title}</h3>
                    <button onClick={onClose} data-testid={`${testId}-close`} className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground" aria-label="Close">
                        <X size={18} />
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
}
