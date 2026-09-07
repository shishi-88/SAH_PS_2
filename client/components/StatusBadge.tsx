import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";
import { useApp } from "@/state/AppProvider";
import type { GapLifecycle, GapUrgency } from "@/domain/types";

const urgencyConfig: Record<GapUrgency, { labelKey: string; classes: string }> = {
  persistent: {
    labelKey: "sb.persistent",
    classes: "bg-status-priority/25 text-status-priority-foreground",
  },
  watch: {
    labelKey: "sb.watch",
    classes: "bg-status-attention/30 text-status-attention-foreground",
  },
  new: {
    labelKey: "sb.new",
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
  const { language } = useApp();
  if (status === "resolved") {
    return (
      <span
        className={cn(
          "inline-flex items-center rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground",
          className,
        )}
      >
        {t(language, "sb.closed")}
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
      {t(language, config.labelKey)}
    </span>
  );
}
