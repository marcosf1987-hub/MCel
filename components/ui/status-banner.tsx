import { cn } from "@/lib/utils";
import { CheckCircle2, AlertCircle, Info, Loader2 } from "lucide-react";

export type StatusType = "idle" | "loading" | "success" | "error" | "info";

export function StatusBanner({
  type,
  message,
  className,
}: {
  type: StatusType;
  message: string | null;
  className?: string;
}) {
  if (!message || type === "idle") return null;

  const styles = {
    loading: "border-[var(--color-brand-light)] bg-[var(--color-brand-cream)] text-[var(--color-brown)]",
    success: "border-green-300 bg-green-50 text-green-900",
    error: "border-red-300 bg-red-50 text-red-900",
    info: "border-[var(--color-border)] bg-[var(--color-secondary)] text-[var(--color-neutral)]",
  };

  const Icon = {
    loading: Loader2,
    success: CheckCircle2,
    error: AlertCircle,
    info: Info,
  }[type];

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex items-start gap-3 rounded-xl border px-4 py-3 text-sm",
        styles[type],
        className
      )}
    >
      <Icon
        className={cn("mt-0.5 h-5 w-5 shrink-0", type === "loading" && "animate-spin")}
      />
      <span>{message}</span>
    </div>
  );
}
