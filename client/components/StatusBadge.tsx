import { cn } from "@/lib/utils";
import type { GapStatus } from "@/lib/mock-data";

const statusConfig: Record<GapStatus, { label: string; classes: string }> = {
  priority: {
    label: "Priority",
    classes: "bg-status-priority/25 text-status-priority-foreground",
  },
  attention: {
    label: "Needs attention",
    classes: "bg-status-attention/30 text-status-attention-foreground",
  },
  ontrack: {
    label: "On track",
    classes: "bg-status-ontrack/25 text-status-ontrack-foreground",
  },
  resolved: {
    label: "Resolved",
    classes: "bg-muted text-muted-foreground",
  },
};

export default function StatusBadge({
  status,
  className,
}: {
  status: GapStatus;
  className?: string;
}) {
  const config = statusConfig[status];
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
