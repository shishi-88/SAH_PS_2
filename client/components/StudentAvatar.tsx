import { cn } from "@/lib/utils";
import type { AvatarTint } from "@/domain/types";

const tintClasses: Record<AvatarTint, string> = {
  teal: "bg-avatar-teal/20 text-avatar-teal",
  coral: "bg-avatar-coral/20 text-avatar-coral",
  yellow: "bg-avatar-yellow/25 text-avatar-yellow",
  lilac: "bg-avatar-lilac/20 text-avatar-lilac",
  sand: "bg-avatar-yellow/25 text-avatar-yellow",
  sage: "bg-avatar-teal/20 text-avatar-teal",
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
        tintClasses[tint] ?? tintClasses.yellow,
        sizeClasses,
        className,
      )}
    >
      {initial}
    </span>
  );
}
