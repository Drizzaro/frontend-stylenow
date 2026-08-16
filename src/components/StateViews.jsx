import { PackageOpen, AlertTriangle } from "lucide-react";

export function EmptyState({ title = "Nothing here yet", message = "", actionLabel, onAction, icon, testId = "empty-state" }) {
    const Icon = icon || PackageOpen;
    return (
        <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-border bg-surface px-6 py-16 text-center" data-testid={testId}>
            <div className="rounded-full bg-primary/15 p-4 text-primary">
                <Icon size={28} />
            </div>
            <h3 className="font-display text-lg font-bold">{title}</h3>
            {message && <p className="max-w-sm text-sm text-muted-foreground">{message}</p>}
            {actionLabel && (
                <button onClick={onAction} data-testid={`${testId}-action`} className="sn-btn-primary mt-2">{actionLabel}</button>
            )}
        </div>
    );
}

export function ErrorState({ message = "Unable to load this right now", onRetry, testId = "error-state" }) {
    return (
        <div className="flex flex-col items-center gap-3 rounded-3xl border border-border bg-surface px-6 py-16 text-center" data-testid={testId}>
            <div className="rounded-full bg-destructive/10 p-4 text-destructive">
                <AlertTriangle size={28} />
            </div>
            <h3 className="font-display text-lg font-bold">{message}</h3>
            {onRetry && (
                <button onClick={onRetry} data-testid={`${testId}-retry`} className="sn-btn-outline mt-2">Retry</button>
            )}
        </div>
    );
}
