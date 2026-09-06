import { cn } from "@/lib/utils";
import type { AvatarTint } from "@/domain/types";

const tintClasses: Record<AvatarTint, string> = {
  teal: "bg-primary/15 text-primary",
  coral: "bg-secondary/20 text-secondary",
  sand: "bg-status-attention/25 text-status-attention-foreground",
  sage: "bg-status-ontrack/20 text-status-ontrack-foreground",
};

export default function StudentAvatar({
  name,
  tint,
  size = "md",
  className,
}: {
  name: string;
  tint: AvatarTint;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  const sizeClasses =
    size === "lg"
      ? "h-14 w-14 text-lg"
      : size === "sm"
        ? "h-9 w-9 text-sm"
        : "h-11 w-11 text-base";

  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-heading font-bold",
        tintClasses[tint],
        sizeClasses,
        className,
      )}
    >
      {initial}
    </span>
  );
}
