import { cn } from "@/lib/utils";
import type { GapLifecycle, GapUrgency } from "@/domain/types";

const urgencyConfig: Record<GapUrgency, { label: string; classes: string }> = {
  persistent: {
    label: "Needs extra time",
    classes: "bg-status-priority/25 text-status-priority-foreground",
  },
  watch: {
    label: "Keep practising",
    classes: "bg-status-attention/30 text-status-attention-foreground",
  },
  new: {
    label: "Newly noticed",
    classes: "bg-primary/15 text-primary",
  },
};

export default function StatusBadge({
  urgency,
  status,
  className,
}: {
  urgency?: GapUrgency;
  status?: GapLifecycle;
  className?: string;
}) {
  if (status === "resolved") {
    return (
      <span
        className={cn(
          "inline-flex items-center rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground",
          className,
        )}
      >
        Closed
      </span>
    );
  }
  const config = urgencyConfig[urgency ?? "new"];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
        config.classes,
        className,
      )}
    >
      {config.label}
    </span>
  );
}
